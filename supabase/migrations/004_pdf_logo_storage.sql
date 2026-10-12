-- 004_pdf_logo_storage.sql
-- Private, per-user storage for ONE saved PDF branding logo.
--
--   bucket:  pdf-logos   (private, PNG only, 1 MiB max per object)
--   object:  <auth.uid()>/logo.png   (exactly this path, one per user)
--
-- DESIGN
--   * No new table and no profiles column. "Has a saved logo" == the object exists.
--   * Row Level Security on storage.objects restricts every operation to the signed-in
--     user's own exact path. Anonymous users get nothing (there is no anon policy).
--   * The browser only uses the anon key + the user's own session. No service-role key.
--
-- THIS MIGRATION NEVER MODIFIES OR DELETES EXISTING CONFIGURATION, AND IT FAILS CLOSED. It stops
-- with an error (and the surrounding transaction rolls everything back) if it finds:
--   - a pdf-logos bucket that exists with different settings,
--   - any existing pdf_logos_select/insert/update/delete_own policy,
--   - RLS disabled on storage.objects,
--   - ANY existing permissive storage.objects policy it cannot PROVE excludes pdf-logos.
--
-- About that last rule. Storage policies are permissive (ORed), so one broad existing policy
-- such as  USING (bucket_id <> 'avatars')  or  USING (true)  would let other users read saved
-- logos no matter what the policies below say. A policy is accepted only when its definition
-- (as stored by Postgres) has exactly one of these shapes, for a bucket other than pdf-logos:
--       (bucket_id = 'other'::text)
--       ((bucket_id = 'other'::text) AND <anything>)
-- i.e. the very first condition pins the policy to one other bucket, so the rest can only narrow
-- it further. Everything else is rejected as unverifiable and needs a manual decision: <>, !=,
-- IN/ANY lists, any OR, functions, sub-selects, policies with no bucket condition, or a bucket
-- condition that is not first. A policy that is stricter than it looks may be rejected; that is
-- intended. Policies for the trusted service roles only, and RESTRICTIVE policies (which can
-- only narrow access), are not considered. Policies are never edited or dropped by this file:
-- rewrite the flagged policy yourself into the first shape above (or drop it deliberately),
-- then re-run.
-- Review what it reports, resolve it deliberately, then re-run.
--
-- PREFLIGHT (read-only; run these first and read the output):
--   select id, name, public, file_size_limit, allowed_mime_types from storage.buckets;
--   select policyname, cmd, roles, qual, with_check
--     from pg_policies where schemaname = 'storage' and tablename = 'objects';
--
-- VERIFY AFTER APPLYING:
--   select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'pdf-logos';
--   select policyname, cmd, roles from pg_policies
--     where schemaname = 'storage' and tablename = 'objects' and policyname like 'pdf_logos_%';
--   -- expect: public = false, 1048576, {image/png}, and four policies (select/insert/update/delete) for {authenticated}
--
-- ROLLBACK:
--   drop policy "pdf_logos_select_own" on storage.objects;
--   drop policy "pdf_logos_insert_own" on storage.objects;
--   drop policy "pdf_logos_update_own" on storage.objects;
--   drop policy "pdf_logos_delete_own" on storage.objects;
--   -- Delete the stored files through the Storage API or Dashboard (NOT with SQL: deleting rows
--   -- from storage.objects leaves the underlying file behind), then delete the bucket.
--
-- ACCOUNT DELETION / RETENTION: see SUPABASE_SETUP.md, section "Saved PDF logos".
--   Deleting a user does NOT delete their logo automatically. Remove the object first
--   (or sweep orphans afterwards), as documented there.

BEGIN;

DO $$
DECLARE
  existing_bucket record;
  suspect record;
  expr text;
  verified boolean;
BEGIN
  -- RLS must already be on for storage.objects (Supabase enables it by default).
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'storage.objects'::regclass) THEN
    RAISE EXCEPTION 'Row Level Security is disabled on storage.objects. Enable it before applying this migration.';
  END IF;

  -- Never overwrite: our own policy names must not exist yet.
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname IN ('pdf_logos_select_own', 'pdf_logos_insert_own', 'pdf_logos_update_own', 'pdf_logos_delete_own')
  ) THEN
    RAISE EXCEPTION
      'One or more pdf_logos_* policies already exist on storage.objects. This migration never overwrites policies; it may already be applied. Review the existing policies before re-running.';
  END IF;

  -- Fail closed: every existing permissive policy that could apply to signed-in or anonymous
  -- users must be PROVEN to cover only some other bucket (see the header for the exact shapes).
  FOR suspect IN
    SELECT policyname, cmd, roles, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND permissive = 'PERMISSIVE'  -- RESTRICTIVE policies can only narrow access
      AND NOT (roles <@ ARRAY['service_role', 'supabase_admin', 'supabase_storage_admin', 'postgres']::name[])
    ORDER BY policyname
  LOOP
    -- The expression that decides access for this command must exist (INSERT: WITH CHECK).
    verified := (CASE WHEN suspect.cmd = 'INSERT' THEN suspect.with_check ELSE suspect.qual END) IS NOT NULL;

    -- Every expression the policy has must pass; one failure rejects the whole policy.
    FOREACH expr IN ARRAY ARRAY[suspect.qual, suspect.with_check] LOOP
      CONTINUE WHEN expr IS NULL;
      IF NOT (
           -- shape 1:  (bucket_id = 'other'::text)
           -- shape 2:  ((bucket_id = 'other'::text) AND ...)
           (expr ~ '^\(bucket_id = ''[^'']+''::text\)$' OR expr ~ '^\(\(bucket_id = ''[^'']+''::text\) AND .+\)$')
           -- never the bucket this migration protects, and never mentioning it at all
           AND substring(expr FROM '^\(+bucket_id = ''([^'']+)''::text') IS DISTINCT FROM 'pdf-logos'
           AND position('pdf-logos' IN expr) = 0
           -- defense in depth: no OR anywhere, even though shape 2 already forbids it at top level
           AND expr !~* '\mor\M'
         ) THEN
        verified := false;
      END IF;
    END LOOP;

    IF NOT verified THEN
      RAISE EXCEPTION
        'Existing storage.objects policy "%" (cmd=%, roles=%) cannot be verified as excluding the pdf-logos bucket. Because policies are ORed it could expose saved logos, so this migration refuses to continue and has changed nothing. Review it manually and, if it is meant for another bucket, rewrite it so it starts with (bucket_id = ''<other bucket>''). qual=% with_check=%',
        suspect.policyname, suspect.cmd, suspect.roles, suspect.qual, suspect.with_check;
    END IF;
  END LOOP;

  -- Bucket: create it if absent. If it exists it must already match exactly; never alter it.
  SELECT * INTO existing_bucket FROM storage.buckets WHERE id = 'pdf-logos';
  IF FOUND THEN
    IF existing_bucket.public IS DISTINCT FROM false
       OR existing_bucket.file_size_limit IS DISTINCT FROM 1048576
       OR existing_bucket.allowed_mime_types IS DISTINCT FROM ARRAY['image/png']::text[] THEN
      RAISE EXCEPTION
        'Bucket "pdf-logos" already exists with different settings (public=%, file_size_limit=%, allowed_mime_types=%). This migration will not overwrite it. Review it manually.',
        existing_bucket.public, existing_bucket.file_size_limit, existing_bucket.allowed_mime_types;
    END IF;
    RAISE NOTICE 'Bucket pdf-logos already exists with the expected settings; leaving it unchanged.';
  ELSE
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('pdf-logos', 'pdf-logos', false, 1048576, ARRAY['image/png']);
  END IF;

END
$$;

-- Owner-only access to exactly <user_id>/logo.png, for signed-in users only.
-- (SELECT auth.uid()) is evaluated once per statement rather than once per row.
-- Replace (upsert) needs select + insert + update; remove needs select + delete.

CREATE POLICY "pdf_logos_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'pdf-logos' AND name = (SELECT auth.uid())::text || '/logo.png');

CREATE POLICY "pdf_logos_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pdf-logos' AND name = (SELECT auth.uid())::text || '/logo.png');

CREATE POLICY "pdf_logos_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'pdf-logos' AND name = (SELECT auth.uid())::text || '/logo.png')
  WITH CHECK (bucket_id = 'pdf-logos' AND name = (SELECT auth.uid())::text || '/logo.png');

CREATE POLICY "pdf_logos_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'pdf-logos' AND name = (SELECT auth.uid())::text || '/logo.png');

COMMIT;
