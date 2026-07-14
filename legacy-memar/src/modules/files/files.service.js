'use strict';

const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { supabase } = require('../../config/supabase');
const { logActivity } = require('../audit/audit.service');
const { getPagination } = require('../../utils/pagination');

const BUCKET = process.env.STORAGE_BUCKET || 'memar-files';
const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024;

// ── Multer (memory) ───────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    // Allow common office, image, PDF, CAD files
    const allowed = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|gif|webp|mp4|mp3|zip|rar|dwg|dxf|rvt)$/i;
    if (allowed.test(file.originalname)) cb(null, true);
    else cb(new Error(`File type not allowed: ${file.originalname}`));
  },
});

// ── Upload file ───────────────────────────────────────────────────────────────
async function uploadFile({ buffer, originalName, mimeType, entityType, entityId, userId, parentFileId, tags, isPublic }) {
  const fileExt  = originalName.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  const folder   = entityType ? `${entityType}/${entityId || 'general'}` : 'general';
  const path     = `${folder}/${fileName}`;

  // Upload to Supabase Storage
  const { data: storageData, error: storageErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (storageErr) throw { status: 500, message: `Storage error: ${storageErr.message}` };

  // Get public/signed URL
  let publicUrl = null;
  if (isPublic) {
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    publicUrl = urlData?.publicUrl;
  }

  // Determine version number
  let version = 1;
  if (parentFileId) {
    const { data: parent } = await supabase.from('files').select('version').eq('id', parentFileId).single();
    if (parent) version = (parent.version || 1) + 1;
    // Mark previous as not latest
    await supabase.from('files').update({ is_latest: false }).eq('id', parentFileId);
  }

  const { data: fileRecord, error: dbErr } = await supabase.from('files').insert({
    id: uuidv4(),
    name: fileName,
    original_name: originalName,
    mime_type: mimeType,
    size_bytes: buffer.length,
    storage_path: path,
    public_url: publicUrl,
    bucket: BUCKET,
    entity_type: entityType,
    entity_id: entityId,
    version,
    parent_file_id: parentFileId || null,
    is_latest: true,
    is_public: isPublic || false,
    tags: tags || [],
    uploaded_by: userId,
  }).select().single();

  if (dbErr) throw dbErr;

  await logActivity({ userId, action: 'upload', entityType: 'file', entityId: fileRecord.id, newValues: { originalName, entityType, entityId } });

  return fileRecord;
}

// ── Get file metadata ─────────────────────────────────────────────────────────
async function getFile(id) {
  const { data, error } = await supabase.from('files')
    .select('*, uploader:users!uploaded_by(id, full_name_ar)')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
  if (error || !data) throw { status: 404, message: 'File not found' };
  return data;
}

// ── List files for an entity ──────────────────────────────────────────────────
async function listFiles({ entityType, entityId, query }) {
  const { from, to, page, limit } = getPagination(query);

  let q = supabase.from('files')
    .select('id, name, original_name, mime_type, size_bytes, version, is_latest, tags, created_at, uploader:users!uploaded_by(id, full_name_ar)', { count: 'exact' })
    .is('deleted_at', null)
    .eq('is_latest', true)
    .range(from, to)
    .order('created_at', { ascending: false });

  if (entityType) q = q.eq('entity_type', entityType);
  if (entityId)   q = q.eq('entity_id', entityId);

  const { data, count, error } = await q;
  if (error) throw error;
  return { data, total: count, page, limit };
}

// ── Get signed download URL ───────────────────────────────────────────────────
async function getDownloadUrl(fileId, userId) {
  const file = await getFile(fileId);

  // Generate a 60-minute signed URL
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(file.storage_path, 3600);

  if (error) throw { status: 500, message: 'Could not generate download URL' };

  await logActivity({ userId, action: 'download', entityType: 'file', entityId: fileId });

  return { url: data.signedUrl, expiresIn: 3600, file };
}

// ── List versions ─────────────────────────────────────────────────────────────
async function getVersions(fileId) {
  const file = await getFile(fileId);

  // Walk the version chain
  const { data, error } = await supabase.from('files')
    .select('id, version, original_name, size_bytes, is_latest, created_at, uploader:users!uploaded_by(id, full_name_ar)')
    .or(`id.eq.${fileId},parent_file_id.eq.${fileId}`)
    .is('deleted_at', null)
    .order('version', { ascending: false });

  if (error) throw error;
  return data;
}

// ── Soft delete ───────────────────────────────────────────────────────────────
async function deleteFile({ fileId, userId }) {
  const file = await getFile(fileId);

  await supabase.from('files').update({ deleted_at: new Date().toISOString(), is_latest: false }).eq('id', fileId);
  await logActivity({ userId, action: 'delete', entityType: 'file', entityId: fileId });

  // Remove from storage
  await supabase.storage.from(BUCKET).remove([file.storage_path]);
}

// ── Grant/revoke file permissions ─────────────────────────────────────────────
async function grantPermission({ fileId, targetUserId, permission, grantedBy }) {
  await supabase.from('file_permissions').upsert({
    file_id: fileId, user_id: targetUserId, permission,
    granted_by: grantedBy, granted_at: new Date().toISOString(),
  }, { onConflict: 'file_id,user_id,permission' });
}

async function revokePermission({ fileId, targetUserId, requesterId }) {
  await supabase.from('file_permissions').delete().match({ file_id: fileId, user_id: targetUserId });
}

module.exports = {
  upload, uploadFile, getFile, listFiles, getDownloadUrl, getVersions,
  deleteFile, grantPermission, revokePermission,
};
