import {
  ChevronFirst,
  ChevronLeft,
  ChevronRight,
  ChevronLast,
  Bookmark,
  StickyNote,
  Highlighter,
  ZoomIn,
  ZoomOut,
  Moon,
  Sun,
  Bot,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle?: () => void;
  isMobile: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const tools = [
  { icon: ChevronFirst, label: "First Page", id: "first" },
  { icon: ChevronLeft, label: "Previous Page", id: "previous" },
  { icon: ChevronRight, label: "Next Page", id: "next" },
  { icon: ChevronLast, label: "Last Page", id: "last" },
  { icon: Bookmark, label: "Bookmark Page", id: "bookmark" },
  { icon: StickyNote, label: "Add Note", id: "note" },
  { icon: Highlighter, label: "Highlight", id: "highlight" },
  { icon: ZoomIn, label: "Zoom In", id: "zoom-in" },
  { icon: ZoomOut, label: "Zoom Out", id: "zoom-out" },
  { icon: Bot, label: "AI Assistant", id: "ai" },
];

export const LeftSidebar = ({
  isOpen,
  onClose,
  onToggle,
  isMobile,
  isDarkMode,
  onToggleDarkMode,
}: LeftSidebarProps) => {
  const handleToolClick = (toolId: string) => {
    console.log(`Tool clicked: ${toolId}`);
    // Placeholder for tool functionality
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-lg">Tools</h2>
        {(isMobile || onToggle) && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={isMobile ? onClose : onToggle}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Tool Buttons */}
      <div className="flex-1 p-4 space-y-3">
        <TooltipProvider>
          {/* Navigation Tools */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Navigation
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {tools.slice(0, 4).map((tool) => (
                <Tooltip key={tool.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToolClick(tool.id)}
                      className="hover-glow flex flex-col items-center gap-1 h-auto py-3 bg-surface-dark border-border"
                    >
                      <tool.icon className="h-4 w-4" />
                      <span className="text-xs">{tool.label.split(' ')[0]}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-surface-dark border-border">
                    {tool.label}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Annotation Tools */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Annotations
            </h3>
            <div className="space-y-2">
              {tools.slice(4, 7).map((tool) => (
                <Tooltip key={tool.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => handleToolClick(tool.id)}
                      className="w-full justify-start gap-3 hover-glow bg-surface-dark border-border"
                    >
                      <tool.icon className="h-4 w-4" />
                      {tool.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-surface-dark border-border">
                    {tool.label}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* View Tools */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              View
            </h3>
            <div className="space-y-2">
              {tools.slice(7, 9).map((tool) => (
                <Tooltip key={tool.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => handleToolClick(tool.id)}
                      className="w-full justify-start gap-3 hover-glow bg-surface-dark border-border"
                    >
                      <tool.icon className="h-4 w-4" />
                      {tool.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-surface-dark border-border">
                    {tool.label}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Settings
            </h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={onToggleDarkMode}
                  className="w-full justify-start gap-3 hover-glow bg-surface-dark border-border"
                >
                  {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {isDarkMode ? "Light Mode" : "Dark Mode"}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-surface-dark border-border">
                Toggle theme
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* AI Assistant - Featured */}
      <div className="p-4 border-t border-border">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => handleToolClick("ai")}
                className="w-full justify-start gap-3 bg-gradient-primary hover:opacity-90 transition-opacity glow-primary"
              >
                <Bot className="h-4 w-4" />
                AI Assistant
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-surface-dark border-border">
              Open AI Reading Assistant
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />
        )}
        
        {/* Mobile Drawer */}
        <div
          className={`fixed left-0 top-16 bottom-0 w-80 bg-surface-dark border-r border-border transform transition-transform duration-300 z-50 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {sidebarContent}
        </div>
      </>
    );
  }

  return (
    <div
      className={`border-r border-border surface-gradient transition-all duration-300 ${
        isOpen ? "w-64" : "w-12"
      } overflow-hidden`}
    >
      {isOpen ? sidebarContent : (
        // Collapsed state - mini sidebar with icons
        <div className="flex flex-col h-full p-2 gap-2">
          {/* Toggle button */}
          {onToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="w-8 h-8 shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};