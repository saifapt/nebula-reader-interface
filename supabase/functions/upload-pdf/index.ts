import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Database {
  public: {
    Tables: {
      pdfs: {
        Row: {
          id: string;
          filename: string;
          total_pages: number;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          filename: string;
          total_pages: number;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          filename?: string;
          total_pages?: number;
          uploaded_by?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const filename = formData.get('filename') as string;

      if (!file || !filename) {
        return new Response(
          JSON.stringify({ error: 'File and filename are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Read file data
      const fileData = await file.arrayBuffer();
      
      // For now, we'll estimate pages (in production, use pdf-lib to count pages)
      // This is a simplified implementation since we can't easily use pdf-lib in edge functions
      const estimatedPages = Math.max(1, Math.floor(fileData.byteLength / 50000)); // Rough estimation

      // Upload file to storage
      const filePath = `${user.id}/${filename}`;
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('pdfs')
        .upload(filePath, fileData, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return new Response(
          JSON.stringify({ error: 'Failed to upload file' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Save PDF metadata to database
      const { data: pdfData, error: dbError } = await supabaseClient
        .from('pdfs')
        .insert({
          filename,
          total_pages: estimatedPages,
          uploaded_by: user.id
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        return new Response(
          JSON.stringify({ error: 'Failed to save PDF metadata' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          pdfId: pdfData.id,
          filename: pdfData.filename,
          totalPages: pdfData.total_pages,
          uploadedBy: pdfData.uploaded_by,
          createdAt: pdfData.created_at
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});