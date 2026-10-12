# Supabase Setup Guide

## 1. Create Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Note your **Project URL** and **anon public key** from Project Settings → API.

## 2. Configure Environment

Update `.env.local` with your project credentials:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 3. Run Database Migrations

In Supabase Dashboard → SQL Editor, run these files in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. (later migrations: see their own sections below, e.g. `004_pdf_logo_storage.sql` in section 8)

## 4. Verify Setup

After running migrations, confirm these tables exist in Table Editor:
- `profiles`
- `reports`
- `deadline_statuses`
- `user_preferences`
- `notification_queue`

## 5. Auth Configuration

Supabase Email Auth is enabled by default. In Dashboard → Authentication → Providers, ensure **Email** is enabled.

For production, configure a custom SMTP server in Authentication → SMTP Settings.

## 6. Email Notifications (Optional — Deferred)

To activate email notifications via Resend:

1. Install Supabase CLI: `npm install -g supabase`
2. Get a [Resend](https://resend.com) API key
3. Add it to Supabase secrets:
   ```
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
   ```
4. Deploy the Edge Function:
   ```
   supabase functions deploy send-deadline-emails
   ```
5. Schedule it to run daily using Supabase's built-in cron (Dashboard → Database → Extensions → pg_cron):
   ```sql
   SELECT cron.schedule(
     'send-deadline-emails',
     '0 9 * * *',  -- 9am UTC daily
     $$SELECT net.http_post(
       url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-deadline-emails',
       headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
     )$$
   );
   ```

## 7. RLS Verification

To confirm RLS is blocking cross-user access, run in SQL Editor:

```sql
-- Should return 0 rows when called with a different user's auth context
SELECT * FROM reports WHERE user_id != auth.uid();
```

## 8. Saved PDF logos (migration 004)

Signed-in users can save one logo from the **Choose PDF Branding** dialog and reuse it in future
PDF exports. Saving is opt-in. One-time exports store nothing.

**What is stored, and where**
- Bucket `pdf-logos`: **private**, PNG only, 1 MiB max per file.
- One object per user, at exactly `<user id>/logo.png`. Re-saving replaces it in place; "Remove saved
  logo" deletes it.
- Row Level Security on `storage.objects` limits select/insert/update/delete to the signed-in user's own
  exact path. Anonymous users have no access. The browser uses only the anon key and the user's own
  session. **Never put the service-role key in the app or in any `VITE_*` variable.**
- Nothing is kept in the browser's localStorage, and there is no database table or `profiles` column.

**Applying the migration (manual, like 001-003)**
1. Run the read-only preflight queries at the top of `supabase/migrations/004_pdf_logo_storage.sql` and
   read the output. Confirm there is no existing `pdf-logos` bucket you did not create.
2. Apply the migration in the SQL Editor. It never modifies or deletes anything and it fails closed: it
   stops with an explanatory error (and rolls back) if the bucket exists with different settings, if any
   `pdf_logos_*` policy exists, or if it finds **any existing storage policy it cannot prove covers only
   some other bucket**. Storage policies are ORed, so a broad existing policy (for example
   `bucket_id <> 'avatars'`, `USING (true)`, anything with `OR`, a function or a sub-select) could expose
   saved logos. Only policies shaped like `(bucket_id = 'other')`, or starting with that condition
   followed by `AND ...`, are accepted. If yours is rejected, review it, rewrite it deliberately into
   that shape (or drop it if it is not needed), then re-run.
3. Run the verify queries at the top of the same file.
4. **Apply the migration before deploying the app version that uses it.** If the bucket is missing, the
   dialog still works (WFG and one-time logos export normally); saving shows "saving is not available".

### Retention and account deletion (required operational procedure)

A saved logo is kept until the user removes it or their account is deleted. **Deleting a user in
Supabase does not delete their stored logo**, because Storage objects are not linked to `auth.users`.
Follow this whenever an account is deleted:

1. **Before deleting the user** (Dashboard → Authentication → Users), delete their logo:
   - Dashboard → Storage → `pdf-logos` → open the folder named after the user's id → delete `logo.png`, or
   - with the Storage API from a trusted server or one-off script (never from the browser):
     `await adminClient.storage.from('pdf-logos').remove([`${userId}/logo.png`])`
2. **Do not delete with SQL** (`DELETE FROM storage.objects ...`). That removes the database row but
   leaves the file in object storage, unreachable and untracked.
3. **Sweep for orphans** (accounts deleted without step 1). Run this read-only query, then delete each
   listed object through the Dashboard or the Storage API:
   ```sql
   select o.name, o.created_at
   from storage.objects o
   where o.bucket_id = 'pdf-logos'
     and not exists (select 1 from auth.users u where u.id::text = split_part(o.name, '/', 1))
   order by o.created_at;
   ```
   Run it after any bulk account cleanup, and at least quarterly until deletion is automated.
4. **Future automation (not implemented):** a Supabase Edge Function using the service role, triggered
   by a user-deleted webhook, that removes `<user id>/logo.png`. The service-role key must only ever
   live in that function's secrets.

Users can remove their own logo at any time with **Remove saved logo** in the dialog.

## Troubleshooting

- **"Missing Supabase environment variables"** → Check `.env.local` has both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- **Auth not persisting** → Supabase stores sessions in localStorage by default; clear storage and try again
- **RLS blocking inserts** → Ensure the insert policy's `WITH CHECK` clause matches `auth.uid() = user_id`
