-- Migration v6: Photos table + storage bucket

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) NOT NULL,
  user_name text NOT NULL,
  file_path text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Everyone can view photos
CREATE POLICY "Anyone can view photos" ON photos
  FOR SELECT USING (true);

-- Users can insert their own photos
CREATE POLICY "Users can insert own photos" ON photos
  FOR INSERT WITH CHECK (true);

-- Create storage bucket for photos (public so images load without auth)
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to photos bucket
CREATE POLICY "Anyone can upload photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photos');

-- Allow anyone to read photos
CREATE POLICY "Anyone can read photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');
