'use strict';

const { supabase } = require('../../config/supabase');
const { ROLE_DEFAULTS } = require('../../config/permissions');
const { logActivity } = require('../audit/audit.service');
const { getPagination } = require('../../utils/pagination');

async function listRoles({ query }) {
  const { from, to, page, limit } = getPagination(query);
  const { data, count, error } = await supabase
    .from('roles')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('name');
  if (error) throw error;
  return { data, total: count, page, limit };
}

async function getRoleById(id) {
  const { data, error } = await supabase.from('roles').select('*').eq('id', id).single();
  if (error || !data) throw { status: 404, message: 'Role not found' };
  return data;
}

async function createRole({ body, requesterId }) {
  const { name, permissions, description_ar, description_en } = body;
  const { data, error } = await supabase.from('roles').insert({
    name, permissions: permissions || [],
    description_ar, description_en,
  }).select().single();
  if (error) throw error;
  await logActivity({ userId: requesterId, action: 'create', entityType: 'role', entityId: data.id });
  return data;
}

async function updateRole({ id, body, requesterId }) {
  const allowed = ['name', 'permissions', 'description_ar', 'description_en'];
  const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));

  const { data, error } = await supabase.from('roles').update(updates).eq('id', id).select().single();
  if (error) throw error;
  await logActivity({ userId: requesterId, action: 'update', entityType: 'role', entityId: id, newValues: updates });
  return data;
}

async function deleteRole({ id, requesterId }) {
  // Check no users have this role
  const { count } = await supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role_id', id);
  if (count > 0) throw { status: 409, message: `Cannot delete role — ${count} users assigned to it` };
  await supabase.from('roles').delete().eq('id', id);
  await logActivity({ userId: requesterId, action: 'delete', entityType: 'role', entityId: id });
}

// Seed default roles from config
async function seedDefaultRoles() {
  for (const [name, permissions] of Object.entries(ROLE_DEFAULTS)) {
    await supabase.from('roles').upsert({ name, permissions }, { onConflict: 'name', ignoreDuplicates: false });
  }
}

module.exports = { listRoles, getRoleById, createRole, updateRole, deleteRole, seedDefaultRoles };
