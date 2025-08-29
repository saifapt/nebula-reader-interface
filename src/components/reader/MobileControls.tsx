import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, FileText, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";

interface MobileControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onBookmark: () => void;
  onAddNote: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const MobileControls = ({
  currentPage,
  totalPages,
  onPageChange,
  onBookmark,
  onAddNote,
  onZoomIn,
  onZoomOut,
}: MobileControlsProps) => {
  const [isHolding, setIsHolding] = useState(false);

  const handlePrevious = () => {
    if (isHolding) {
      onPageChange(1); // Jump to first page
    } else {
      onPageChange(Math.max(1, currentPage - 1));
    }
  };

  const handleNext = () => {
    if (isHolding) {
      onPageChange(totalPages); // Jump to last page
    } else {
      onPageChange(Math.min(totalPages, currentPage + 1));
    }
  };

  const handleMouseDown = () => {
    setTimeout(() => setIsHolding(true), 800); // Hold for 800ms
  };

  const handleMouseUp = () => {
    setIsHolding(false);
  };

  return (
    <>
      {/* Page Controls - Top */}
      <div className="absolute inset-x-0 top-0 flex justify-between items-start p-4 pointer-events-none">
        {/* Top Left - Zoom Controls */}
        <div className="flex gap-2 pointer-events-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={onZoomIn}
            className="bg-surface-dark/80 backdrop-blur-sm border-border hover-glow w-10 h-10"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onZoomOut}
            className="bg-surface-dark/80 backdrop-blur-sm border-border hover-glow w-10 h-10"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Top Right - Page Actions */}
        <div className="flex gap-2 pointer-events-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={onBookmark}
            className="bg-surface-dark/80 backdrop-blur-sm border-border hover-glow w-10 h-10"
          >
            <Bookmark className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onAddNote}
            className="bg-surface-dark/80 backdrop-blur-sm border-border hover-glow w-10 h-10"
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Controls - Bottom */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 pointer-events-auto">
        <Button
          variant="outline"
          size="sm"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="bg-surface-dark/80 backdrop-blur-sm border-border hover-glow"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {isHolding ? "First" : "Prev"}
        </Button>

        <div className="px-3 py-1 bg-surface-dark/80 backdrop-blur-sm border border-border rounded text-sm">
          {currentPage} / {totalPages}
        </div>

        <Button
          variant="outline"
          size="sm"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="bg-surface-dark/80 backdrop-blur-sm border-border hover-glow"
        >
          {isHolding ? "Last" : "Next"}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </>
  );
};