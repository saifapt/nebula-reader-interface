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

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const searchType = url.searchParams.get('type'); // 'notes' or 'bookmarks'
      const query = url.searchParams.get('q');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      if (!query || !searchType) {
        return new Response(
          JSON.stringify({ error: 'Query and type parameters are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let data, error;

      if (searchType === 'notes') {
        const result = await supabaseClient
          .from('notes')
          .select('id, note_text, page_number, pdf_id, tags, created_at')
          .eq('user_id', user.id)
          .textSearch('search_vector', query)
          .limit(limit);
        
        data = result.data;
        error = result.error;
      } else if (searchType === 'bookmarks') {
        const result = await supabaseClient
          .from('bookmarks')
          .select('id, page_number, pdf_id, label, created_at')
          .eq('user_id', user.id)
          .textSearch('search_vector', query)
          .limit(limit);
        
        data = result.data;
        error = result.error;
      } else {
        return new Response(
          JSON.stringify({ error: 'Invalid search type. Use "notes" or "bookmarks"' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (error) {
        console.error('Search error:', error);
        return new Response(
          JSON.stringify({ error: 'Search failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data || []),
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