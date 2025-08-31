-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdfs', 'pdfs', false);

-- Create storage policies for PDF files
CREATE POLICY "Users can view their own PDFs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own PDFs"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own PDFs"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own PDFs"
ON storage.objects
FOR DELETE
USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add coordinates column to notes table for positioning on page
ALTER TABLE notes ADD COLUMN IF NOT EXISTS coordinates JSONB DEFAULT '{"x": 0, "y": 0}';

-- Add tags column to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add search vector column for full-text search
ALTER TABLE notes ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS label TEXT DEFAULT '';
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN indexes for full-text search
CREATE INDEX IF NOT EXISTS notes_search_idx ON notes USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS bookmarks_search_idx ON bookmarks USING GIN (search_vector);

-- Add version and timestamps for conflict resolution
ALTER TABLE drawings ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE drawings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create function to update search vectors
CREATE OR REPLACE FUNCTION update_search_vectors()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'notes' THEN
    NEW.search_vector := 
      setweight(to_tsvector('english', coalesce(NEW.note_text, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'B');
  ELSIF TG_TABLE_NAME = 'bookmarks' THEN
    NEW.search_vector := 
      setweight(to_tsvector('english', coalesce(NEW.label, '')), 'A');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update search vectors
DROP TRIGGER IF EXISTS notes_search_vector_trigger ON notes;
CREATE TRIGGER notes_search_vector_trigger
  BEFORE INSERT OR UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_search_vectors();

DROP TRIGGER IF EXISTS bookmarks_search_vector_trigger ON bookmarks;
CREATE TRIGGER bookmarks_search_vector_trigger
  BEFORE INSERT OR UPDATE ON bookmarks
  FOR EACH ROW EXECUTE FUNCTION update_search_vectors();

-- Update existing records with search vectors
UPDATE notes SET search_vector = 
  setweight(to_tsvector('english', coalesce(note_text, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'B');

UPDATE bookmarks SET search_vector = 
  setweight(to_tsvector('english', coalesce(label, '')), 'A');

-- Create function to update drawing timestamps
CREATE OR REPLACE FUNCTION update_drawing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for drawing updates
DROP TRIGGER IF EXISTS drawings_update_trigger ON drawings;
CREATE TRIGGER drawings_update_trigger
  BEFORE UPDATE ON drawings
  FOR EACH ROW EXECUTE FUNCTION update_drawing_timestamp();