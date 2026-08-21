// Supabase Edge Function: send-deadline-emails
// Scaffold — email sending is deferred until Resend API key is configured.
//
// To activate:
// 1. Add RESEND_API_KEY to Supabase project secrets (Dashboard → Settings → Edge Functions)
// 2. Deploy: supabase functions deploy send-deadline-emails
// 3. Schedule via pg_cron or a Supabase cron job to call this daily

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_URL = 'https://api.resend.com/emails';

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const resendApiKey = Deno.env.get('RESEND_API_KEY');

  if (!resendApiKey) {
    return new Response(
      JSON.stringify({ message: 'RESEND_API_KEY not configured. Email sending is disabled.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Pull pending notifications due now
  const now = new Date().toISOString();
  const { data: pending, error } = await supabase
    .from('notification_queue')
    .select(`
      id, deadline_id, scheduled_for,
      reports ( report_name, property_address, result ),
      user_id
    `)
    .eq('status', 'pending')
    .lte('scheduled_for', now)
    .limit(50);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const notification of pending ?? []) {
    try {
      // Get user email from auth.users via admin API
      const { data: userData } = await supabase.auth.admin.getUserById(notification.user_id);
      const userEmail = userData?.user?.email;
      if (!userEmail) continue;

      const report = notification.reports as any;
      const deadlines = report?.result?.deadlines ?? [];
      const deadline = deadlines.find((d: any) => d.id === notification.deadline_id);
      if (!deadline) continue;

      const emailBody = {
        from: 'Florida Deadline Calculator <noreply@yourdomain.com>',
        to: [userEmail],
        subject: `Deadline Reminder: ${deadline.name}`,
        html: `
          <h2>Deadline Reminder</h2>
          <p>You have an upcoming deadline for <strong>${report.report_name || report.property_address}</strong>:</p>
          <ul>
            <li><strong>${deadline.name}</strong></li>
            <li>Due: ${deadline.dueDate}</li>
            <li>${deadline.description}</li>
          </ul>
          <p>Log in to the Florida Deadline Calculator to view all deadlines.</p>
        `,
      };

      const res = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailBody),
      });

      if (res.ok) {
        await supabase
          .from('notification_queue')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', notification.id);
        sent++;
      } else {
        await supabase
          .from('notification_queue')
          .update({ status: 'failed' })
          .eq('id', notification.id);
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return new Response(
    JSON.stringify({ processed: pending?.length ?? 0, sent, failed }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
