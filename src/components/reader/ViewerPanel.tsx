import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, RotateCw, Download, Share } from "lucide-react";

interface ViewerPanelProps {
  isFlipbookMode: boolean;
  isMobile: boolean;
}

export const ViewerPanel = ({ isFlipbookMode, isMobile }: ViewerPanelProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 200;

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Viewer Container */}
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="relative w-full h-full max-w-4xl max-h-full">
          {/* Viewer Frame */}
          <div className="w-full h-full rounded-xl border-2 border-border bg-surface-dark shadow-elevated animated-border overflow-hidden">
            {/* Viewer Content */}
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-dark to-surface-darker">
              {/* Placeholder for actual viewer */}
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

                <Button
                  variant="outline"
                  className="hover-glow bg-surface-light border-border"
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  Load Document
                </Button>
              </div>
            </div>
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
          {!isMobile && (
            <div className="text-sm text-muted-foreground">
              Reading: "Advanced React Patterns.pdf"
            </div>
          )}
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="bg-surface-light border-border hover-glow"
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Page</span>
            <Badge variant="secondary" className="bg-primary text-primary-foreground">
              {currentPage}
            </Badge>
            <span className="text-sm text-muted-foreground">of {totalPages}</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="bg-surface-light border-border hover-glow"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};