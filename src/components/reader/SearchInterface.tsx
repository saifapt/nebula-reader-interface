import { useState, useEffect } from 'react';
import { Search, Bookmark, FileText, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface SearchResult {
  id: string;
  type: 'note' | 'bookmark';
  title: string;
  content?: string;
  page_number: number;
  pdf_id: string;
  snippet?: string;
  tags?: string[];
  created_at: string;
}

interface SearchInterfaceProps {
  onResultClick: (pdfId: string, pageNumber: number) => void;
  className?: string;
}

export const SearchInterface = ({ onResultClick, className = '' }: SearchInterfaceProps) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [noteResults, setNoteResults] = useState<SearchResult[]>([]);
  const [bookmarkResults, setBookmarkResults] = useState<SearchResult[]>([]);

  const searchNotes = async (searchQuery: string) => {
    if (!user || !searchQuery.trim()) {
      setNoteResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notes')
        .select('id, note_text, page_number, pdf_id, tags, created_at')
        .eq('user_id', user.id)
        .textSearch('search_vector', searchQuery)
        .limit(20);

      if (error) throw error;

      const results: SearchResult[] = data.map(note => ({
        id: note.id,
        type: 'note' as const,
        title: note.note_text.substring(0, 50) + (note.note_text.length > 50 ? '...' : ''),
        content: note.note_text,
        page_number: note.page_number,
        pdf_id: note.pdf_id,
        snippet: note.note_text.substring(0, 100) + (note.note_text.length > 100 ? '...' : ''),
        tags: note.tags || [],
        created_at: note.created_at
      }));

      setNoteResults(results);
    } catch (error) {
      console.error('Error searching notes:', error);
      toast({ title: "Error", description: "Failed to search notes", variant: "destructive" });
    }
  };

  const searchBookmarks = async (searchQuery: string) => {
    if (!user || !searchQuery.trim()) {
      setBookmarkResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('id, page_number, pdf_id, label, created_at')
        .eq('user_id', user.id)
        .textSearch('search_vector', searchQuery)
        .limit(20);

      if (error) throw error;

      const results: SearchResult[] = data.map(bookmark => ({
        id: bookmark.id,
        type: 'bookmark' as const,
        title: bookmark.label || `Page ${bookmark.page_number}`,
        page_number: bookmark.page_number,
        pdf_id: bookmark.pdf_id,
        snippet: bookmark.label,
        created_at: bookmark.created_at
      }));

      setBookmarkResults(results);
    } catch (error) {
      console.error('Error searching bookmarks:', error);
      toast({ title: "Error", description: "Failed to search bookmarks", variant: "destructive" });
    }
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setNoteResults([]);
      setBookmarkResults([]);
      return;
    }

    setIsSearching(true);
    await Promise.all([
      searchNotes(searchQuery),
      searchBookmarks(searchQuery)
    ]);
    setIsSearching(false);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, user]);

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

  const ResultItem = ({ result }: { result: SearchResult }) => (
    <Button
      variant="outline"
      onClick={() => onResultClick(result.pdf_id, result.page_number)}
      className="w-full justify-start gap-3 hover-glow bg-surface-dark border-border h-auto py-3"
    >
      <div className="flex-shrink-0">
        {result.type === 'note' ? (
          <FileText className="h-4 w-4 text-secondary" />
        ) : (
          <Bookmark className="h-4 w-4 text-primary" />
        )}
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="font-medium text-sm truncate">{result.title}</div>
          <Badge variant="outline" className="text-xs">
            Page {result.page_number}
          </Badge>
        </div>
        {result.snippet && (
          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {result.snippet}
          </div>
        )}
        {result.tags && result.tags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {result.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <div className="text-xs text-muted-foreground mt-1">
          {formatDate(result.created_at)}
        </div>
      </div>
    </Button>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes and bookmarks..."
          className="pl-9 pr-9 bg-surface-dark border-border"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuery('')}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results */}
      {query && (
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-surface-dark">
            <TabsTrigger value="notes" className="data-[state=active]:bg-primary">
              Notes ({noteResults.length})
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="data-[state=active]:bg-primary">
              Bookmarks ({bookmarkResults.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="mt-4">
            <ScrollArea className="h-96">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-t-transparent border-primary rounded-full animate-spin" />
                </div>
              ) : noteResults.length > 0 ? (
                <div className="space-y-2">
                  {noteResults.map((result) => (
                    <ResultItem key={result.id} result={result} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No notes found for "{query}"
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="bookmarks" className="mt-4">
            <ScrollArea className="h-96">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-t-transparent border-primary rounded-full animate-spin" />
                </div>
              ) : bookmarkResults.length > 0 ? (
                <div className="space-y-2">
                  {bookmarkResults.map((result) => (
                    <ResultItem key={result.id} result={result} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No bookmarks found for "{query}"
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};