import { supabase } from '../lib/supabase';

export async function recordDisclaimerAcceptance(userId = null, version = 'wfg_v1') {
  const { error } = await supabase
    .from('disclaimer_acceptances')
    .upsert(
      {
        user_id: userId,
        version,
        accepted_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
      },
      { onConflict: 'user_id,version', ignoreDuplicates: true }
    );
  if (error) console.error('Disclaimer record failed:', error);
}
