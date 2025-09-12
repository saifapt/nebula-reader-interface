import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, RotateCw, Download, Share, Bot, Bookmark, StickyNote, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { PDFViewer, DrawingTool } from "@/lib/pdf-integration";
import { PDFUploadButton } from "./PDFUploadButton";
import { DrawingToolbar } from "./DrawingToolbar";
import { useAuth } from "@/hooks/useAuth";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useNotes } from "@/hooks/useNotes";
import { toast } from "@/hooks/use-toast";

interface ViewerPanelProps {
  isFlipbookMode: boolean;
  isMobile: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onAIAssistantOpen: () => void;
  onBookmark?: () => void;
  onAddNote?: () => void;
  externalPage?: number | null;
  onPdfIdChange?: (pdfId: string | null) => void;
  uploadedPdfData?: any;
  onPdfUploaded?: (pdfData: any) => void;
}

export const ViewerPanel = ({ 
  isFlipbookMode, 
  isMobile, 
  currentPage, 
  totalPages, 
  onPageChange,
  onAIAssistantOpen,
  onBookmark,
  onAddNote,
  externalPage,
  onPdfIdChange,
  uploadedPdfData,
  onPdfUploaded,
}: ViewerPanelProps) => {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfViewerRef = useRef<PDFViewer | null>(null);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [currentPdfId, setCurrentPdfId] = useState<string | null>(null);
  const [actualCurrentPage, setActualCurrentPage] = useState(1);
  const [actualTotalPages, setActualTotalPages] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(1.0);
  const [currentTool, setCurrentTool] = useState<DrawingTool>({
    type: 'pen',
    color: '#000000',
    width: 2
  });

  const { addBookmark, isBookmarked } = useBookmarks(currentPdfId || undefined);
  const { addNote } = useNotes(currentPdfId || undefined);

  useEffect(() => {
    if (containerRef.current && !pdfViewerRef.current) {
      pdfViewerRef.current = new PDFViewer(containerRef.current);
    }

    return () => {
      if (pdfViewerRef.current) {
        pdfViewerRef.current.destroy();
        pdfViewerRef.current = null;
      }
    };
  }, []);

  const handlePDFUploaded = async (pdfData: any) => {
    console.log('PDF uploaded, data received:', pdfData);
    onPdfUploaded?.(pdfData);
    
    if (pdfViewerRef.current && pdfData.id) {
      try {
        console.log('Loading PDF with ID:', pdfData.id);
        // Load PDF from Supabase storage using PDF ID
        await pdfViewerRef.current.loadPDF(null, pdfData.id);
        setPdfLoaded(true);
        setCurrentPdfId(pdfData.id);
        onPdfIdChange?.(pdfData.id);
        setActualCurrentPage(1);
        setActualTotalPages(pdfViewerRef.current.getTotalPages());
        console.log('PDF loaded successfully, total pages:', pdfViewerRef.current.getTotalPages());
      } catch (error) {
        console.error('Error loading PDF in viewer:', error);
        toast({ title: "Error", description: "Failed to display PDF", variant: "destructive" });
      }
    }
  };

  // Handle external PDF data changes
  useEffect(() => {
    if (uploadedPdfData && !pdfLoaded) {
      handlePDFUploaded(uploadedPdfData);
    }
  }, [uploadedPdfData]);
  const handlePageChange = async (page: number) => {
    if (!pdfViewerRef.current) {
      toast({ 
        title: "Navigation Error", 
        description: "PDF viewer not initialized.",
        variant: "destructive" 
      });
      return;
    }

    if (!pdfLoaded) {
      toast({ 
        title: "Navigation Error", 
        description: "PDF not loaded yet.",
        variant: "destructive" 
      });
      return;
    }
    
    const max = actualTotalPages || pdfViewerRef.current.getTotalPages() || totalPages || 1;
    const targetPage = Math.min(Math.max(page, 1), max);
    
    if (targetPage === actualCurrentPage) {
      console.log('Already on target page:', targetPage);
      return;
    }
    
    try {
      console.log(`Navigating from page ${actualCurrentPage} to page ${targetPage} (total: ${max})`);
      await pdfViewerRef.current.goToPage(targetPage);
      setActualCurrentPage(targetPage);
      onPageChange(targetPage);
      console.log('Successfully navigated to page:', targetPage);
    } catch (error) {
      console.error('Error navigating to page:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({ 
        title: "Navigation Error", 
        description: `Failed to navigate to page ${targetPage}: ${errorMessage}`,
        variant: "destructive" 
      });
    }
  };

  const handleToolChange = (tool: DrawingTool) => {
    setCurrentTool(tool);
    if (pdfViewerRef.current) {
      pdfViewerRef.current.setTool(tool);
    }
  };

  const handleAddShape = (type: 'rectangle' | 'circle' | 'line' | 'arrow' | 'text') => {
    if (pdfViewerRef.current) {
      pdfViewerRef.current.addShape(type);
    }
  };

  const handleBookmark = async () => {
    if (!currentPdfId) return;
    await addBookmark(actualCurrentPage);
    if (onBookmark) onBookmark();
  };

  const handleAddNote = async () => {
    if (!currentPdfId) return;
    const noteText = prompt('Enter your note:');
    if (noteText) {
      await addNote(actualCurrentPage, noteText);
      if (onAddNote) onAddNote();
    }
  };

  const handleZoomIn = () => {
    if (pdfViewerRef.current && pdfLoaded) {
      pdfViewerRef.current.zoomIn();
      setCurrentZoom(pdfViewerRef.current.getZoom());
    }
  };

  const handleZoomOut = () => {
    if (pdfViewerRef.current && pdfLoaded) {
      pdfViewerRef.current.zoomOut();
      setCurrentZoom(pdfViewerRef.current.getZoom());
    }
  };

  const handleResetZoom = () => {
    if (pdfViewerRef.current && pdfLoaded) {
      pdfViewerRef.current.resetZoom();
      setCurrentZoom(pdfViewerRef.current.getZoom());
    }
  };

  const displayCurrentPage = pdfLoaded ? actualCurrentPage : currentPage;
  const displayTotalPages = pdfLoaded ? actualTotalPages : totalPages;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Viewer Container */}
      <div className="flex-1 p-2 xs:p-3 sm:p-6 flex items-center justify-center min-h-0">
        <div className="relative w-full h-full max-w-4xl max-h-full min-h-[300px] xs:min-h-[400px] sm:min-h-[500px]">
          {/* PDF Viewer Container */}
          <div className="w-full h-full rounded-xl border-2 border-border bg-surface-dark shadow-elevated animated-border overflow-hidden relative min-h-0">
              {/* PDF Rendering Container - always mounted so viewer can init */}
              <div 
                ref={containerRef} 
                className={`w-full h-full relative bg-white ${pdfLoaded ? '' : 'pointer-events-none opacity-0'}`}
                style={{ minHeight: '400px', height: '100%', overflowY: 'auto' }}
              />
              
              {/* Drawing Toolbar */}
              {pdfLoaded && !isMobile && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                  <DrawingToolbar
                    currentTool={currentTool}
                    onToolChange={handleToolChange}
                    onAddShape={handleAddShape}
                    className="bg-surface-dark/90 backdrop-blur-sm"
                  />
                </div>
              )}

              {/* Upload Placeholder Overlay */}
              {!pdfLoaded && (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-dark to-surface-darker z-10 overflow-y-auto">
                  <div className="text-center p-4 w-full max-w-sm mx-auto min-h-full flex flex-col justify-center">
                    {/* Main Icon - Responsive sizing with container queries */}
                    <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto mb-3 sm:mb-4 md:mb-6 rounded-full bg-gradient-primary flex items-center justify-center glow-primary flex-shrink-0">
                      {isFlipbookMode ? (
                        <BookOpen className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-primary-foreground" />
                      ) : (
                        <FileText className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-primary-foreground" />
                      )}
                    </div>
                    
                    {/* Title - Responsive typography */}
                    <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-semibold mb-2 leading-tight">
                      {isFlipbookMode ? "Flipbook Viewer" : "PDF Viewer"}
                    </h3>
                    
                    {/* Description - Responsive text */}
                    <p className="text-muted-foreground mb-3 sm:mb-4 md:mb-6 text-xs xs:text-sm sm:text-base px-2 leading-relaxed">
                      {isFlipbookMode
                        ? "Interactive flipbook reading experience"
                        : "High-quality PDF document viewer"}
                    </p>
                    
                    {/* Mock Document Preview - Responsive sizing */}
                    <div className="w-24 h-32 xs:w-28 xs:h-36 sm:w-32 sm:h-40 md:w-40 md:h-52 lg:w-48 lg:h-64 mx-auto bg-background/10 rounded-lg border border-border/50 flex items-center justify-center mb-3 sm:mb-4 md:mb-6 flex-shrink-0">
                      <div className="text-center">
                        <div className="w-8 h-12 xs:w-10 xs:h-14 sm:w-12 sm:h-16 md:w-14 md:h-18 lg:w-16 lg:h-20 mx-auto mb-1 xs:mb-2 sm:mb-3 bg-gradient-primary/20 rounded border border-primary/30"></div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Document Preview</p>
                      </div>
                    </div>

                    {/* Upload Button - Always visible and properly sized */}
                    <div className="mt-auto pt-2">
                      {user ? (
                        <PDFUploadButton 
                          onPDFUploaded={handlePDFUploaded}
                          className="hover-glow bg-surface-light border-border text-xs xs:text-sm sm:text-base px-3 xs:px-4 py-2 sm:py-3 w-full max-w-xs mx-auto"
                        />
                      ) : (
                        <Button
                          variant="outline"
                          className="hover-glow bg-surface-light border-border text-xs xs:text-sm sm:text-base px-3 xs:px-4 py-2 sm:py-3 w-full max-w-xs mx-auto"
                          disabled
                        >
                          <RotateCw className="h-3 w-3 xs:h-4 xs:w-4 mr-2" />
                          Please Login to Upload
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* Viewer Controls Overlay */}
          <div className="absolute top-4 right-4 flex gap-2 z-30">
            {pdfLoaded && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomOut}
                  className="bg-surface-dark/80 backdrop-blur-sm border-border hover-glow"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleResetZoom}
                  className="bg-surface-dark/80 backdrop-blur-sm border-border hover-glow"
                  title="Reset Zoom"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomIn}
                  className="bg-surface-dark/80 backdrop-blur-sm border-border hover-glow"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="icon"
              className="bg-surface-dark/80 backdrop-blur-sm border-border hover-glow"
              disabled={!pdfLoaded}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="bg-surface-dark/80 backdrop-blur-sm border-border hover-glow"
              disabled={!pdfLoaded}
            >
              <Share className="h-4 w-4" />
            </Button>
          </div>

          {/* Bookmark & Note Icons - Top Left */}
          <div className="absolute top-4 left-4 flex gap-2 z-30">
            <Button
              variant="outline"
              size="icon"
              onClick={handleBookmark}
              disabled={!pdfLoaded}
              className={`bg-surface-dark/80 backdrop-blur-sm border-border hover-glow ${
                pdfLoaded && isBookmarked(actualCurrentPage) ? 'bg-primary/20 text-primary' : ''
              }`}
            >
              <Bookmark className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddNote}
              disabled={!pdfLoaded}
              className="bg-surface-dark/80 backdrop-blur-sm border-border hover-glow"
            >
              <StickyNote className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Page Information Bar */}
      <div className="h-12 sm:h-16 border-t border-border bg-surface-dark flex items-center justify-between px-2 sm:px-6 flex-shrink-0 overflow-hidden">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <Badge variant="outline" className="bg-surface-light border-border text-xs sm:text-sm flex-shrink-0">
              {isFlipbookMode ? "Flipbook" : "PDF"}
            </Badge>
            {!isMobile && pdfLoaded && (
              <div className="flex items-center gap-2 flex-wrap">
                {isBookmarked(actualCurrentPage) && (
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    Bookmarked
                  </Badge>
                )}
                <Badge variant="outline" className="bg-surface-light border-border text-xs">
                  Zoom: {Math.round(currentZoom * 100)}%
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmark}
                  className="h-6 px-2 text-xs"
                >
                  Bookmark Page
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddNote}
                  className="h-6 px-2 text-xs"
                >
                  Add Note
                </Button>
              </div>
            )}
          </div>

        {/* Desktop Navigation & Mobile AI Assistant */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {!isMobile ? (
            // Desktop: Page Navigation
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(displayCurrentPage - 1)}
                disabled={displayCurrentPage === 1}
                className="bg-surface-light border-border hover-glow text-xs sm:text-sm px-2 sm:px-4"
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">←</span>
              </Button>
              
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Page</span>
                <Badge variant="secondary" className="bg-primary text-primary-foreground text-xs sm:text-sm">
                  {displayCurrentPage}
                </Badge>
                <span className="text-xs sm:text-sm text-muted-foreground">of {displayTotalPages}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(displayCurrentPage + 1)}
                disabled={displayCurrentPage === displayTotalPages}
                className="bg-surface-light border-border hover-glow text-xs sm:text-sm px-2 sm:px-4"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">→</span>
              </Button>
            </>
          ) : (
            // Mobile: AI Assistant Icon
            <Button
              variant="outline"
              size="sm"
              onClick={onAIAssistantOpen}
              className="bg-gradient-primary hover:opacity-90 glow-primary flex items-center gap-2"
            >
              <Bot className="h-4 w-4" />
              AI Assistant
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};