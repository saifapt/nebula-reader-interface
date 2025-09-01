import * as pdfjsLib from 'pdfjs-dist';
import { Canvas as FabricCanvas, Circle, Rect, Line, Textbox, FabricObject } from 'fabric';
import debounce from 'lodash.debounce';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

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
  }

  async loadPDF(file: File | string, pdfId?: string): Promise<void> {
    try {
      let loadingTask;
      
      if (typeof file === 'string') {
        // Load from URL (existing PDF)
        loadingTask = pdfjsLib.getDocument(file);
      } else {
        // Load from local file without uploading (upload handled elsewhere)
        if (pdfId) {
          this.pdfId = pdfId;
        }
        loadingTask = pdfjsLib.getDocument(URL.createObjectURL(file));
      }

      this.pdfDocument = await loadingTask.promise;
      this.totalPages = this.pdfDocument.numPages;
      this.currentPage = 1;
      
      await this.renderPage(1);
      toast({ title: "Success", description: "PDF loaded successfully" });
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast({ title: "Error", description: "Failed to load PDF", variant: "destructive" });
    }
  }

  async renderPage(pageNumber: number): Promise<void> {
    if (!this.pdfDocument || pageNumber < 1 || pageNumber > this.totalPages) return;

    const page = await this.pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: this.scale * window.devicePixelRatio });
    
    // Create or get canvas
    let canvas = this.container.querySelector(`canvas[data-page="${pageNumber}"]`) as HTMLCanvasElement;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.setAttribute('data-page', pageNumber.toString());
      canvas.style.width = `${viewport.width / window.devicePixelRatio}px`;
      canvas.style.height = `${viewport.height / window.devicePixelRatio}px`;
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      this.container.appendChild(canvas);
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const context = canvas.getContext('2d')!;
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    await page.render(renderContext).promise;
    
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

    overlayCanvas.width = viewport.width / window.devicePixelRatio;
    overlayCanvas.height = viewport.height / window.devicePixelRatio;
    overlayCanvas.style.width = `${viewport.width / window.devicePixelRatio}px`;
    overlayCanvas.style.height = `${viewport.height / window.devicePixelRatio}px`;

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

  private async uploadPDF(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', file.name);

    const { data, error } = await supabase.functions.invoke('upload-pdf', {
      body: formData
    });

    if (error) throw error;
    return data;
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
    this.pages.forEach((page) => {
      page.drawingCanvas.dispose();
    });
    this.pages.clear();
  }

  getCurrentPage(): number { return this.currentPage; }
  getTotalPages(): number { return this.totalPages; }
  getPDFId(): string | null { return this.pdfId; }
}