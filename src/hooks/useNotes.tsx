import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Note {
  id: string;
  user_id: string;
  pdf_id: string;
  page_number: number;
  note_text: string;
  created_at: string;
}

export const useNotes = (pdfId?: string) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotes = async () => {
    if (!user || !pdfId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('pdf_id', pdfId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({ title: "Error", description: "Failed to fetch notes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (pageNumber: number, noteText: string) => {
    if (!user || !pdfId) {
      toast({ title: "Error", description: "You must be logged in to add notes", variant: "destructive" });
      return;
    }

    if (!noteText.trim()) {
      toast({ title: "Error", description: "Note text cannot be empty", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          pdf_id: pdfId,
          page_number: pageNumber,
          note_text: noteText.trim(),
        });

      if (error) throw error;
      
      toast({ title: "Success", description: "Note added" });
      await fetchNotes();
    } catch (error) {
      console.error('Error adding note:', error);
      toast({ title: "Error", description: "Failed to add note", variant: "destructive" });
    }
  };

  const updateNote = async (noteId: string, noteText: string) => {
    if (!user) return;

    if (!noteText.trim()) {
      toast({ title: "Error", description: "Note text cannot be empty", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from('notes')
        .update({ note_text: noteText.trim() })
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Note updated" });
      await fetchNotes();
    } catch (error) {
      console.error('Error updating note:', error);
      toast({ title: "Error", description: "Failed to update note", variant: "destructive" });
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Note deleted" });
      await fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({ title: "Error", description: "Failed to delete note", variant: "destructive" });
    }
  };

  const getNotesForPage = (pageNumber: number) => {
    return notes.filter(note => note.page_number === pageNumber);
  };

  useEffect(() => {
    if (user && pdfId) {
      fetchNotes();
    }
  }, [user, pdfId]);

  return {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
    getNotesForPage,
    fetchNotes,
  };
};