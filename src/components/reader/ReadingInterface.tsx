import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Header } from "./Header";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { ViewerPanel } from "./ViewerPanel";

export const ReadingInterface = () => {
  const [isFlipbookMode, setIsFlipbookMode] = useState(true);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const isMobile = useIsMobile();

  // Auto-close sidebars on mobile
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
          isMobile={isMobile}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />

        {/* Center Viewer Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          <ViewerPanel isFlipbookMode={isFlipbookMode} isMobile={isMobile} />
        </div>

        {/* Right Sidebar */}
        <RightSidebar
          isOpen={rightSidebarOpen}
          onClose={() => setRightSidebarOpen(false)}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
};