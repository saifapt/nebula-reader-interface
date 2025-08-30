import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Drawing {
  id: string;
  user_id: string;
  pdf_id: string;
  page_number: number;
  drawing_data: any; // JSON data containing strokes, shapes, etc.
  created_at: string;
}

export const useDrawings = (pdfId?: string) => {
  const { user } = useAuth();
  const [drawings, setDrawings] = useState<{ [pageNumber: number]: Drawing }>({});
  const [loading, setLoading] = useState(false);

  const fetchDrawings = async () => {
    if (!user || !pdfId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('drawings')
        .select('*')
        .eq('user_id', user.id)
        .eq('pdf_id', pdfId);

      if (error) throw error;
      
      // Organize drawings by page number
      const drawingsByPage: { [pageNumber: number]: Drawing } = {};
      data?.forEach(drawing => {
        drawingsByPage[drawing.page_number] = drawing;
      });
      
      setDrawings(drawingsByPage);
    } catch (error) {
      console.error('Error fetching drawings:', error);
      toast({ title: "Error", description: "Failed to fetch drawings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveDrawing = async (pageNumber: number, drawingData: any) => {
    if (!user || !pdfId) {
      toast({ title: "Error", description: "You must be logged in to save drawings", variant: "destructive" });
      return;
    }

    try {
      const existingDrawing = drawings[pageNumber];
      
      if (existingDrawing) {
        // Update existing drawing
        const { error } = await supabase
          .from('drawings')
          .update({ drawing_data: drawingData })
          .eq('id', existingDrawing.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new drawing
        const { error } = await supabase
          .from('drawings')
          .insert({
            user_id: user.id,
            pdf_id: pdfId,
            page_number: pageNumber,
            drawing_data: drawingData,
          });

        if (error) throw error;
      }
      
      await fetchDrawings();
    } catch (error) {
      console.error('Error saving drawing:', error);
      toast({ title: "Error", description: "Failed to save drawing", variant: "destructive" });
    }
  };

  const clearDrawing = async (pageNumber: number) => {
    if (!user || !pdfId) return;

    const existingDrawing = drawings[pageNumber];
    if (!existingDrawing) return;

    try {
      const { error } = await supabase
        .from('drawings')
        .delete()
        .eq('id', existingDrawing.id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Drawing cleared" });
      await fetchDrawings();
    } catch (error) {
      console.error('Error clearing drawing:', error);
      toast({ title: "Error", description: "Failed to clear drawing", variant: "destructive" });
    }
  };

  const getDrawingForPage = (pageNumber: number) => {
    return drawings[pageNumber]?.drawing_data || null;
  };

  useEffect(() => {
    if (user && pdfId) {
      fetchDrawings();
    }
  }, [user, pdfId]);

  return {
    drawings,
    loading,
    saveDrawing,
    clearDrawing,
    getDrawingForPage,
    fetchDrawings,
  };
};