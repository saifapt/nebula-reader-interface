import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "./Header";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { ViewerPanel } from "./ViewerPanel";
import { MobileControls } from "./MobileControls";
import { AIAssistant } from "./AIAssistant";
import { FloatingToolsMenu } from "./FloatingToolsMenu";
import { DraggableFloatingIcon } from "./DraggableFloatingIcon";
import { toast } from "@/hooks/use-toast";

export const ReadingInterface = () => {
  const { user } = useAuth();
  const [isFlipbookMode, setIsFlipbookMode] = useState(true);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [currentPdfId, setCurrentPdfId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isFloatingMenuVisible, setIsFloatingMenuVisible] = useState(false);
  const [floatingMenuPosition, setFloatingMenuPosition] = useState({ x: 0, y: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadedPdfData, setUploadedPdfData] = useState<any>(null);
  const totalPages = 200;
  const isMobile = useIsMobile();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      window.location.href = '/auth';
    }
  }, [user]);

  // Check if we're in medium screen mode (tablets in portrait, phones in landscape)
  // where only one sidebar should be open at a time
  const isMediumScreen = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1200;

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

  // Auto-close opposite sidebar on medium screens when one opens
  useEffect(() => {
    if (isMediumScreen) {
      if (leftSidebarOpen && rightSidebarOpen) {
        // If both are open, close the right one
        setRightSidebarOpen(false);
      }
    }
  }, [leftSidebarOpen, rightSidebarOpen, isMediumScreen]);

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
    toast({ title: "Success", description: `Bookmarked page ${currentPage}` });
  };

  const handleAddNote = () => {
    toast({ title: "Success", description: `Note added to page ${currentPage}` });
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
        onToggleLeftSidebar={() => {
          if (isMediumScreen && rightSidebarOpen) {
            setRightSidebarOpen(false);
          }
          setLeftSidebarOpen(!leftSidebarOpen);
        }}
        onToggleRightSidebar={() => {
          if (isMediumScreen && leftSidebarOpen) {
            setLeftSidebarOpen(false);
          }
          setRightSidebarOpen(!rightSidebarOpen);
        }}
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
          currentPdfId={currentPdfId || undefined}
          onGoToPage={(pdfId, pageNumber) => {
            setCurrentPage(pageNumber);
            handlePageChange(pageNumber);
          }}
        />

        {/* Center Viewer Panel */}
        <div className="flex-1 flex flex-col min-w-0 relative items-stretch">
          <ViewerPanel
            isFlipbookMode={isFlipbookMode} 
            isMobile={isMobile}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onAIAssistantOpen={() => setIsAIAssistantOpen(true)}
            onBookmark={handleBookmark}
            onAddNote={handleAddNote}
            onPdfIdChange={setCurrentPdfId}
            uploadedPdfData={uploadedPdfData}
            onPdfUploaded={setUploadedPdfData}
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