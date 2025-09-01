import { useState, useEffect } from "react";
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
  Search,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useNotes } from "@/hooks/useNotes";
import { SearchInterface } from "./SearchInterface";


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

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle?: () => void;
  isMobile: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentPdfId?: string;
  onGoToPage?: (pdfId: string, pageNumber: number) => void;
}

export const LeftSidebar = ({
  isOpen,
  onClose,
  onToggle,
  isMobile,
  isDarkMode,
  onToggleDarkMode,
  currentPdfId,
  onGoToPage,
}: LeftSidebarProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("tools");
  const { bookmarks } = useBookmarks(currentPdfId);
  const { notes } = useNotes(currentPdfId);
  const handleToolClick = (toolId: string) => {
    console.log(`Tool clicked: ${toolId}`);
  };

  const handleGoToPage = (pdfId: string, pageNumber: number) => {
    if (onGoToPage) {
      onGoToPage(pdfId, pageNumber);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
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

      {/* Content */}
      <div className="flex-1 p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-surface-light mb-4">
            <TabsTrigger value="tools" className="data-[state=active]:bg-primary">Tools</TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-primary">Notes</TabsTrigger>
            <TabsTrigger value="bookmarks" className="data-[state=active]:bg-primary">Bookmarks</TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0">
            <TabsContent value="tools" className="h-full mt-0">
              <TooltipProvider>
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

                <div className="space-y-2 mt-4">
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
            </TabsContent>

            <TabsContent value="notes" className="h-full mt-0">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {/* Search Notes Header */}
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <h3 className="text-sm font-medium text-muted-foreground flex-1">
                      Notes ({notes.length})
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setActiveTab("search")}
                    >
                      <Search className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {/* Notes List */}
                  <div className="space-y-2">
                    {notes.length > 0 ? notes.map((note) => (
                      <Button
                        key={note.id}
                        variant="outline"
                        onClick={() => handleGoToPage(note.pdf_id, note.page_number)}
                        className="w-full justify-start gap-3 hover-glow bg-surface-dark border-border h-auto py-2"
                      >
                        <StickyNote className="h-4 w-4 text-secondary" />
                        <div className="flex-1 text-left">
                          <div className="text-sm truncate">{note.note_text.substring(0, 30)}...</div>
                          <div className="text-xs text-muted-foreground">
                            Page {note.page_number} • {formatDate(note.created_at)}
                          </div>
                        </div>
                      </Button>
                    )) : (
                      <div className="text-center text-muted-foreground text-sm py-4">
                        No notes yet
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="bookmarks" className="h-full mt-0">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {/* Bookmarks Header */}
                  <div className="pb-2 border-b border-border">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Bookmarks ({bookmarks.length})
                    </h3>
                  </div>
                  
                  {/* Bookmarks List */}
                  <div className="space-y-2">
                    {bookmarks.length > 0 ? bookmarks.map((bookmark) => (
                      <Button
                        key={bookmark.id}
                        variant="outline"
                        onClick={() => handleGoToPage(bookmark.pdf_id, bookmark.page_number)}
                        className="w-full justify-start gap-3 hover-glow bg-surface-dark border-border h-auto py-2"
                      >
                        <Bookmark className="h-4 w-4 text-primary" />
                        <div className="flex-1 text-left">
                          <div className="text-sm">Page {bookmark.page_number}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(bookmark.created_at)}
                          </div>
                        </div>
                      </Button>
                    )) : (
                      <div className="text-center text-muted-foreground text-sm py-4">
                        No bookmarks yet
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="search" className="h-full mt-0">
              <SearchInterface 
                onResultClick={handleGoToPage}
                className="h-full"
              />
            </TabsContent>
          </div>
        </Tabs>
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