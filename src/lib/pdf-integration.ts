import * as pdfjsLib from 'pdfjs-dist';
import { Canvas as FabricCanvas, Circle, Rect, Line, Textbox, FabricObject } from 'fabric';
import debounce from 'lodash.debounce';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
// Configure PDF.js worker via unpkg .mjs (user-specified)
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://app.unpkg.com/pdfjs-dist@5.4.149/files/build/pdf.worker.mjs';

export interface PDFPage {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  drawingCanvas: FabricCanvas;
  viewport: any;
}

export interface DrawingTool {
  type: 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'text' | 'highlighter';
  color: string;
  width: number;
  opacity?: number;
}

export class PDFViewer {
  private pdfDocument: any = null;
  private currentPage = 1;
  private totalPages = 0;
  private scale = 1.0;
  private container: HTMLElement;
  private pages: Map<number, PDFPage> = new Map();
  private currentTool: DrawingTool = { type: 'pen', color: '#000000', width: 2 };
  private isDrawingMode = false;
  private pdfId: string | null = null;
  
  // Debounced save functions
  private debouncedSaveDrawing = debounce(this.saveDrawingToServer.bind(this), 800);
  private periodicSave: NodeJS.Timeout | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.setupPeriodicSave();
    // Re-render current page on resize to keep perfect fit
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = debounce(() => {
    if (!this.pdfDocument) return;
    this.rerenderAllPages();
  }, 150);

  async loadPDF(file: File | string | null, pdfId?: string): Promise<void> {
    try {
      // Clean up any previous document and canvases
      this.pages.forEach((page) => page.drawingCanvas.dispose());
      this.pages.clear();
      this.container.innerHTML = '';

      let loadingTask;

      // Prefer loading by pdfId when provided
      if (pdfId) {
        this.pdfId = pdfId;
        
        try {
          // Try signed URL first
          const signedUrl = await this.getSignedUrl(pdfId);
          if (signedUrl) {
            loadingTask = pdfjsLib.getDocument({ url: signedUrl, cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.149/cmaps/', cMapPacked: true });
          } else {
            throw new Error('Failed to get signed URL');
          }
        } catch (signedUrlError) {
          console.warn('Signed URL failed, trying fallback methods:', signedUrlError);
          
          // Fallback: Try public URL
          try {
            const publicUrl = await this.getPublicUrl(pdfId);
            if (publicUrl) {
              loadingTask = pdfjsLib.getDocument({ url: publicUrl, cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.149/cmaps/', cMapPacked: true });
            } else {
              throw new Error('Failed to get public URL');
            }
          } catch (publicUrlError) {
            console.warn('Public URL failed, trying ArrayBuffer fallback:', publicUrlError);
            
            // Final fallback: Fetch as ArrayBuffer
            const arrayBuffer = await this.fetchAsArrayBuffer(pdfId);
            loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.149/cmaps/', cMapPacked: true });
          }
        }
      } else if (typeof file === 'string' && file) {
        // Load from a direct URL string
        loadingTask = pdfjsLib.getDocument({ url: file, cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.149/cmaps/', cMapPacked: true });
      } else if (file instanceof File) {
        // Load from local file (preview before upload)
        const arrayBuffer = await file.arrayBuffer();
        loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.149/cmaps/', cMapPacked: true });
      } else {
        throw new Error('No PDF source provided');
      }

      try {
        this.pdfDocument = await loadingTask.promise;
      } catch (e) {
        try {
          if (typeof file === 'string' && file) {
            console.warn('Primary URL load failed, retrying with ArrayBuffer', e);
            const resp = await fetch(file);
            const arrayBuffer = await resp.arrayBuffer();
            const fallbackTask = pdfjsLib.getDocument({ data: arrayBuffer, cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.149/cmaps/', cMapPacked: true });
            this.pdfDocument = await fallbackTask.promise;
          } else if (this.pdfId) {
            console.warn('Primary load failed, retrying with direct download ArrayBuffer', e);
            const arrayBuffer = await this.fetchAsArrayBuffer(this.pdfId);
            const fallbackTask = pdfjsLib.getDocument({ data: arrayBuffer, cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.149/cmaps/', cMapPacked: true });
            this.pdfDocument = await fallbackTask.promise;
          } else {
            throw e;
          }
        } catch (fallbackError) {
          throw fallbackError;
        }
      }
      this.totalPages = this.pdfDocument.numPages;
      this.currentPage = 1;

      console.log('PDF loaded successfully, total pages:', this.totalPages);
      // Render all pages sequentially for a scrollable document
      await this.renderAllPages();
      await this.goToPage(1);
      toast({ title: "Success", description: "PDF loaded successfully" });
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast({ title: "Error", description: "Failed to load PDF", variant: "destructive" });
    }
  }

  async renderPage(pageNumber: number): Promise<void> {
    if (!this.pdfDocument || pageNumber < 1 || pageNumber > this.totalPages) return;

    // If this page already exists, remove and re-render to apply new scale/layout
    const existingCanvas = this.container.querySelector(`canvas[data-page="${pageNumber}"]`) as HTMLCanvasElement | null;
    const existingOverlay = this.container.querySelector(`#drawing-overlay-${pageNumber}`) as HTMLCanvasElement | null;
    const existingWrapper = this.container.querySelector(`[data-page-container="${pageNumber}"]`) as HTMLDivElement | null;
    if (existingOverlay) {
      const existingFabric = this.pages.get(pageNumber)?.drawingCanvas;
      existingFabric?.dispose();
      existingOverlay.remove();
      this.pages.delete(pageNumber);
    }
    if (existingCanvas) existingCanvas.remove();
    if (!existingWrapper) {
      // Create a wrapper for this page so overlay can be absolutely positioned
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-page-container', pageNumber.toString());
      wrapper.style.position = 'relative';
      wrapper.style.margin = '0 auto 16px auto';
      wrapper.style.width = '100%';
      this.container.appendChild(wrapper);
    }

    const page = await this.pdfDocument.getPage(pageNumber);

    // Base viewport at scale 1
    const baseViewport = page.getViewport({ scale: 1.0 });

    // Fit to container width
    const containerRect = this.container.getBoundingClientRect();
    const containerWidth = Math.max(0, containerRect.width - 24); // some padding
    const baseScale = containerWidth / baseViewport.width;
    const finalScale = Math.min(baseScale * this.scale, 3.0);

    const viewport = page.getViewport({ scale: finalScale * window.devicePixelRatio });

    // Create canvas and append to wrapper
    const wrapperEl = this.container.querySelector(`[data-page-container="${pageNumber}"]`) as HTMLDivElement;
    let canvas = document.createElement('canvas');
    canvas.setAttribute('data-page', pageNumber.toString());
    canvas.style.display = 'block';
    canvas.style.width = `${viewport.width / window.devicePixelRatio}px`;
    canvas.style.height = `${viewport.height / window.devicePixelRatio}px`;
    canvas.style.margin = '0 auto';
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    wrapperEl.appendChild(canvas);

    const context = canvas.getContext('2d')!;
    const renderContext = { canvasContext: context, viewport };
    await page.render(renderContext).promise;

    // Create drawing overlay on top of this page
    await this.createDrawingOverlay(pageNumber, page.getViewport({ scale: finalScale }));

    this.currentPage = pageNumber;
  }

  // Render all pages sequentially to create a fully scrollable document
  async renderAllPages(): Promise<void> {
    if (!this.pdfDocument) return;
    // Clear existing content
    this.pages.forEach((p) => p.drawingCanvas.dispose());
    this.pages.clear();
    this.container.innerHTML = '';

    for (let i = 1; i <= this.totalPages; i++) {
      // eslint-disable-next-line no-await-in-loop
      await this.renderPage(i);
    }
  }

  // Re-render all pages (e.g., on resize or zoom)
  async rerenderAllPages(): Promise<void> {
    if (!this.pdfDocument) return;
    const current = this.currentPage;
    // Remove all existing page elements
    this.pages.forEach((page) => page.drawingCanvas.dispose());
    this.pages.clear();
    const scrollTopBefore = this.container.scrollTop;
    const scrollHeightBefore = this.container.scrollHeight || 1;

    await this.renderAllPages();

    // Try to maintain scroll position roughly by ratio
    const ratio = scrollTopBefore / scrollHeightBefore;
    const newScrollTop = ratio * (this.container.scrollHeight || 1);
    this.container.scrollTop = newScrollTop;
    this.currentPage = current;
  }

  private async createDrawingOverlay(pageNumber: number, viewport: any): Promise<void> {
    const overlayId = `drawing-overlay-${pageNumber}`;
    let overlayCanvas = this.container.querySelector(`#${overlayId}`) as HTMLCanvasElement;

    // Find the wrapper for this page
    const pdfCanvas = this.container.querySelector(`canvas[data-page="${pageNumber}"]`) as HTMLCanvasElement;
    const pageWrapper = (pdfCanvas?.parentElement as HTMLElement) ?? this.container;

    if (!overlayCanvas) {
      overlayCanvas = document.createElement('canvas');
      overlayCanvas.id = overlayId;
      overlayCanvas.style.position = 'absolute';
      overlayCanvas.style.top = '0';
      overlayCanvas.style.left = '0';
      overlayCanvas.style.zIndex = '10';
      overlayCanvas.style.pointerEvents = 'auto';
      pageWrapper.appendChild(overlayCanvas);
    }

    // Match PDF canvas size
    if (pdfCanvas) {
      const displayWidth = pdfCanvas.width / window.devicePixelRatio;
      const displayHeight = pdfCanvas.height / window.devicePixelRatio;
      overlayCanvas.width = pdfCanvas.width;
      overlayCanvas.height = pdfCanvas.height;
      overlayCanvas.style.width = `${displayWidth}px`;
      overlayCanvas.style.height = `${displayHeight}px`;
      overlayCanvas.style.display = 'block';
    } else {
      overlayCanvas.width = viewport.width * window.devicePixelRatio;
      overlayCanvas.height = viewport.height * window.devicePixelRatio;
      overlayCanvas.style.width = `${viewport.width}px`;
      overlayCanvas.style.height = `${viewport.height}px`;
      overlayCanvas.style.display = 'block';
    }

    const fabricCanvas = new FabricCanvas(overlayCanvas, {
      isDrawingMode: this.isDrawingMode,
      backgroundColor: 'transparent',
    });

    // Configure drawing brush
    fabricCanvas.freeDrawingBrush.color = this.currentTool.color;
    fabricCanvas.freeDrawingBrush.width = this.currentTool.width;

    // Load existing drawings
    await this.loadDrawingForPage(pageNumber, fabricCanvas);

    // Save on changes
    fabricCanvas.on('path:created', () => this.debouncedSaveDrawing(pageNumber, fabricCanvas));
    fabricCanvas.on('object:added', () => this.debouncedSaveDrawing(pageNumber, fabricCanvas));
    fabricCanvas.on('object:modified', () => this.debouncedSaveDrawing(pageNumber, fabricCanvas));

    this.pages.set(pageNumber, {
      pageNumber,
      canvas: this.container.querySelector(`canvas[data-page="${pageNumber}"]`) as HTMLCanvasElement,
      drawingCanvas: fabricCanvas,
      viewport
    });
  }

  setTool(tool: DrawingTool): void {
    this.currentTool = tool;
    this.isDrawingMode = tool.type === 'pen' || tool.type === 'highlighter' || tool.type === 'eraser';
    
    // Update all active canvases
    this.pages.forEach((page) => {
      page.drawingCanvas.isDrawingMode = this.isDrawingMode;
      if (this.isDrawingMode) {
        page.drawingCanvas.freeDrawingBrush.color = tool.color;
        page.drawingCanvas.freeDrawingBrush.width = tool.width;
        
        if (tool.type === 'highlighter') {
          page.drawingCanvas.freeDrawingBrush.color = tool.color;
          (page.drawingCanvas.freeDrawingBrush as any).globalCompositeOperation = 'multiply';
        } else if (tool.type === 'eraser') {
          (page.drawingCanvas.freeDrawingBrush as any).globalCompositeOperation = 'destination-out';
        } else {
          (page.drawingCanvas.freeDrawingBrush as any).globalCompositeOperation = 'source-over';
        }
      }
    });
  }

  addShape(type: 'rectangle' | 'circle' | 'line' | 'arrow' | 'text'): void {
    const currentPageData = this.pages.get(this.currentPage);
    if (!currentPageData) return;

    const canvas = currentPageData.drawingCanvas;
    let shape: FabricObject;

    switch (type) {
      case 'rectangle':
        shape = new Rect({
          left: 100,
          top: 100,
          fill: 'transparent',
          stroke: this.currentTool.color,
          strokeWidth: this.currentTool.width,
          width: 100,
          height: 60
        });
        break;
      
      case 'circle':
        shape = new Circle({
          left: 100,
          top: 100,
          fill: 'transparent',
          stroke: this.currentTool.color,
          strokeWidth: this.currentTool.width,
          radius: 50
        });
        break;
      
      case 'line':
        shape = new Line([50, 100, 200, 100], {
          stroke: this.currentTool.color,
          strokeWidth: this.currentTool.width
        });
        break;
      
      case 'text':
        shape = new Textbox('Text', {
          left: 100,
          top: 100,
          fill: this.currentTool.color,
          fontSize: this.currentTool.width * 8,
          editable: true
        });
        break;
      
      default:
        return;
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    this.debouncedSaveDrawing(this.currentPage, canvas);
  }

  async goToPage(pageNumber: number): Promise<void> {
    if (!this.pdfDocument) return;
    const target = Math.min(Math.max(pageNumber, 1), this.totalPages);

    if (!this.pages.has(target)) {
      await this.renderPage(target);
    }

    const pageWrapper = this.container.querySelector(`[data-page-container="${target}"]`) as HTMLElement | null;
    if (pageWrapper) {
      this.container.scrollTo({ top: pageWrapper.offsetTop, behavior: 'smooth' });
      this.currentPage = target;
    } else {
      // Fallback: scroll to canvas
      const canvas = this.container.querySelector(`canvas[data-page="${target}"]`) as HTMLElement | null;
      if (canvas) {
        this.container.scrollTo({ top: (canvas.parentElement as HTMLElement)?.offsetTop ?? canvas.offsetTop, behavior: 'smooth' });
        this.currentPage = target;
      }
    }
  }

  private async getSignedUrl(pdfId: string): Promise<string | null> {
    try {
      console.log('Getting signed URL for PDF ID:', pdfId);
      
      // Get PDF metadata
      const { data: pdfData, error: metaError } = await supabase
        .from('pdfs')
        .select('*')
        .eq('id', pdfId)
        .single();

      if (metaError || !pdfData) {
        console.error('Error getting PDF metadata:', metaError);
        throw metaError;
      }

      console.log('PDF metadata:', pdfData);

      // Get signed URL for the PDF file
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('pdfs')
        .createSignedUrl(`${pdfData.uploaded_by}/${pdfData.filename}`, 60 * 60); // 1 hour expiry

      if (urlError) {
        console.error('Error getting signed URL:', urlError);
        throw urlError;
      }
      
      console.log('Signed URL created successfully:', signedUrlData.signedUrl);
      return signedUrlData.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  }

  private async getPublicUrl(pdfId: string): Promise<string | null> {
    try {
      console.log('Getting public URL for PDF ID:', pdfId);
      
      // Get PDF metadata
      const { data: pdfData, error: metaError } = await supabase
        .from('pdfs')
        .select('*')
        .eq('id', pdfId)
        .single();

      if (metaError || !pdfData) {
        console.error('Error getting PDF metadata:', metaError);
        throw metaError;
      }

      // Get public URL for the PDF file
      const { data: publicUrlData } = supabase.storage
        .from('pdfs')
        .getPublicUrl(`${pdfData.uploaded_by}/${pdfData.filename}`);
      
      console.log('Public URL created successfully:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error getting public URL:', error);
      return null;
    }
  }

  private async fetchAsArrayBuffer(pdfId: string): Promise<ArrayBuffer> {
    try {
      console.log('Fetching PDF as ArrayBuffer for PDF ID:', pdfId);
      
      // Get PDF metadata
      const { data: pdfData, error: metaError } = await supabase
        .from('pdfs')
        .select('*')
        .eq('id', pdfId)
        .single();

      if (metaError || !pdfData) {
        console.error('Error getting PDF metadata:', metaError);
        throw metaError;
      }

      // Download the file directly
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('pdfs')
        .download(`${pdfData.uploaded_by}/${pdfData.filename}`);

      if (downloadError || !fileData) {
        console.error('Error downloading PDF file:', downloadError);
        throw downloadError;
      }

      console.log('PDF downloaded successfully as blob');
      return await fileData.arrayBuffer();
    } catch (error) {
      console.error('Error fetching PDF as ArrayBuffer:', error);
      throw error;
    }
  }

  private async saveDrawingToServer(pageNumber: number, canvas: FabricCanvas): Promise<void> {
    if (!this.pdfId) return;

    try {
      const drawingData = canvas.toJSON();
      
      const { error } = await supabase.functions.invoke('drawings', {
        body: {
          pdfId: this.pdfId,
          pageNumber,
          drawingData
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving drawing:', error);
    }
  }

  private async loadDrawingForPage(pageNumber: number, canvas: FabricCanvas): Promise<void> {
    if (!this.pdfId) return;

    try {
      const { data, error } = await supabase
        .from('drawings')
        .select('drawing_data')
        .eq('pdf_id', this.pdfId)
        .eq('page_number', pageNumber)
        .maybeSingle();

      if (error) throw error;
      
      if (data?.drawing_data) {
        canvas.loadFromJSON(data.drawing_data as any, () => {
          canvas.renderAll();
        });
      }
    } catch (error) {
      console.error('Error loading drawing:', error);
    }
  }

  private setupPeriodicSave(): void {
    this.periodicSave = setInterval(() => {
      if (this.pdfId && this.pages.has(this.currentPage)) {
        const currentPageData = this.pages.get(this.currentPage)!;
        this.saveDrawingToServer(this.currentPage, currentPageData.drawingCanvas);
      }
    }, 10000); // Save every 10 seconds
  }

  destroy(): void {
    if (this.periodicSave) {
      clearInterval(this.periodicSave);
    }
    window.removeEventListener('resize', this.handleResize);
    this.pages.forEach((page) => {
      page.drawingCanvas.dispose();
    });
    this.pages.clear();
  }

  // Zoom functionality
  zoomIn(): void {
    this.setZoom(this.scale * 1.25);
  }

  zoomOut(): void {
    this.setZoom(this.scale * 0.8);
  }

  resetZoom(): void {
    this.setZoom(1.0);
  }

  private setZoom(newScale: number): void {
    const minScale = 0.25;
    const maxScale = 3.0;
    this.scale = Math.min(Math.max(newScale, minScale), maxScale);
    
    // Re-render all pages with new scale
    if (this.pdfDocument) {
      this.rerenderAllPages();
    }
  }

  private async rerenderCurrentPage(): Promise<void> {
    if (!this.pdfDocument) return;
    
    const pageNum = this.currentPage;
    // Remove existing canvases for current page
    const pageCanvas = this.container.querySelector(`canvas[data-page="${pageNum}"]`);
    const overlayCanvas = this.container.querySelector(`#drawing-overlay-${pageNum}`);
    
    if (pageCanvas) (pageCanvas as HTMLCanvasElement).remove();
    if (overlayCanvas) {
      const fabricCanvas = this.pages.get(pageNum)?.drawingCanvas;
      if (fabricCanvas) fabricCanvas.dispose();
      (overlayCanvas as HTMLCanvasElement).remove();
    }
    
    this.pages.delete(pageNum);
    await this.renderPage(pageNum);
  }

  getZoom(): number {
    return this.scale;
  }

  getCurrentPage(): number { return this.currentPage; }
  getTotalPages(): number { return this.totalPages; }
  getPDFId(): string | null { return this.pdfId; }
}