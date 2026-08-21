import { supabase } from '../lib/supabase';

const DEFAULT_PREFERENCES = {
  emailNotifications: false,
  notifyDaysBefore: 3,
  notificationTime: '09:00',
  deadlineTypes: {
    critical: true,
    urgent: true,
    warning: true,
    info: false,
  },
};

export async function getUserPreferences(userId) {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { ...DEFAULT_PREFERENCES };

  return {
    emailNotifications: data.email_notifications,
    notifyDaysBefore: data.notify_days_before,
    notificationTime: data.notification_time,
    deadlineTypes: data.deadline_types,
    hiddenDeadlineIds: data.hidden_deadline_ids ?? [],
  };
}

export async function updateUserPreferences(userId, preferences) {
  const row = {
    user_id: userId,
    email_notifications: preferences.emailNotifications,
    notify_days_before: preferences.notifyDaysBefore,
    notification_time: preferences.notificationTime,
    deadline_types: preferences.deadlineTypes,
    updated_at: new Date().toISOString(),
  };

  if (preferences.hiddenDeadlineIds !== undefined) {
    row.hidden_deadline_ids = preferences.hiddenDeadlineIds;
  }

  const { error } = await supabase
    .from('user_preferences')
    .upsert(row, { onConflict: 'user_id' });

  if (error) throw error;
  return true;
}
