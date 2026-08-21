import { supabase } from '../lib/supabase';

export async function saveReport(userId, { contractData, result }, reportName) {
  const name = reportName || contractData.propertyAddress || 'Untitled Report';

  const { data, error } = await supabase
    .from('reports')
    .insert({
      user_id: userId,
      report_name: name,
      property_address: contractData.propertyAddress || null,
      status: 'active',
      contract_data: contractData,
      result,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function getUserReports(userId) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getReport(reportId) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateReport(reportId, updates) {
  const { error } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', reportId);

  if (error) throw error;
}

export async function deleteReport(reportId) {
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', reportId);

  if (error) throw error;
}

export async function renameReport(reportId, name) {
  return updateReport(reportId, { report_name: name });
}

export async function setReportStatus(reportId, status) {
  return updateReport(reportId, { status });
}
