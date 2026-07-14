/* ═══════════════════════════════════════════════════════
   MEMAR PLATFORM — Supabase Client
   Shared across: ERP, Portal, Website
   Version: 1.1.0
   ⚠️ SECURITY: In production, inject MEMAR_ENV via server-side
   template or build tool to avoid exposing keys in source.
═══════════════════════════════════════════════════════ */

const MEMAR_SUPABASE_URL  = (window.MEMAR_ENV?.SUPABASE_URL)  || 'https://lnhbmwercpvgegsecjhh.supabase.co';
const MEMAR_SUPABASE_KEY  = (window.MEMAR_ENV?.SUPABASE_KEY)  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuaGJtd2VyY3B2Z2Vnc2VjamhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4OTg1OTcsImV4cCI6MjA5MjQ3NDU5N30.18G25sd0QVTijMOzfo-HH-mWOZNLgf8tmuRGHeeDDmM';

/* ── Init client (lazy — waits for SDK to load) ── */
let _sb = null;
function getSB() {
  if (_sb) return _sb;
  if (typeof window.supabase !== 'undefined') {
    _sb = window.supabase.createClient(MEMAR_SUPABASE_URL, MEMAR_SUPABASE_KEY);
    return _sb;
  }
  console.warn('[MemarDB] Supabase SDK not loaded yet');
  return null;
}

/* ═══════════════════════════════════════════════════════
   MemarDB — Database Abstraction Layer
   Pattern: Online-First with LocalStorage Cache
═══════════════════════════════════════════════════════ */
window.MemarDB = {
  
  _cache: {},
  _online: navigator.onLine,

  /* ── connectivity tracking ── */
  init() {
    window.addEventListener('online',  () => { this._online = true;  console.log('[MemarDB] 🟢 Online'); });
    window.addEventListener('offline', () => { this._online = false; console.log('[MemarDB] 🔴 Offline'); });
  },

  /* ── Generic fetch from Supabase with cache fallback ── */
  async fetchTable(table, opts = {}) {
    const cacheKey = `memar_sb_${table}`;
    const sb = getSB();
    
    if (sb && this._online) {
      try {
        let q = sb.from(table).select(opts.select || '*');
        if (opts.filter)  q = q.match(opts.filter);
        if (opts.eq)      Object.entries(opts.eq).forEach(([k,v]) => { q = q.eq(k, v); });
        if (opts.order)   q = q.order(opts.order.col, { ascending: opts.order.asc ?? true });
        if (opts.limit)   q = q.limit(opts.limit);
        // Note: is_deleted filter is applied only if explicitly requested
        // (not all tables have this column in older schema versions)
        if (opts.filterDeleted) q = q.eq('is_deleted', false);

        const { data, error } = await q;
        if (error) throw error;

        // Cache the result
        try { localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data })); } catch(e) {}
        return data || [];
      } catch(e) {
        console.warn(`[MemarDB] Supabase fetch failed for ${table}:`, e.message);
      }
    }

    // Fallback to cache
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if (cached?.data) {
        console.log(`[MemarDB] 📦 Using cache for ${table}`);
        return cached.data;
      }
    } catch(e) {}

    return [];
  },


  /* ── Insert a row ── */
  async insert(table, row) {
    const sb = getSB();
    if (!sb) return { error: 'Supabase not ready' };
    const { data, error } = await sb.from(table).insert(row).select().single();
    if (!error) this._invalidateCache(table);
    return { data, error };
  },

  /* ── Update a row ── */
  async update(table, id, changes) {
    const sb = getSB();
    if (!sb) return { error: 'Supabase not ready' };
    const { data, error } = await sb.from(table).update({ ...changes, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (!error) this._invalidateCache(table);
    return { data, error };
  },

  /* ── Soft delete ── */
  async softDelete(table, id) {
    return this.update(table, id, { is_deleted: true, deleted_at: new Date().toISOString() });
  },

  /* ── Hard delete (use sparingly) ── */
  async hardDelete(table, id) {
    const sb = getSB();
    if (!sb) return { error: 'Supabase not ready' };
    const { error } = await sb.from(table).delete().eq('id', id);
    if (!error) this._invalidateCache(table);
    return { error };
  },

  /* ── Upsert ── */
  async upsert(table, row, conflictCol = 'id') {
    const sb = getSB();
    if (!sb) return { error: 'Supabase not ready' };
    const { data, error } = await sb.from(table).upsert(row, { onConflict: conflictCol }).select().single();
    if (!error) this._invalidateCache(table);
    return { data, error };
  },

  /* ── Log to audit_logs ── */
  async logAction(action, entityType, entityId, details = {}) {
    const sb = getSB();
    if (!sb) return;
    try {
      const u = JSON.parse(localStorage.getItem('memar_user') || '{}');
      await sb.from('audit_logs').insert({
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        new_values: details,
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString()
      });
    } catch(e) { /* audit errors should never break the UI */ }
  },

  _invalidateCache(table) {
    try { localStorage.removeItem(`memar_sb_${table}`); } catch(e) {}
  },

  /* ── Realtime subscription ── */
  subscribe(table, callback) {
    const sb = getSB();
    if (!sb) return null;
    return sb.channel(`memar_${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();
  },

  /* ── Auth helpers ── */
  async signIn(email, password) {
    const sb = getSB();
    if (!sb) throw new Error('Supabase not ready');
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const sb = getSB();
    if (!sb) return;
    await sb.auth.signOut();
  },

  async getSession() {
    const sb = getSB();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data?.session || null;
  },

  async getCurrentUser() {
    const sb = getSB();
    if (!sb) return null;
    const { data } = await sb.auth.getUser();
    return data?.user || null;
  },

  /* ── Get user profile from public.users ── */
  async getUserProfile(authId) {
    const sb = getSB();
    if (!sb) return null;
    const { data } = await sb.from('users').select('*').eq('id', authId).single();
    return data;
  }
};

/* Auto-init */
if (typeof window !== 'undefined') {
  window.MemarDB.init();
}

/* ═══════════════════════════════════════════════════════
   Memar Platform Helper — Unified User, Client & Employee Sync
   ═══════════════════════════════════════════════════════ */
window.memar_createLeadAndClient = async function(data) {
  // ── Rate Limiting: max 5 calls per minute ──
  const RL_KEY = '_memar_rl_leads';
  try {
    const now = Date.now();
    let rl = JSON.parse(sessionStorage.getItem(RL_KEY) || '[]');
    rl = rl.filter(ts => now - ts < 60000); // keep only last 60s
    if (rl.length >= 5) {
      console.warn('[MemarDB] Rate limit exceeded for lead creation');
      return { error: 'rate_limited', message: 'يرجى الانتظار قليلاً قبل المحاولة مرة أخرى' };
    }
    rl.push(now);
    sessionStorage.setItem(RL_KEY, JSON.stringify(rl));
  } catch(e) {}

  // Sanitize inputs to prevent XSS
  const sanitize = (v) => typeof v === 'string' ? v.replace(/<[^>]*>/g, '').trim() : v;
  const name = sanitize(data.name);
  const phone = sanitize(data.phone);
  const email = sanitize(data.email);
  const source = sanitize(data.source);
  const details = sanitize(data.details);
  const role = sanitize(data.role);
  const type = sanitize(data.type);
  const password = data.password; // don't sanitize passwords
  const theRole = role || 'client'; // default role
  
  // 1. Sync to memar_sys_users (سجل المستخدمين)
  let sysUsers = [];
  try { sysUsers = JSON.parse(localStorage.getItem('memar_sys_users') || '[]'); } catch(e){}
  
  let userId = 'USR-' + Date.now();
  let existingSysUser = sysUsers.find(u => (email && u.email === email) || (phone && u.phone === phone));
  if (!existingSysUser) {
    existingSysUser = {
      id: userId,
      name: name || 'مستخدم جديد',
      full_name: name || 'مستخدم جديد',
      email: email || '',
      phone: phone || '',
      username: email ? email.split('@')[0] : (phone || userId),
      password: password || '123456',
      role_id: theRole === 'client' ? 'R_CLIENT' : (theRole === 'admin' ? 'R_ADMIN' : 'R_USER'),
      account_type: ['employee','admin'].includes(theRole) ? theRole : 'client',
      status: 'active',
      created_at: new Date().toISOString()
    };
    sysUsers.push(existingSysUser);
  } else {
    userId = existingSysUser.id;
    if (name) {
      existingSysUser.name = name;
      existingSysUser.full_name = name;
    }
    if (theRole !== 'client') {
      existingSysUser.role_id = theRole === 'admin' ? 'R_ADMIN' : 'R_USER';
      existingSysUser.account_type = ['employee','admin'].includes(theRole) ? theRole : 'client';
    }
    // Don't overwrite an admin role with a client role
  }
  localStorage.setItem('memar_sys_users', JSON.stringify(sysUsers));

  let existingClient = null;
  let newLead = null;
  
  // 2. Sync to Clients or Employees based on role
  if (['client', 'company', 'individual'].includes(theRole) || !theRole || theRole === 'client') {
    // Sync to CRM Clients (سجل العملاء)
    let clients = [];
    try { clients = JSON.parse(localStorage.getItem('memar_crm_clients') || '[]'); } catch(e){}
    
    existingClient = clients.find(c => (email && c.email === email) || (phone && c.phone === phone) || c.id === userId);
    if (!existingClient) {
      existingClient = {
        id: userId,
        name: name || 'مستخدم جديد',
        phone: phone || '',
        email: email || '',
        type: type || 'individual',
        status: 'active',
        created_at: new Date().toISOString(),
        source: source || 'website'
      };
      clients.push(existingClient);
    } else {
       if (name) existingClient.name = name;
    }
    localStorage.setItem('memar_crm_clients', JSON.stringify(clients));

    // Sync to CRM Leads (الفرص البيعية)
    let leads = [];
    try { leads = JSON.parse(localStorage.getItem('memar_crm_leads') || '[]'); } catch(e){}
    newLead = {
      id: Date.now(),
      clientId: existingClient.id,
      name: name || 'مستخدم جديد',
      stage: 'inquiry',
      source: source || 'website',
      priority: 'medium',
      email: email || '',
      phone: phone || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: details || ''
    };
    
    // Prevent duplicate leads within 1 hour
    const recentLead = leads.find(l => l.clientId === existingClient.id && (Date.now() - new Date(l.createdAt).getTime() < 3600000));
    if (!recentLead) {
      leads.unshift(newLead);
      localStorage.setItem('memar_crm_leads', JSON.stringify(leads));
    }
  } else {
    // Sync to HR Employees (سجل الموظفين)
    let employees = [];
    try { employees = JSON.parse(localStorage.getItem('memar_hr_employees') || '[]'); } catch(e){}
    let existingEmp = employees.find(e => (email && e.email === email) || (phone && e.phone === phone) || e.id === userId);
    if (!existingEmp) {
       existingEmp = {
         id: userId,
         name: name || 'مستخدم جديد',
         email: email || '',
         phone: phone || '',
         role: theRole,
         status: 'active',
         department: 'عام',
         join_date: new Date().toISOString()
       };
       employees.push(existingEmp);
    } else {
       if (name) existingEmp.name = name;
       existingEmp.role = theRole;
    }
    localStorage.setItem('memar_hr_employees', JSON.stringify(employees));
  }

  // 3. Try to push to Supabase (Non-blocking)
  try {
    if (window.MemarDB) {
      await window.MemarDB.upsert('users', existingSysUser);
      if (existingClient) await window.MemarDB.upsert('clients', existingClient);
      if (newLead) await window.MemarDB.insert('memar_leads', newLead);
    }
  } catch(e) { console.warn('[Memar] Supabase sync failed', e.message); }

  // 4. Notify ERP to refresh if open
  try {
    const bc = new BroadcastChannel('memar_erp_sync');
    bc.postMessage({ action: 'new_global_user', data: { user: existingSysUser, client: existingClient, lead: newLead } });
    bc.postMessage({ action: 'new_lead_client', data: { client: existingClient, lead: newLead } }); // backwards compatibility
  } catch(e){}

  return { user: existingSysUser, client: existingClient, lead: newLead };
};

