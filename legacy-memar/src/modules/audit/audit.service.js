'use strict';

const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../../config/supabase');
const { getPagination } = require('../../utils/pagination');

/**
 * Log an activity — called internally from all services.
 * Non-blocking: errors are logged but do NOT throw.
 */
async function logActivity({ userId, action, entityType, entityId, oldValues, newValues, ipAddress, userAgent }) {
  try {
    await supabase.from('audit_logs').insert({
      id: uuidv4(),
      user_id: userId || null,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      old_values: oldValues || null,
      new_values: newValues || null,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Never throw from audit — just log
    console.error('[Audit] Insert error:', err?.message);
  }
}

async function listLogs({ query, userId, isAdmin }) {
  const { from, to, page, limit } = getPagination(query);
  const { action, entity_type, user_id, from_date, to_date } = query;

  let q = supabase.from('audit_logs')
    .select(`
      id, action, entity_type, entity_id, ip_address, created_at,
      user:users(id, full_name_ar, email, role)
    `, { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  // Non-admins can only see their own logs
  if (!isAdmin) q = q.eq('user_id', userId);
  else if (user_id) q = q.eq('user_id', user_id);

  if (action)      q = q.eq('action', action);
  if (entity_type) q = q.eq('entity_type', entity_type);
  if (from_date)   q = q.gte('created_at', from_date);
  if (to_date)     q = q.lte('created_at', to_date);

  const { data, count, error } = await q;
  if (error) throw error;
  return { data, total: count, page, limit };
}

async function getLogById(id) {
  const { data, error } = await supabase.from('audit_logs')
    .select('*, user:users(id, full_name_ar, email)')
    .eq('id', id)
    .single();
  if (error || !data) throw { status: 404, message: 'Log not found' };
  return data;
}

module.exports = { logActivity, listLogs, getLogById };
