import { useState } from "react";
import { Search, Bookmark, FileText, X, Clock, Hash, Bot, Send, Menu, Moon, Sun, Settings, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle?: () => void;
  isMobile: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

// Mock data
const mockBookmarks = [
  {
    id: 1,
    page: 15,
    title: "Chapter 3: Introduction",
    timestamp: "2 hours ago",
    preview: "This chapter covers the fundamentals of...",
  },
  {
    id: 2,
    page: 42,
    title: "Key Concepts",
    timestamp: "1 day ago",
    preview: "Important definitions and terminology...",
  },
  {
    id: 3,
    page: 87,
    title: "Case Study Analysis",
    timestamp: "3 days ago",
    preview: "Real-world application of the concepts...",
  },
];

const mockNotes = [
  {
    id: 1,
    page: 23,
    title: "Important Formula",
    content: "Remember this equation for the final exam: E = mc²",
    timestamp: "1 hour ago",
    tags: ["physics", "formula"],
  },
  {
    id: 2,
    page: 35,
    title: "Discussion Question",
    content: "How does this relate to the previous chapter's conclusions?",
    timestamp: "4 hours ago",
    tags: ["question", "analysis"],
  },
  {
    id: 3,
    page: 56,
    title: "Key Insight",
    content: "The author's perspective here contradicts the traditional view...",
    timestamp: "1 day ago",
    tags: ["insight", "critical"],
  },
];

export const RightSidebar = ({ isOpen, onClose, onToggle, isMobile, isDarkMode, onToggleDarkMode }: RightSidebarProps) => {
  const [activeTab, setActiveTab] = useState("bookmarks");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBookmarks = mockBookmarks.filter(
    (bookmark) =>
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNotes = mockNotes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Desktop: Chatbot Content
  const chatbotContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center glow-primary">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <h2 className="font-semibold text-lg">AI Assistant</h2>
        </div>
        {onToggle && (
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Chat placeholder */}
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary/20 flex items-center justify-center">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">AI Reading Assistant</h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Ask questions about the document, get summaries, or request explanations.
          </p>
          <Button className="bg-gradient-primary hover:opacity-90 glow-primary">
            Start Conversation
          </Button>
        </div>
      </div>
    </div>
  );

  // Mobile: Navigation Content
  const navigationContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-lg">Menu</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 p-4 space-y-3">
        {/* Bookmarks Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Bookmarks</h3>
          <div className="space-y-2">
            {mockBookmarks.slice(0, 3).map((bookmark) => (
              <Button
                key={bookmark.id}
                variant="outline"
                className="w-full justify-start gap-3 hover-glow bg-surface-dark border-border"
              >
                <Bookmark className="h-4 w-4" />
                <div className="flex-1 text-left">
                  <div className="text-sm">{bookmark.title}</div>
                  <div className="text-xs text-muted-foreground">Page {bookmark.page}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Notes Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Notes</h3>
          <div className="space-y-2">
            {mockNotes.slice(0, 2).map((note) => (
              <Button
                key={note.id}
                variant="outline"
                className="w-full justify-start gap-3 hover-glow bg-surface-dark border-border"
              >
                <FileText className="h-4 w-4" />
                <div className="flex-1 text-left">
                  <div className="text-sm">{note.title}</div>
                  <div className="text-xs text-muted-foreground">Page {note.page}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Settings</h3>
          <Button
            variant="outline"
            onClick={onToggleDarkMode}
            className="w-full justify-start gap-3 hover-glow bg-surface-dark border-border"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 hover-glow bg-surface-dark border-border"
          >
            <Settings className="h-4 w-4" />
            Preferences
          </Button>
        </div>
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
          className={`fixed right-0 top-16 bottom-0 w-80 bg-surface-dark border-l border-border transform transition-transform duration-300 z-50 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {navigationContent}
        </div>
      </>
    );
  }

  return (
    <div
      className={`border-l border-border surface-gradient transition-all duration-300 ${
        isOpen ? "w-80" : "w-12"
      } overflow-hidden`}
    >
      {isOpen ? chatbotContent : (
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
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};