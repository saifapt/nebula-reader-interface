import { useState } from "react";
import { Search, Bookmark, FileText, X, Clock, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
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

export const RightSidebar = ({ isOpen, onClose, isMobile }: RightSidebarProps) => {
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

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-lg">Library</h2>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bookmarks and notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-surface-dark border-border hover-glow focus:glow-primary"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4 bg-surface-dark">
            <TabsTrigger
              value="bookmarks"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Bookmark className="h-4 w-4 mr-2" />
              Bookmarks
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileText className="h-4 w-4 mr-2" />
              Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookmarks" className="flex-1 mt-4">
            <ScrollArea className="h-full custom-scrollbar">
              <div className="px-4 space-y-3">
                {filteredBookmarks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No bookmarks found</p>
                  </div>
                ) : (
                  filteredBookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="p-3 rounded-lg bg-surface-dark border border-border hover-glow cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{bookmark.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          Page {bookmark.page}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {bookmark.preview}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {bookmark.timestamp}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="notes" className="flex-1 mt-4">
            <ScrollArea className="h-full custom-scrollbar">
              <div className="px-4 space-y-3">
                {filteredNotes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No notes found</p>
                  </div>
                ) : (
                  filteredNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-lg bg-surface-dark border border-border hover-glow cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{note.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          Page {note.page}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
                        {note.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {note.timestamp}
                        </div>
                        <div className="flex gap-1">
                          {note.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs px-1.5 py-0.5 bg-accent/20 text-accent"
                            >
                              <Hash className="h-2 w-2 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full bg-surface-dark border-border hover-glow"
        >
          Export {activeTab === "bookmarks" ? "Bookmarks" : "Notes"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full bg-surface-dark border-border hover-glow"
        >
          Sync to Cloud
        </Button>
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
          {sidebarContent}
        </div>
      </>
    );
  }

  return (
    <div
      className={`border-l border-border surface-gradient transition-all duration-300 ${
        isOpen ? "w-80" : "w-0"
      } overflow-hidden`}
    >
      {sidebarContent}
    </div>
  );
};