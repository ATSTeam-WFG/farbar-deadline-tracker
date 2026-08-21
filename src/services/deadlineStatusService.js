import { supabase } from '../lib/supabase';

export async function getDeadlineStatuses(reportId) {
  const { data, error } = await supabase
    .from('deadline_statuses')
    .select('deadline_id, status, note, updated_at')
    .eq('report_id', reportId);

  if (error) throw error;

  const map = {};
  for (const row of data) {
    map[row.deadline_id] = { status: row.status, note: row.note, updatedAt: row.updated_at };
  }
  return map;
}

export async function upsertDeadlineStatus(reportId, userId, deadlineId, status, note = null) {
  const { error } = await supabase
    .from('deadline_statuses')
    .upsert(
      {
        report_id: reportId,
        user_id: userId,
        deadline_id: deadlineId,
        status,
        note,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'report_id,deadline_id' }
    );

  if (error) throw error;
}
