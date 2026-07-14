'use strict';

const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../../config/supabase');
const { getPagination } = require('../../utils/pagination');
const { logActivity } = require('../audit/audit.service');
const { createNotification, notifyMany } = require('../notifications/notifications.service');

// ── Appointment tables expected: appointments + appointment_attendees ─────────

async function listAppointments({ query, userId, userRole, userPermissions }) {
  const { from, to, page, limit } = getPagination(query);
  const isAdmin = userPermissions.includes('appointments:manage');

  let q = supabase.from('appointments')
    .select(`
      id, title_ar, title_en, type, status, scheduled_at, duration_min,
      location_ar, location_en, is_virtual, organizer_id,
      project:projects(id, name_ar, project_number),
      organizer:users!organizer_id(id, full_name_ar, avatar_url),
      appointment_attendees(user_id, status)
    `, { count: 'exact' })
    .not('status', 'eq', 'cancelled')
    .range(from, to)
    .order('scheduled_at', { ascending: true });

  if (!isAdmin) {
    q = q.eq('appointment_attendees.user_id', userId);
  }

  if (query.status)     q = q.eq('status', query.status);
  if (query.project_id) q = q.eq('project_id', query.project_id);
  if (query.from_date)  q = q.gte('scheduled_at', query.from_date);
  if (query.to_date)    q = q.lte('scheduled_at', query.to_date);

  const { data, count, error } = await q;
  if (error) throw error;
  return { data, total: count, page, limit };
}

async function getAppointmentById(id) {
  const { data, error } = await supabase.from('appointments')
    .select(`
      *,
      project:projects(id, name_ar, project_number),
      organizer:users!organizer_id(id, full_name_ar, full_name_en, avatar_url),
      appointment_attendees(
        user_id, status, joined_at, left_at,
        user:users(id, full_name_ar, full_name_en, avatar_url)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) throw { status: 404, message: 'Appointment not found' };
  return data;
}

async function createAppointment({ body, requesterId }) {
  const {
    title_ar, title_en, type, project_id, scheduled_at, duration_min,
    location_ar, location_en, is_virtual, recording_enabled,
    agenda_ar, agenda_en, attendee_ids = [],
  } = body;

  const { data, error } = await supabase.from('appointments').insert({
    id: uuidv4(),
    title_ar, title_en, type: type || 'internal',
    project_id, scheduled_at, duration_min: duration_min || 60,
    location_ar, location_en, is_virtual: is_virtual !== false,
    recording_enabled: recording_enabled !== false,
    agenda_ar, agenda_en,
    status: 'scheduled',
    organizer_id: requesterId,
  }).select().single();
  if (error) throw error;

  // Add organizer as attendee
  const allAttendees = [...new Set([requesterId, ...attendee_ids])];
  if (allAttendees.length > 0) {
    await supabase.from('appointment_attendees').insert(
      allAttendees.map(uid => ({
        appointment_id: data.id,
        user_id: uid,
        status: uid === requesterId ? 'accepted' : 'invited',
      }))
    );
  }

  // Notify attendees
  const others = allAttendees.filter(uid => uid !== requesterId);
  await notifyMany(others, {
    type: 'appointment_invited',
    title_ar: 'دعوة لاجتماع',
    title_en: 'Meeting Invitation',
    body_ar: `تمت دعوتك لـ: ${title_ar}`,
    body_en: `You are invited to: ${title_en || title_ar}`,
    data: { entity_type: 'appointment', entity_id: data.id },
  });

  await logActivity({ userId: requesterId, action: 'create', entityType: 'appointment', entityId: data.id });
  return data;
}

async function updateAppointment({ id, body, requesterId }) {
  const allowed = ['title_ar', 'title_en', 'status', 'scheduled_at', 'duration_min',
    'location_ar', 'location_en', 'is_virtual', 'agenda_ar', 'agenda_en',
    'minutes_ar', 'minutes_en', 'recording_url', 'room_id'];
  const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('appointments').update(updates).eq('id', id).select().single();
  if (error) throw error;

  await logActivity({ userId: requesterId, action: 'update', entityType: 'appointment', entityId: id, newValues: updates });
  return data;
}

async function cancelAppointment({ id, requesterId }) {
  const { data, error } = await supabase.from('appointments').update({
    status: 'cancelled',
    updated_at: new Date().toISOString(),
  }).eq('id', id).select('title_ar, title_en').single();
  if (error) throw error;

  // Get attendees to notify
  const { data: attendees } = await supabase.from('appointment_attendees').select('user_id').eq('appointment_id', id);
  const ids = (attendees || []).map(a => a.user_id).filter(uid => uid !== requesterId);
  await notifyMany(ids, {
    type: 'appointment_cancelled',
    title_ar: 'تم إلغاء الاجتماع',
    title_en: 'Meeting Cancelled',
    body_ar: `تم إلغاء الاجتماع: ${data.title_ar}`,
    body_en: `Meeting cancelled: ${data.title_en || data.title_ar}`,
    data: { entity_type: 'appointment', entity_id: id },
  });

  await logActivity({ userId: requesterId, action: 'cancel', entityType: 'appointment', entityId: id });
}

async function respondToInvite({ appointmentId, userId, status }) {
  await supabase.from('appointment_attendees')
    .update({ status })
    .match({ appointment_id: appointmentId, user_id: userId });
}

async function joinAppointment({ appointmentId, userId }) {
  await supabase.from('appointment_attendees')
    .update({ joined_at: new Date().toISOString(), status: 'attended' })
    .match({ appointment_id: appointmentId, user_id: userId });

  // Here: generate video room token via Daily.co / Jitsi
  const roomId = `memar-${appointmentId.split('-')[0]}`;
  return { roomId, joinUrl: `https://meet.jit.si/${roomId}` };
}

module.exports = { listAppointments, getAppointmentById, createAppointment, updateAppointment, cancelAppointment, respondToInvite, joinAppointment };
