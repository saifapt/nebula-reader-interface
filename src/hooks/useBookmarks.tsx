import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Bookmark {
  id: string;
  user_id: string;
  pdf_id: string;
  page_number: number;
  created_at: string;
}

export const useBookmarks = (pdfId?: string) => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBookmarks = async () => {
    if (!user || !pdfId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .eq('pdf_id', pdfId)
        .order('page_number', { ascending: true });

      if (error) throw error;
      setBookmarks(data || []);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      toast({ title: "Error", description: "Failed to fetch bookmarks", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addBookmark = async (pageNumber: number) => {
    if (!user || !pdfId) {
      toast({ title: "Error", description: "You must be logged in to add bookmarks", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: user.id,
          pdf_id: pdfId,
          page_number: pageNumber,
        });

      if (error) throw error;
      
      toast({ title: "Success", description: "Bookmark added" });
      await fetchBookmarks();
    } catch (error: any) {
      if (error.code === '23505') {
        toast({ title: "Info", description: "Page already bookmarked" });
      } else {
        console.error('Error adding bookmark:', error);
        toast({ title: "Error", description: "Failed to add bookmark", variant: "destructive" });
      }
    }
  };

  const removeBookmark = async (pageNumber: number) => {
    if (!user || !pdfId) return;

    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('pdf_id', pdfId)
        .eq('page_number', pageNumber);

      if (error) throw error;
      
      toast({ title: "Success", description: "Bookmark removed" });
      await fetchBookmarks();
    } catch (error) {
      console.error('Error removing bookmark:', error);
      toast({ title: "Error", description: "Failed to remove bookmark", variant: "destructive" });
    }
  };

  const isBookmarked = (pageNumber: number) => {
    return bookmarks.some(bookmark => bookmark.page_number === pageNumber);
  };

  useEffect(() => {
    if (user && pdfId) {
      fetchBookmarks();
    }
  }, [user, pdfId]);

  return {
    bookmarks,
    loading,
    addBookmark,
    removeBookmark,
    isBookmarked,
    fetchBookmarks,
  };
};