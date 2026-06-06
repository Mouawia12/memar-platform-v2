'use strict';

const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../../config/supabase');
const { emitToUser } = require('../../websocket/ws.server');
const { getPagination } = require('../../utils/pagination');

/**
 * Core function — create & deliver a notification to a user
 */
async function createNotification({
  userId, type, title_ar, title_en, body_ar, body_en,
  data = {}, channel = 'in_app',
}) {
  if (!userId) return;

  const notif = {
    id: uuidv4(),
    user_id: userId,
    type,
    title_ar: title_ar || '',
    title_en: title_en || '',
    body_ar:  body_ar || '',
    body_en:  body_en || '',
    data,
    channel,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  const { data: saved, error } = await supabase.from('notifications').insert(notif).select().single();
  if (error) { console.error('Notification insert error:', error); return; }

  // Push real-time via WebSocket
  emitToUser(userId, 'notification.new', saved);

  return saved;
}

/**
 * Bulk notify multiple users
 */
async function notifyMany(userIds, payload) {
  return Promise.all(userIds.map(userId => createNotification({ userId, ...payload })));
}

/**
 * Fetch notifications for a user — grouped by urgency
 */
async function listNotifications({ userId, query }) {
  const { from, to, page, limit } = getPagination(query);
  const { is_read, type } = query;

  let q = supabase.from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .range(from, to)
    .order('created_at', { ascending: false });

  if (is_read !== undefined) q = q.eq('is_read', is_read === 'true');
  if (type)                  q = q.eq('type', type);

  const { data, count, error } = await q;
  if (error) throw error;

  return { data, total: count, page, limit, unread: (data || []).filter(n => !n.is_read).length };
}

async function markRead({ notifId, userId }) {
  await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notifId).eq('user_id', userId);
}

async function markAllRead(userId) {
  await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId).eq('is_read', false);
}

async function getPreferences(userId) {
  const { data, error } = await supabase.from('notification_preferences').select('*').eq('user_id', userId);
  if (error) throw error;
  return data;
}

async function updatePreferences(userId, prefs) {
  // prefs = [{ event_type, in_app, email, sms, push }]
  const rows = prefs.map(p => ({ user_id: userId, ...p }));
  const { data, error } = await supabase.from('notification_preferences')
    .upsert(rows, { onConflict: 'user_id,event_type' })
    .select();
  if (error) throw error;
  return data;
}

module.exports = { createNotification, notifyMany, listNotifications, markRead, markAllRead, getPreferences, updatePreferences };
