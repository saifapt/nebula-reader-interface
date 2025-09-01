import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface PDF {
  id: string;
  filename: string;
  total_pages: number;
  uploaded_by: string;
  created_at: string;
}

export const usePDFs = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const uploadPDF = async (file: File) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to upload PDFs", variant: "destructive" });
      return null;
    }

    setLoading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const storagePath = `${user.id}/${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(storagePath, file, { contentType: 'application/pdf', upsert: false });

      if (uploadError) throw uploadError;

      // Get PDF page count (simplified - in real app you'd use PDF.js)
      const totalPages = 1; // This would be calculated from the actual PDF

      // Save PDF metadata to database
      const { data: pdfData, error: dbError } = await supabase
        .from('pdfs')
        .insert({
          filename: file.name,
          total_pages: totalPages,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({ title: "Success", description: "PDF uploaded successfully" });
      return pdfData;
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Error", description: "Failed to upload PDF", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getPDFs = async () => {
    const { data, error } = await supabase
      .from('pdfs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching PDFs:', error);
      return [];
    }
    return data || [];
  };

  const getPDFFile = async (pdfId: string) => {
    if (!user) return null;

    try {
      // Get PDF metadata
      const { data: pdfData, error: metaError } = await supabase
        .from('pdfs')
        .select('*')
        .eq('id', pdfId)
        .single();

      if (metaError) throw metaError;

      // Get file from storage
      const { data: fileData, error: fileError } = await supabase.storage
        .from('pdfs')
        .download(`${pdfData.uploaded_by}/${pdfData.filename}`);

      if (fileError) throw fileError;

      return { pdfData, fileData };
    } catch (error) {
      console.error('Error getting PDF:', error);
      return null;
    }
  };

  return {
    uploadPDF,
    getPDFs,
    getPDFFile,
    loading,
  };
};