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
    const pageNum = this.currentPage;
    // Remove existing canvases for this page so dimensions are recalculated
    const pageCanvas = this.container.querySelector(`canvas[data-page="${pageNum}"]`);
    const overlayCanvas = this.container.querySelector(`#drawing-overlay-${pageNum}`);
    if (pageCanvas) (pageCanvas as HTMLCanvasElement).remove();
    if (overlayCanvas) (overlayCanvas as HTMLCanvasElement).remove();
    this.pages.delete(pageNum);
    this.renderPage(pageNum);
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
      await this.renderPage(1);
      // Hide all other rendered pages just in case
      this.goToPage(1);
      toast({ title: "Success", description: "PDF loaded successfully" });
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast({ title: "Error", description: "Failed to load PDF", variant: "destructive" });
    }
  }

  async renderPage(pageNumber: number): Promise<void> {
    if (!this.pdfDocument || pageNumber < 1 || pageNumber > this.totalPages) return;

    console.log('Rendering page:', pageNumber);
    const page = await this.pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: this.scale * window.devicePixelRatio });
    
    // Create or get canvas
    let canvas = this.container.querySelector(`canvas[data-page="${pageNumber}"]`) as HTMLCanvasElement;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.setAttribute('data-page', pageNumber.toString());
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      this.container.appendChild(canvas);
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // Make canvas responsive
    const containerRect = this.container.getBoundingClientRect();
    const scaleX = containerRect.width / (viewport.width / window.devicePixelRatio);
    const scaleY = containerRect.height / (viewport.height / window.devicePixelRatio);
    const scale = Math.min(scaleX, scaleY, 1);
    
    canvas.style.width = `${(viewport.width / window.devicePixelRatio) * scale}px`;
    canvas.style.height = `${(viewport.height / window.devicePixelRatio) * scale}px`;
    canvas.style.transform = `translate(-50%, -50%) scale(1)`;
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.display = 'block';
    
    const context = canvas.getContext('2d')!;
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    console.log('Starting PDF render with context:', renderContext);
    await page.render(renderContext).promise;
    console.log('PDF page rendered successfully');
    
    // Create drawing overlay
    await this.createDrawingOverlay(pageNumber, viewport);
    this.currentPage = pageNumber;
  }

  private async createDrawingOverlay(pageNumber: number, viewport: any): Promise<void> {
    const overlayId = `drawing-overlay-${pageNumber}`;
    let overlayCanvas = this.container.querySelector(`#${overlayId}`) as HTMLCanvasElement;
    
    if (!overlayCanvas) {
      overlayCanvas = document.createElement('canvas');
      overlayCanvas.id = overlayId;
      overlayCanvas.style.position = 'absolute';
      overlayCanvas.style.top = '0';
      overlayCanvas.style.left = '0';
      overlayCanvas.style.zIndex = '10';
      overlayCanvas.style.pointerEvents = 'auto';
      this.container.appendChild(overlayCanvas);
    }

    // Make overlay responsive and match PDF canvas
    const pdfCanvas = this.container.querySelector(`canvas[data-page="${pageNumber}"]`) as HTMLCanvasElement;
    if (pdfCanvas) {
      const rect = pdfCanvas.getBoundingClientRect();
      overlayCanvas.width = parseInt(pdfCanvas.style.width) || viewport.width / window.devicePixelRatio;
      overlayCanvas.height = parseInt(pdfCanvas.style.height) || viewport.height / window.devicePixelRatio;
      overlayCanvas.style.width = pdfCanvas.style.width;
      overlayCanvas.style.height = pdfCanvas.style.height;
      overlayCanvas.style.transform = pdfCanvas.style.transform;
      overlayCanvas.style.left = pdfCanvas.style.left;
      overlayCanvas.style.top = pdfCanvas.style.top;
      overlayCanvas.style.display = 'block';
    } else {
      overlayCanvas.width = viewport.width / window.devicePixelRatio;
      overlayCanvas.height = viewport.height / window.devicePixelRatio;
      overlayCanvas.style.width = `${viewport.width / window.devicePixelRatio}px`;
      overlayCanvas.style.height = `${viewport.height / window.devicePixelRatio}px`;
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
    if (pageNumber < 1 || pageNumber > this.totalPages) return;
    
    // Hide current page
    this.pages.forEach((page, num) => {
      const pageCanvas = page.canvas;
      const drawingCanvas = page.drawingCanvas.getElement();
      if (num === pageNumber) {
        pageCanvas.style.display = 'block';
        drawingCanvas.style.display = 'block';
      } else {
        pageCanvas.style.display = 'none';
        drawingCanvas.style.display = 'none';
      }
    });

    if (!this.pages.has(pageNumber)) {
      await this.renderPage(pageNumber);
    }
    
    this.currentPage = pageNumber;
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

  getCurrentPage(): number { return this.currentPage; }
  getTotalPages(): number { return this.totalPages; }
  getPDFId(): string | null { return this.pdfId; }
}