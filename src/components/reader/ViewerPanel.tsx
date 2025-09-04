import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, RotateCw, Download, Share, Bot, Bookmark, StickyNote } from "lucide-react";
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
    if (pdfViewerRef.current) {
      await pdfViewerRef.current.goToPage(page);
      setActualCurrentPage(page);
      onPageChange(page);
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

  const displayCurrentPage = pdfLoaded ? actualCurrentPage : currentPage;
  const displayTotalPages = pdfLoaded ? actualTotalPages : totalPages;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Viewer Container */}
      <div className="flex-1 p-3 sm:p-6 flex items-center justify-center min-h-0">
        <div className="relative w-full h-full max-w-4xl max-h-full min-h-0">
          {/* PDF Viewer Container */}
          <div className="w-full h-full rounded-xl border-2 border-border bg-surface-dark shadow-elevated animated-border overflow-hidden relative min-h-0">
            {pdfLoaded ? (
              <>
                {/* PDF Rendering Container */}
                <div 
                  ref={containerRef} 
                  className="w-full h-full relative overflow-auto bg-white"
                  style={{ minHeight: '400px' }}
                />
                
                {/* Drawing Toolbar */}
                {!isMobile && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                    <DrawingToolbar
                      currentTool={currentTool}
                      onToolChange={handleToolChange}
                      onAddShape={handleAddShape}
                      className="bg-surface-dark/90 backdrop-blur-sm"
                    />
                  </div>
                )}
              </>
            ) : (
              /* Upload Placeholder */
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-dark to-surface-darker relative">
                <div className="text-center p-4 max-w-md">
                  <div className="w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-primary flex items-center justify-center glow-primary">
                    {isFlipbookMode ? (
                      <BookOpen className="h-8 sm:h-10 md:h-12 w-8 sm:w-10 md:w-12 text-primary-foreground" />
                    ) : (
                      <FileText className="h-8 sm:h-10 md:h-12 w-8 sm:w-10 md:w-12 text-primary-foreground" />
                    )}
                  </div>
                  
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-2">
                    {isFlipbookMode ? "Flipbook Viewer" : "PDF Viewer"}
                  </h3>
                  <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base px-2">
                    {isFlipbookMode
                      ? "Interactive flipbook reading experience"
                      : "High-quality PDF document viewer"}
                  </p>
                  
                  {/* Mock Document Preview */}
                  <div className="w-32 sm:w-40 md:w-48 h-40 sm:h-52 md:h-64 mx-auto bg-background/10 rounded-lg border border-border/50 flex items-center justify-center mb-4 sm:mb-6">
                    <div className="text-center">
                      <div className="w-12 sm:w-14 md:w-16 h-16 sm:h-18 md:h-20 mx-auto mb-2 sm:mb-3 bg-gradient-primary/20 rounded border border-primary/30"></div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Document Preview</p>
                    </div>
                  </div>

                  <div className="relative z-[100]">
                    {user ? (
                      <PDFUploadButton 
                        onPDFUploaded={handlePDFUploaded}
                        className="hover-glow bg-surface-light border-border text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3 relative z-[100]"
                      />
                    ) : (
                      <Button
                        variant="outline"
                        className="hover-glow bg-surface-light border-border text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3"
                        disabled
                      >
                        <RotateCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
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
            <Button
              variant="outline"
              size="icon"
              className="bg-surface-dark/80 backdrop-blur-sm border-border hover-glow"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="bg-surface-dark/80 backdrop-blur-sm border-border hover-glow"
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
              <div className="flex items-center gap-2">
                {isBookmarked(actualCurrentPage) && (
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    Bookmarked
                  </Badge>
                )}
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