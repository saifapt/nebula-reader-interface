import {
  Bookmark,
  StickyNote,
  Moon,
  Sun,
  Bot,
  X,
  PenTool,
  Highlighter,
  Eraser,
  Type,
  ArrowRight,
  Circle,
  Square,
  Palette,
  Settings,
  FileText,
  Clock,
  Hash,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle?: () => void;
  isMobile: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const drawingTools = [
  { icon: PenTool, label: "Pen", id: "pen" },
  { icon: Highlighter, label: "Highlighter", id: "highlighter" },
  { icon: Eraser, label: "Eraser", id: "eraser" },
  { icon: Type, label: "Text", id: "text" },
  { icon: ArrowRight, label: "Arrow", id: "arrow" },
  { icon: Circle, label: "Circle", id: "circle" },
  { icon: Square, label: "Rectangle", id: "rectangle" },
  { icon: Palette, label: "Colors", id: "colors" },
  { icon: Settings, label: "Tool Settings", id: "tool-settings" },
];

// Mock data for bookmarks and notes
const mockBookmarks = [
  { id: 1, page: 15, title: "Chapter 3: Introduction", timestamp: "2 hours ago" },
  { id: 2, page: 42, title: "Key Concepts", timestamp: "1 day ago" },
  { id: 3, page: 87, title: "Case Study Analysis", timestamp: "3 days ago" },
  { id: 4, page: 120, title: "Important Formula", timestamp: "5 days ago" },
];

const mockNotes = [
  { id: 1, page: 23, title: "Important Formula", content: "E = mc²", timestamp: "1 hour ago" },
  { id: 2, page: 35, title: "Discussion Question", content: "How does this relate...", timestamp: "4 hours ago" },
  { id: 3, page: 56, title: "Key Insight", content: "The author's perspective...", timestamp: "1 day ago" },
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
      <div className="flex-1 p-4 space-y-4 overflow-hidden">
        <TooltipProvider>
          {/* Drawing Tools - Only show on bigger screens */}
          {!isMobile && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Drawing Tools
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {drawingTools.map((tool) => (
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
          )}

          {/* Saved Bookmarks */}
          <div className="space-y-2 flex-1 min-h-0">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Saved Bookmarks
            </h3>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {mockBookmarks.map((bookmark) => (
                  <Button
                    key={bookmark.id}
                    variant="outline"
                    onClick={() => handleToolClick(`bookmark-${bookmark.id}`)}
                    className="w-full justify-start gap-3 hover-glow bg-surface-dark border-border h-auto py-2"
                  >
                    <Bookmark className="h-4 w-4 text-primary" />
                    <div className="flex-1 text-left">
                      <div className="text-sm truncate">{bookmark.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Page {bookmark.page} • {bookmark.timestamp}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Saved Notes */}
          <div className="space-y-2 flex-1 min-h-0">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Saved Notes
            </h3>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {mockNotes.map((note) => (
                  <Button
                    key={note.id}
                    variant="outline"
                    onClick={() => handleToolClick(`note-${note.id}`)}
                    className="w-full justify-start gap-3 hover-glow bg-surface-dark border-border h-auto py-2"
                  >
                    <StickyNote className="h-4 w-4 text-secondary" />
                    <div className="flex-1 text-left">
                      <div className="text-sm truncate">{note.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Page {note.page} • {note.timestamp}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
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