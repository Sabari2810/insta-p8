-- Optional, Supabase-only add-on to schema.sql.
--
-- Sets up a public "reels" bucket in Supabase Storage. Nothing in the app currently calls the
-- Storage API (no `.storage.from()` calls anywhere in the codebase) — this exists for whoever
-- wired up reel media uploads originally, in case that comes back. Skip this file entirely on a
-- portable/non-Supabase deployment (Neon, Railway, self-hosted Postgres, etc.): the `storage`
-- schema referenced below only exists on Supabase, so running this elsewhere will error.

-- Create bucket if it doesn't exist (Requires storage schema)
INSERT INTO storage.buckets (id, name, public)
VALUES ('reels', 'reels', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- NOTE: RLS is enabled by default on storage.objects in Supabase.
-- Running ALTER TABLE storage.objects causes permission errors (must be owner of table objects)
-- on newer Supabase instances. Therefore, we do not run it here.
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop storage policies if they exist to prevent duplicates
DROP POLICY IF EXISTS "Public Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public Viewing" ON storage.objects;
DROP POLICY IF EXISTS "Public Deletion" ON storage.objects;

-- The app never uploads/deletes storage objects from the browser — only the server, using the
-- service-role key, which bypasses RLS/policies entirely. So the anon key (public by design,
-- shipped in the client bundle) gets no write access at all. Read stays public since served
-- reel media needs a plain fetchable URL (e.g. for Instagram's publish API).
CREATE POLICY "Public Viewing"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'reels');
