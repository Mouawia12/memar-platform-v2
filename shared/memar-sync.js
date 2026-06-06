/* ═══════════════════════════════════════════════════════
   MEMAR ERP — Global Event Bus & Real-Time Sync
   Pattern: Event-Driven Architecture + Supabase Realtime
   Version: 3.0 (Enterprise Integration)
═══════════════════════════════════════════════════════ */

window.MemarSync = {
  _listeners: {},
  _realtimeChannels: {},

  /**
   * Subscribe to a specific system event
   * @param {string} event - The event name (e.g., 'CLIENT_UPDATED')
   * @param {function} callback - Function to run when event occurs
   */
  subscribe(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(callback);
    console.log(`[MemarSync] Subscribed to ${event}`);
  },

  /**
   * Publish an event locally to update all active UI components
   * @param {string} event - The event name
   * @param {object} payload - The data passed to subscribers
   */
  publish(event, payload = {}) {
    if (event.startsWith('DB_SYNC')) {
      console.log(`[MemarSync] 📡 ${event}`);
    }
    
    // Trigger local listeners
    if (this._listeners[event]) {
      this._listeners[event].forEach(cb => {
        try { cb(payload); } catch (e) { console.error(`[MemarSync] Error in listener for ${event}:`, e); }
      });
    }

    // Only re-render ERP for data-change events (not meta events like GLOBAL_STATE_UPDATED)
    if (event.startsWith('DB_SYNC') && typeof ERP !== 'undefined' && typeof ERP.renderCurrentPage === 'function') {
        ERP.renderCurrentPage(); // Already debounced inside ERP
    }
  },

  /**
   * Setup Supabase Realtime subscriptions
   * Listens for changes in the database and fires local events
   */
  initRealtime() {
    if (typeof window.supabase === 'undefined' || typeof getSB !== 'function') {
        console.warn('[MemarSync] Supabase not loaded. Realtime disabled.');
        return;
    }
    
    const sb = getSB();
    if (!sb) return;

    console.log('[MemarSync] 🚀 Initializing Supabase Realtime Subscriptions...');

    // 1. Users & Clients Sync
    this._realtimeChannels.users = sb.channel('users_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'memar_sys_users' }, payload => {
        this.publish('DB_SYNC_USERS', payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'memar_crm_clients' }, payload => {
        this.publish('DB_SYNC_CLIENTS', payload);
      })
      .subscribe();

    // 2. Projects & Tasks Sync
    this._realtimeChannels.projects = sb.channel('projects_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, payload => {
        this.publish('DB_SYNC_PROJECTS', payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, payload => {
        this.publish('DB_SYNC_TASKS', payload);
      })
      .subscribe();

    // 3. Finance Sync
    this._realtimeChannels.finance = sb.channel('finance_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, payload => {
        this.publish('DB_SYNC_INVOICES', payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, payload => {
        this.publish('DB_SYNC_PAYMENTS', payload);
      })
      .subscribe();
      
    // Default listeners to update Local Cache & State automatically
    this._setupDefaultCacheHandlers();
  },

  _setupDefaultCacheHandlers() {
     // Whenever a user is updated in the DB, update DB_TABLES and local storage
     this.subscribe('DB_SYNC_USERS', (payload) => {
         if (!window.DB_TABLES || !window.DB_TABLES.users) return;
         if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
             const idx = window.DB_TABLES.users.findIndex(u => u.id === payload.new.id);
             if (idx > -1) window.DB_TABLES.users[idx] = payload.new;
             else window.DB_TABLES.users.unshift(payload.new);
         } else if (payload.eventType === 'DELETE') {
             window.DB_TABLES.users = window.DB_TABLES.users.filter(u => u.id !== payload.old.id);
         }
         localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
         // Force global render to reflect changes everywhere
         this.publish('GLOBAL_STATE_UPDATED');
     });
     
     // Repeat for clients
     this.subscribe('DB_SYNC_CLIENTS', (payload) => {
         if (!window.DB_TABLES || !window.DB_TABLES.clients) return;
         if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
             const idx = window.DB_TABLES.clients.findIndex(c => c.id === payload.new.id);
             if (idx > -1) window.DB_TABLES.clients[idx] = payload.new;
             else window.DB_TABLES.clients.unshift(payload.new);
         } else if (payload.eventType === 'DELETE') {
             window.DB_TABLES.clients = window.DB_TABLES.clients.filter(c => c.id !== payload.old.id);
         }
         localStorage.setItem('memar_crm_clients', JSON.stringify(window.DB_TABLES.clients));
         this.publish('GLOBAL_STATE_UPDATED');
     });

     // Repeat for projects
     this.subscribe('DB_SYNC_PROJECTS', (payload) => {
         if (!window.DB_TABLES || !window.DB_TABLES.projects) return;
         if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
             const idx = window.DB_TABLES.projects.findIndex(p => p.id === payload.new.id);
             if (idx > -1) window.DB_TABLES.projects[idx] = payload.new;
             else window.DB_TABLES.projects.unshift(payload.new);
         } else if (payload.eventType === 'DELETE') {
             window.DB_TABLES.projects = window.DB_TABLES.projects.filter(p => p.id !== payload.old.id);
         }
         this.publish('GLOBAL_STATE_UPDATED');
     });

     // Repeat for tasks
     this.subscribe('DB_SYNC_TASKS', (payload) => {
         if (!window.DB_TABLES || !window.DB_TABLES.tasks) return;
         if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
             const idx = window.DB_TABLES.tasks.findIndex(t => t.id === payload.new.id);
             if (idx > -1) window.DB_TABLES.tasks[idx] = payload.new;
             else window.DB_TABLES.tasks.unshift(payload.new);
         } else if (payload.eventType === 'DELETE') {
             window.DB_TABLES.tasks = window.DB_TABLES.tasks.filter(t => t.id !== payload.old.id);
         }
         this.publish('GLOBAL_STATE_UPDATED');
     });

     // Repeat for invoices
     this.subscribe('DB_SYNC_INVOICES', (payload) => {
         if (!window.DB_TABLES || !window.DB_TABLES.invoices) return;
         if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
             const idx = window.DB_TABLES.invoices.findIndex(i => i.id === payload.new.id);
             if (idx > -1) window.DB_TABLES.invoices[idx] = payload.new;
             else window.DB_TABLES.invoices.unshift(payload.new);
         } else if (payload.eventType === 'DELETE') {
             window.DB_TABLES.invoices = window.DB_TABLES.invoices.filter(i => i.id !== payload.old.id);
         }
         this.publish('GLOBAL_STATE_UPDATED');
     });
  },

  /**
   * Unsubscribe a specific callback from an event
   */
  unsubscribe(event, callback) {
    if (this._listeners[event]) {
      this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    }
  },

  /**
   * Cleanup all realtime channels (call on page unload)
   */
  destroy() {
    const sb = typeof getSB === 'function' ? getSB() : null;
    if (sb) {
      Object.values(this._realtimeChannels).forEach(channel => {
        try { sb.removeChannel(channel); } catch(e) {}
      });
    }
    this._realtimeChannels = {};
    this._listeners = {};
    console.log('[MemarSync] 🔴 Destroyed all channels');
  }
};
