import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, RotateCw, Download, Share, Bot } from "lucide-react";
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
    if (pdfViewerRef.current && pdfData.file) {
      await pdfViewerRef.current.loadPDF(pdfData.file, pdfData.id);
      setPdfLoaded(true);
      setCurrentPdfId(pdfData.id);
      onPdfIdChange?.(pdfData.id);
      setActualCurrentPage(1);
      setActualTotalPages(pdfViewerRef.current.getTotalPages());
    }
  };
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
    <div className="flex flex-col h-full">
      {/* Viewer Container */}
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="relative w-full h-full max-w-4xl max-h-full">
          {/* PDF Viewer Container */}
          <div className="w-full h-full rounded-xl border-2 border-border bg-surface-dark shadow-elevated animated-border overflow-hidden relative">
            {pdfLoaded ? (
              <>
                {/* PDF Rendering Container */}
                <div 
                  ref={containerRef} 
                  className="w-full h-full relative overflow-auto bg-white"
                  style={{ minHeight: '600px' }}
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
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-dark to-surface-darker">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-primary flex items-center justify-center glow-primary">
                    {isFlipbookMode ? (
                      <BookOpen className="h-12 w-12 text-primary-foreground" />
                    ) : (
                      <FileText className="h-12 w-12 text-primary-foreground" />
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">
                    {isFlipbookMode ? "Flipbook Viewer" : "PDF Viewer"}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    {isFlipbookMode
                      ? "Interactive flipbook reading experience with page-turning animations"
                      : "High-quality PDF document viewer with advanced reading features"}
                  </p>
                  
                  {/* Mock Document Preview */}
                  <div className="w-48 h-64 mx-auto bg-background/10 rounded-lg border border-border/50 flex items-center justify-center mb-6">
                    <div className="text-center">
                      <div className="w-16 h-20 mx-auto mb-3 bg-gradient-primary/20 rounded border border-primary/30"></div>
                      <p className="text-sm text-muted-foreground">Document Preview</p>
                    </div>
                  </div>

                  {user ? (
                    <PDFUploadButton 
                      onPDFUploaded={handlePDFUploaded}
                      className="hover-glow bg-surface-light border-border"
                    />
                  ) : (
                    <Button
                      variant="outline"
                      className="hover-glow bg-surface-light border-border"
                      disabled
                    >
                      <RotateCw className="h-4 w-4 mr-2" />
                      Please Login to Upload
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Viewer Controls Overlay */}
          <div className="absolute top-4 right-4 flex gap-2">
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
        </div>
      </div>

      {/* Page Information Bar */}
      <div className="h-16 border-t border-border bg-surface-dark flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-surface-light border-border">
              {isFlipbookMode ? "Flipbook Mode" : "PDF Mode"}
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
        <div className="flex items-center gap-4">
          {!isMobile ? (
            // Desktop: Page Navigation
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(displayCurrentPage - 1)}
                disabled={displayCurrentPage === 1}
                className="bg-surface-light border-border hover-glow"
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Page</span>
                <Badge variant="secondary" className="bg-primary text-primary-foreground">
                  {displayCurrentPage}
                </Badge>
                <span className="text-sm text-muted-foreground">of {displayTotalPages}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(displayCurrentPage + 1)}
                disabled={displayCurrentPage === displayTotalPages}
                className="bg-surface-light border-border hover-glow"
              >
                Next
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