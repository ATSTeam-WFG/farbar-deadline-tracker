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

## Troubleshooting

- **"Missing Supabase environment variables"** → Check `.env.local` has both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- **Auth not persisting** → Supabase stores sessions in localStorage by default; clear storage and try again
- **RLS blocking inserts** → Ensure the insert policy's `WITH CHECK` clause matches `auth.uid() = user_id`
