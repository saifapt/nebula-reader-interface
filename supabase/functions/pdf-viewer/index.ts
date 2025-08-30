import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const pdfId = pathParts[pathParts.length - 2];
    const pageNumber = parseInt(pathParts[pathParts.length - 1]);

    if (!pdfId || isNaN(pageNumber)) {
      return new Response(
        JSON.stringify({ error: 'Invalid PDF ID or page number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get PDF metadata
    const { data: pdfData, error: pdfError } = await supabaseClient
      .from('pdfs')
      .select('*')
      .eq('id', pdfId)
      .single();

    if (pdfError || !pdfData) {
      return new Response(
        JSON.stringify({ error: 'PDF not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (pageNumber < 1 || pageNumber > pdfData.total_pages) {
      return new Response(
        JSON.stringify({ error: 'Page number out of range' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get file from storage
    const filePath = `${pdfData.uploaded_by}/${pdfData.filename}`;
    const { data: fileData, error: storageError } = await supabaseClient.storage
      .from('pdfs')
      .download(filePath);

    if (storageError) {
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve PDF file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For now, return the full PDF file since we need client-side rendering
    // In production, you'd convert the specific page to an image here
    return new Response(fileData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${pdfData.filename}"`
      }
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});