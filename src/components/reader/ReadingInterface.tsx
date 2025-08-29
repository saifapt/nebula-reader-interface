import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Header } from "./Header";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { ViewerPanel } from "./ViewerPanel";
import { MobileControls } from "./MobileControls";
import { AIAssistant } from "./AIAssistant";
import { FloatingToolsMenu } from "./FloatingToolsMenu";
import { DraggableFloatingIcon } from "./DraggableFloatingIcon";

export const ReadingInterface = () => {
  const [isFlipbookMode, setIsFlipbookMode] = useState(true);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isFloatingMenuVisible, setIsFloatingMenuVisible] = useState(false);
  const [floatingMenuPosition, setFloatingMenuPosition] = useState({ x: 0, y: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 200;
  const isMobile = useIsMobile();

  // Auto-close sidebars on mobile, keep open on desktop
  useEffect(() => {
    if (isMobile) {
      setLeftSidebarOpen(false);
      setRightSidebarOpen(false);
    } else {
      setLeftSidebarOpen(true);
      setRightSidebarOpen(true);
    }
  }, [isMobile]);

  // Force PDF mode on mobile
  useEffect(() => {
    if (isMobile && isFlipbookMode) {
      setIsFlipbookMode(false);
    }
  }, [isMobile, isFlipbookMode]);

  const handleToggleMode = () => {
    if (!isMobile) {
      setIsFlipbookMode(!isFlipbookMode);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleFloatingMenuToggle = (position: { x: number; y: number }) => {
    setFloatingMenuPosition(position);
    setIsFloatingMenuVisible(!isFloatingMenuVisible);
  };

  const handleBookmark = () => {
    console.log(`Bookmarked page ${currentPage}`);
  };

  const handleAddNote = () => {
    console.log(`Added note to page ${currentPage}`);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    console.log(`Zoom ${direction} on page ${currentPage}`);
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <Header
        isFlipbookMode={isFlipbookMode}
        onToggleMode={handleToggleMode}
        onToggleLeftSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
        onToggleRightSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}
        isMobile={isMobile}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar
          isOpen={leftSidebarOpen}
          onClose={() => setLeftSidebarOpen(false)}
          onToggle={() => setLeftSidebarOpen(!leftSidebarOpen)}
          isMobile={isMobile}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />

        {/* Center Viewer Panel */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <ViewerPanel 
            isFlipbookMode={isFlipbookMode} 
            isMobile={isMobile}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onAIAssistantOpen={() => setIsAIAssistantOpen(true)}
          />
          
          {/* Mobile Controls Overlay */}
          {isMobile && (
            <MobileControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onBookmark={handleBookmark}
              onAddNote={handleAddNote}
              onZoomIn={() => handleZoom('in')}
              onZoomOut={() => handleZoom('out')}
            />
          )}
        </div>

        {/* Right Sidebar - Desktop: Chatbot, Mobile: Navigation */}
        <RightSidebar
          isOpen={rightSidebarOpen}
          onClose={() => setRightSidebarOpen(false)}
          onToggle={() => setRightSidebarOpen(!rightSidebarOpen)}
          isMobile={isMobile}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
      </div>

      {/* Mobile: Draggable Floating Icon for Tools */}
      {isMobile && (
        <DraggableFloatingIcon onToggleMenu={handleFloatingMenuToggle} />
      )}

      {/* Mobile: Floating Tools Menu */}
      <FloatingToolsMenu
        isVisible={isFloatingMenuVisible}
        onClose={() => setIsFloatingMenuVisible(false)}
        position={floatingMenuPosition}
      />

      {/* AI Assistant Modal */}
      <AIAssistant
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
      />
    </div>
  );
};