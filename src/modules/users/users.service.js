'use strict';

const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../../config/supabase');
const { getPagination } = require('../../utils/pagination');
const { logActivity } = require('../audit/audit.service');
const { createNotification } = require('../notifications/notifications.service');

async function listUsers({ query, requesterId, requesterRole }) {
  const { page, limit, from, to } = getPagination(query);
  const { role, is_active, search, sortBy = 'created_at', sortDir = 'desc' } = query;

  let q = supabase.from('users')
    .select('id, role, full_name_ar, full_name_en, email, phone, avatar_url, is_active, last_login_at, created_at', { count: 'exact' })
    .is('deleted_at', null)
    .range(from, to)
    .order(sortBy, { ascending: sortDir === 'asc' });

  if (role)      q = q.eq('role', role);
  if (is_active !== undefined) q = q.eq('is_active', is_active === 'true');
  if (search)    q = q.or(`full_name_ar.ilike.%${search}%,full_name_en.ilike.%${search}%,email.ilike.%${search}%`);

  const { data, count, error } = await q;
  if (error) throw error;
  return { data, total: count, page, limit };
}

async function getUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select(`id, role, full_name_ar, full_name_en, email, phone, avatar_url,
             preferred_lang, is_active, last_login_at, created_at, metadata,
             user_roles(roles(id, name, permissions))`)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !data) throw { status: 404, message: 'User not found' };
  return data;
}

async function createUser({ body, requesterId }) {
  const { email, password, role, full_name_ar, full_name_en, phone, preferred_lang } = body;

  // Create Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    password,
    email_confirm: true,
  });
  if (authError) throw { status: 400, message: authError.message };

  const userId = authData.user.id;

  // Insert into our users table
  const { data: user, error } = await supabase.from('users').insert({
    id: userId,
    email: email.toLowerCase().trim(),
    role: role || 'client',
    full_name_ar,
    full_name_en,
    phone,
    preferred_lang: preferred_lang || 'ar',
    is_active: true,
  }).select().single();

  if (error) throw error;

  await logActivity({ userId: requesterId, action: 'create', entityType: 'user', entityId: userId });
  await createNotification({
    userId,
    type: 'welcome',
    title_ar: 'مرحباً بك في منصة معمار',
    title_en: 'Welcome to Memar Platform',
    body_ar: 'تم إنشاء حسابك بنجاح.',
    body_en: 'Your account has been created successfully.',
  });

  return user;
}

async function updateUser({ id, body, requesterId }) {
  const allowed = ['full_name_ar', 'full_name_en', 'phone', 'avatar_url', 'preferred_lang', 'is_active', 'role', 'metadata'];
  const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
  if (error) throw error;

  await logActivity({ userId: requesterId, action: 'update', entityType: 'user', entityId: id, newValues: updates });
  return data;
}

async function softDeleteUser({ id, requesterId }) {
  await supabase.from('users').update({ deleted_at: new Date().toISOString(), is_active: false }).eq('id', id);
  await logActivity({ userId: requesterId, action: 'delete', entityType: 'user', entityId: id });
}

async function assignRole({ userId, roleId, grantedBy }) {
  const { data: role } = await supabase.from('roles').select('id').eq('id', roleId).single();
  if (!role) throw { status: 404, message: 'Role not found' };

  const { error } = await supabase.from('user_roles').upsert({
    user_id: userId,
    role_id: roleId,
    granted_by: grantedBy,
    granted_at: new Date().toISOString(),
  }, { onConflict: 'user_id,role_id' });
  if (error) throw error;

  await logActivity({ userId: grantedBy, action: 'assign_role', entityType: 'user', entityId: userId, newValues: { roleId } });
}

async function removeRole({ userId, roleId, requesterId }) {
  await supabase.from('user_roles').delete().match({ user_id: userId, role_id: roleId });
  await logActivity({ userId: requesterId, action: 'remove_role', entityType: 'user', entityId: userId, newValues: { roleId } });
}

module.exports = { listUsers, getUserById, createUser, updateUser, softDeleteUser, assignRole, removeRole };
