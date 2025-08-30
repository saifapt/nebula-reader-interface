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
      const { pdfId, pageNumber, drawingData } = await req.json();

      if (!pdfId || !pageNumber || !drawingData) {
        return new Response(
          JSON.stringify({ error: 'PDF ID, page number, and drawing data are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Upsert drawing data (update if exists, insert if not)
      const { data, error } = await supabaseClient
        .from('drawings')
        .upsert({
          user_id: user.id,
          pdf_id: pdfId,
          page_number: pageNumber,
          drawing_data: drawingData
        }, {
          onConflict: 'user_id,pdf_id,page_number'
        })
        .select()
        .single();

      if (error) {
        console.error('Drawing save error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to save drawing' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      const pageNumber = pathParts.pop();
      const pdfId = pathParts.pop();

      if (!pdfId || !pageNumber) {
        return new Response(
          JSON.stringify({ error: 'PDF ID and page number are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabaseClient
        .from('drawings')
        .select('*')
        .eq('user_id', user.id)
        .eq('pdf_id', pdfId)
        .eq('page_number', parseInt(pageNumber))
        .maybeSingle();

      if (error) {
        console.error('Get drawing error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to retrieve drawing' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data || { drawingData: null }),
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