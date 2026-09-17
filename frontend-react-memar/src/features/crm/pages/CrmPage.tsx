import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { usePermission } from '../../auth/hooks/usePermission';
import { useIsAdmin } from '../../auth/hooks/useIsAdmin';
import { useCrmSettings } from '../../settings/hooks/useSettings';
import { useStaffAvatars } from '../../users/hooks/useUsers';
import { useAuthStore } from '../../../store/auth';
import { useCanExport } from '../../../components/ExportGuard';
import type { TaskFormData } from '../../tasks/types';
import { TaskFormModal } from '../../tasks/components/TaskFormModal';
import { crmApi } from '../api/crmApi';
import { LeadDetailModal } from '../components/LeadDetailModal';
import { LeadFormModal } from '../components/LeadFormModal';
import { PointsSettingsModal } from '../components/PointsSettingsModal';
import { StagesManagerModal } from '../components/StagesManagerModal';
import { useHiddenStages } from '../boardPrefs';
import { celebrate, playSound } from '../opsNotify';
import { useCrmTags, useDeleteLead, useLogLeadUpdate, useMoveLead, useReorderLeads } from '../hooks/useCrm';
import { usePipelineStages } from '../hooks/usePipelineStages';
import type { Lead, Stage } from '../types';
import { BoardToolbar } from '../board/BoardToolbar';
import { EMPTY_FILTERS, type BoardFilters, type BoardView } from '../board/filters';
import { KanbanBoard } from '../board/KanbanBoard';
import { ColorLegend, KpiStrip, ReportsModal } from '../board/Reports';
import { TableView } from '../board/TableView';
import { boardStatus, nextStageOf, promptOf, slaLabel } from '../board/model';
import { readBackupFile, useAcknowledge, useArchiveLead, useBackup, useBlinkPref, useIncomingAlerts, useReplyDirective, useRequestUpdate, useRestore, useSoundPref } from '../board/useBoard';
import '../crm.css';
import '../board/board.css';

/**
 * لوحة إدارة الفرص — CRM (2026-09-16): كانبان وجدول بنفس الإجراءات، طلب تحديث
 * بمهلة وعدّاد تنازلي، ردّ الموظف من البطاقة، مؤشّرات وتقارير، عروض محفوظة،
 * أرشيف، وصوت ووميض قابلان للإيقاف. مزاياها السابقة باقية: السحب والترتيب،
 * تحويل الرابحة لمشروع، تخصيص المراحل، النقاط، وخصوصية الأرقام المالية.
 */
export function CrmPage({ hideKpis = false }: { hideKpis?: boolean }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = useAuthStore((s) => s.user?.id);
  const meName = useAuthStore((s) => s.user?.name);
  const isAdmin = useIsAdmin();

  const canCreate = usePermission('crm.view');
  const isManager = usePermission('crm.delete');
  const canLoyalty = usePermission('loyalty.view');
  const canManagePoints = usePermission('loyalty.manage');
  // التصدير والنسخة الاحتياطية للإدارة وحدها (exports.view — طلب أيمن 2026-09-17).
  const canExport = useCanExport();
  const { settings: crmSettings } = useCrmSettings();
  const showTotals = canManagePoints || !crmSettings.finance_privacy.hide_totals_from_staff;

  const [view, setView] = useState<BoardView>('kanban');
  // الصوت والوميض بلا زرّين في الشريط بعد اختصاره — يبقيان على ما حُفظ سابقًا.
  const [soundOn] = useSoundPref();
  const [blinkOn] = useBlinkPref();
  const [showArchived, setShowArchived] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  /*
   * المندوب يفتح اللوحة على فرصه هو، والإدارة على الكل (طلب أيمن 2026-09-11)،
   * والبحث القادم من سجل العملاء (?search=) يفتح على الكل دائمًا.
   */
  const initialSearch = searchParams.get('search') ?? '';
  const [filters, setFilters] = useState<BoardFilters | null>(null);
  const defaultFilters = useMemo<BoardFilters>(
    () => ({ ...EMPTY_FILTERS, search: initialSearch, owner: initialSearch || isAdmin || !userId ? 'all' : String(userId) }),
    [initialSearch, isAdmin, userId],
  );
  const eff = filters ?? defaultFilters;

  const [toasts, setToasts] = useState<{ id: number; msg: string; type: 'success' | 'danger' | 'info' }[]>([]);
  const showToast = useCallback((msg: string, type: 'success' | 'danger' | 'info' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [taskInitial, setTaskInitial] = useState<Partial<TaskFormData> | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [stagesOpen, setStagesOpen] = useState(false);
  const [pointsSettingsOpen, setPointsSettingsOpen] = useState(false);

  // الفرص كلها مرّة واحدة — الفلترة والبحث في المتصفح فورية بلا طلب لكل حرف،
  // وتُنعَش كل 30 ثانية ليصل سؤال الإدارة وردّ الموظف دون تحديث الصفحة.
  const params = { type: 'lead', per_page: 500, archived: showArchived ? undefined : 'without' } as const;
  const { data, isLoading, isError } = useQuery({
    queryKey: ['crm-leads', params],
    queryFn: () => crmApi.list(params),
    refetchInterval: 30_000,
  });
  const { data: archivedCount = 0 } = useQuery({
    queryKey: ['crm-archived-count'],
    queryFn: () => crmApi.list({ type: 'lead', per_page: 1, archived: 'only' }).then((r) => r.meta.total),
    enabled: isManager,
  });
  const { data: stagesData } = usePipelineStages();
  const hiddenStages = useHiddenStages();
  const { data: crmTags } = useCrmTags();
  const pendingTagCount = (crmTags ?? []).filter((t) => t.status === 'pending').length;

  const move = useMoveLead();
  const reorder = useReorderLeads();
  const del = useDeleteLead();
  const logUpdate = useLogLeadUpdate();
  const requestUpdate = useRequestUpdate();
  const reply = useReplyDirective();
  const archive = useArchiveLead();
  const acknowledge = useAcknowledge();
  const backup = useBackup();
  const restore = useRestore();

  const leads = useMemo(() => data?.data ?? [], [data]);
  const allStages = useMemo(() => [...(stagesData ?? [])].sort((a, b) => a.position - b.position), [stagesData]);
  const stages = useMemo(() => allStages.filter((s) => !hiddenStages[s.key]), [allStages, hiddenStages]);
  const wonKeys = useMemo(() => new Set(allStages.filter((s) => s.is_won).map((s) => s.key)), [allStages]);
  const terminalKeys = useMemo(() => new Set(allStages.filter((s) => s.is_won || s.is_lost).map((s) => s.key)), [allStages]);

  // تحديث التسميات النسبية («منذ 5 دقائق») والعدّادات دون انتظار البيانات.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const tagColors = useMemo(() => new Map((crmTags ?? []).filter((t) => t.color).map((t) => [t.name, t.color as string])), [crmTags]);
  const tagLibrary = useMemo(() => {
    const names = new Set<string>((crmTags ?? []).filter((t) => t.status === 'approved').map((t) => t.name));
    leads.forEach((l) => (l.tags ?? []).forEach((t) => names.add(t)));
    return [...names].sort((a, b) => a.localeCompare(b, 'ar'));
  }, [crmTags, leads]);


  const visibleLeads = useMemo(() => {
    const term = eff.search.trim().toLowerCase().replace(/^#/, '');
    return leads.filter((l) => {
      if (eff.status !== 'all' && boardStatus(l) !== eff.status) return false;
      if (eff.owner !== 'all' && String(l.owner?.id ?? '') !== eff.owner) return false;
      if (eff.priority !== 'all' && l.priority !== eff.priority) return false;
      if (eff.temperature !== 'all' && l.temperature !== eff.temperature) return false;
      if (eff.tag !== 'all' && !(l.tags ?? []).includes(eff.tag) && !(eff.tag === 'VIP' && l.is_vip)) return false;
      if (!term) return true;
      const hay = [l.full_name, l.phone, String(l.id), l.company, l.project_name, l.project_type, l.region, ...(l.tags ?? []), promptOf(l)?.text]
        .filter(Boolean).join(' ').toLowerCase();
      return hay.includes(term);
    });
  }, [leads, eff]);


  const ownerIds = useMemo(() => [...new Set(leads.flatMap((l) => [l.owner?.id, l.mover?.id]).filter((v): v is number => !!v))], [leads]);
  const { data: staffAvatars } = useStaffAvatars(ownerIds);

  const onAlert = useCallback((lead: Lead, kind: 'question' | 'answer' | 'nudge') => {
    const title = kind === 'answer' ? '✅ وصل ردّ جديد' : kind === 'nudge' ? '🔔 طلب تحديث عاجل' : '❓ سؤال جديد من الإدارة';
    showToast(`${title} — ${lead.full_name}`, kind === 'answer' ? 'success' : 'danger');
  }, [showToast]);
  const { flashing, clear: clearFlash } = useIncomingAlerts(data ? leads : null, userId, soundOn, onAlert);

  // ── الإجراءات ──

  const handleMove = (l: Lead, stage: Stage) => {
    if (wonKeys.has(stage) && !l.converted_project_id) {
      const name = l.project_name || l.company || l.full_name;
      if (!confirm(`تحويل الفرصة «${l.full_name}» لصفقة رابحة؟\nسيُنشأ مشروع «${name}» تلقائيًا في سجل المشاريع.`)) return;
    }
    const stageName = allStages.find((s) => s.key === stage)?.label ?? stage;
    move.mutate({ id: l.id, stage }, {
      onSuccess: () => {
        showToast(`↔️ تم نقل الفرصة إلى: ${stageName}`);
        if (wonKeys.has(stage)) {
          const ownerName = l.owner?.name ?? 'غير مُسنَدة';
          celebrate('مبروك الصفقة! 🎉', `${l.full_name} — المكلّف: ${ownerName} · نقلها: ${meName ?? 'مستخدم'}`);
          logUpdate.mutate({ id: l.id, note: `🏆 نقل الفرصة إلى «${stageName}» — المكلّف: ${ownerName}` });
        } else if (soundOn) {
          playSound(terminalKeys.has(stage) ? 'late' : 'move');
        }
      },
      onError: () => showToast('تعذّر نقل الفرصة', 'danger'),
    });
  };

  const handleAdvance = (l: Lead) => {
    const next = nextStageOf(l.stage, allStages);
    if (!next) { showToast('هذه آخر مرحلة في المسار', 'info'); return; }
    handleMove(l, next.key);
  };

  const handleRequestUpdate = (l: Lead, body: string, hours: number | null) =>
    requestUpdate.mutateAsync({ id: l.id, body, hours }).then(
      () => showToast(`${body ? 'تم إرسال طلب التحديث مع السؤال' : 'تم إرسال طلب تحديث'} — ${l.full_name} — ${hours === null ? 'بدون مهلة' : `مهلة ${slaLabel(hours)}`}`),
      (e) => { showToast('تعذّر إرسال الطلب', 'danger'); throw e; },
    );

  /** ردّ الموظف: يُغلق طلب الإدارة القائم، وإلا يُسجَّل تحديثًا على الفرصة. */
  const handleWriteEntry = (l: Lead, text: string) => {
    const pending = l.directive_state === 'awaiting' && l.directive;
    const request = pending
      ? reply.mutateAsync({ id: l.id, directiveId: l.directive!.id, body: text })
      : logUpdate.mutateAsync({ id: l.id, note: text });
    return request.then(
      () => { clearFlash(l.id); showToast(pending ? `تم إرسال الرد — ${l.full_name}` : `تم تسجيل التحديث — ${l.full_name}`); },
      (e) => { showToast('تعذّر الحفظ', 'danger'); throw e; },
    );
  };

  const handleQuickFollowUp = (l: Lead, label: string) => {
    logUpdate.mutate({ id: l.id, note: label }, {
      onSuccess: () => showToast(`تم تسجيل التحديث — ${l.full_name} — ${label}`),
      onError: () => showToast('تعذّر تسجيل التحديث', 'danger'),
    });
  };

  const handleArchive = (l: Lead) => {
    const toArchive = !l.archived_at;
    archive.mutate({ id: l.id, archived: toArchive }, {
      onSuccess: () => showToast(toArchive ? `🗂️ تمت أرشفة الفرصة — ${l.full_name}` : `تم إرجاع الفرصة من الأرشيف — ${l.full_name}`, 'info'),
      onError: () => showToast('تعذّرت العملية', 'danger'),
    });
  };

  const handleDelete = (l: Lead) => {
    const msg = `إزالة فرصة «${l.full_name}» من اللوحة؟\n\nتبقى بياناته في سجلّ العملاء`
      + `${l.company ? ' وبيانات شركته في سجلّ الشركات' : ''}، ويُحذف نهائيًا من هناك فقط.`;
    if (confirm(msg)) del.mutate(l.id, { onSuccess: () => showToast('🗂️ أُزيلت الفرصة — بياناتها محفوظة في السجلات', 'info') });
  };

  const openDetail = (l: Lead) => { clearFlash(l.id); setDetailId(l.id); };
  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (l: Lead) => { setDetailId(null); setEditing(l); setModalOpen(true); };

  const handleAddTask = (l: Lead) => {
    setDetailId(null);
    setTaskInitial({
      title: `متابعة: ${l.full_name}`,
      description: `مهمة متعلّقة بالفرصة «${l.full_name}»${l.company ? ` — ${l.company}` : ''}.`,
      assignee_id: l.owner?.id ?? '',
    });
  };

  const handleBackup = () => backup.mutate(undefined, {
    onSuccess: (b) => showToast(`💾 تم تنزيل نسخة احتياطية — ${b.count} فرصة`),
    onError: () => showToast('تعذّر إنشاء النسخة الاحتياطية', 'danger'),
  });

  /**
   * الاستعادة لا تحذف شيئًا: تُحدّث الموجود، وتُعيد المحذوف، وتُنشئ الناقص.
   * نُطلع المستخدم على عدد ما في الملف قبل التنفيذ.
   */
  const handleRestore = async (file: File) => {
    const rows = await readBackupFile(file);
    if (!rows) { showToast('الملف غير صالح — اختر ملف نسخة احتياطية صادرًا من هذه اللوحة', 'danger'); return; }
    const ok = confirm(
      `استعادة ${rows.length} فرصة من الملف؟\n\n`
      + '• الفرص الموجودة ستُحدَّث ببيانات الملف\n'
      + '• الفرص المحذوفة ستعود بمعرّفاتها وروابطها\n'
      + '• الفرص الناقصة ستُنشأ من جديد\n\n'
      + 'لن تُحذف أي فرصة على اللوحة.',
    );
    if (!ok) return;
    restore.mutate(rows, {
      onSuccess: (r) => showToast(`✅ تمت الاستعادة — حُدِّثت ${r.updated}، وأُعيدت ${r.restored}، وأُنشئت ${r.created}`),
      onError: () => showToast('تعذّرت استعادة النسخة', 'danger'),
    });
  };


  const resetFilters = () => {
    setFilters({ ...EMPTY_FILTERS });
    setShowArchived(false);
    if (searchParams.has('search')) { searchParams.delete('search'); setSearchParams(searchParams, { replace: true }); }
    showToast('تمت إعادة تعيين الفلاتر', 'info');
  };

  // الإشعار العائم يفتح الفرصة مباشرة عبر /crm?lead=<id>.
  const leadParam = searchParams.get('lead');
  useEffect(() => {
    if (!leadParam || leads.length === 0) return;
    const id = Number(leadParam);
    if (Number.isFinite(id) && leads.some((l) => l.id === id)) setDetailId(id);
    searchParams.delete('lead');
    setSearchParams(searchParams, { replace: true });
  }, [leadParam, leads, searchParams, setSearchParams]);

  const detailLead = detailId != null ? leads.find((l) => l.id === detailId) ?? null : null;

  const extraActions = (
    <>
      {canManagePoints && (
        <button type="button" className="crmx-btn sm muted" onClick={() => setPointsSettingsOpen(true)}>
          <i className="fa-solid fa-gear" /> إعدادات النقاط{pendingTagCount > 0 && <span className="num" style={{ color: '#B45309' }}> ({pendingTagCount})</span>}
        </button>
      )}
      {canLoyalty && <button type="button" className="crmx-btn sm muted" onClick={() => navigate('/loyalty')}><i className="fa-solid fa-trophy" /> نقاط الموظفين</button>}
      {isManager && <button type="button" className="crmx-btn sm muted" onClick={() => setStagesOpen(true)}><i className="fa-solid fa-sliders" /> تخصيص المراحل</button>}
    </>
  );

  const cardHandlers = {
    onOpen: openDetail,
    onAcknowledge: (l: Lead) => acknowledge(l.id),
    onRequestUpdate: handleRequestUpdate,
    onWriteEntry: handleWriteEntry,
    onQuickFollowUp: handleQuickFollowUp,
    onAdvance: handleAdvance,
    onPoints: openDetail,
  };

  return (
    <div className={`crmx crm-scope${blinkOn ? '' : ' no-blink'}`} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <BoardToolbar
        view={view}
        onView={setView}
        canCreate={canCreate}
        onAdd={openCreate}
        filters={eff}
        onFilters={setFilters}
        tags={tagLibrary}
        canArchive={isManager}
        onBackup={isManager && canExport ? handleBackup : undefined}
        onRestore={isManager ? (file) => void handleRestore(file) : undefined}
        busyBackup={backup.isPending}
        showArchived={showArchived}
        onToggleArchived={() => setShowArchived((v) => !v)}
        archivedCount={archivedCount}
        onReset={resetFilters}
        extraActions={extraActions}
      />

      {!hideKpis && isManager && (
        <KpiStrip leads={visibleLeads} stages={allStages} showTotals={showTotals} onOpenReport={() => setReportOpen(true)} />
      )}
      <ColorLegend />

      {isLoading && <p style={{ padding: 20, textAlign: 'center', color: '#64748B' }}>جارٍ تحميل الفرص…</p>}
      {isError && <p style={{ color: '#DC4A3D' }}>تعذّر تحميل الفرص.</p>}

      {data && view === 'kanban' && (
        <KanbanBoard
          leads={visibleLeads}
          stages={stages}
          isManager={isManager}
          meId={userId}
          showTotals={showTotals}
          flashing={flashing}
          tagColors={tagColors}
          onMove={handleMove}
          onReorder={(ids) => reorder.mutate(ids, { onSuccess: () => showToast('✅ تم تحديث ترتيب الفرص') })}
          {...cardHandlers}
        />
      )}
      {data && view === 'table' && (
        <TableView
          leads={visibleLeads}
          stages={allStages}
          isManager={isManager}
          meId={userId}
          showTotals={showTotals}
          flashing={flashing}
          onOpen={openDetail}
          onEdit={openEdit}
          onArchive={handleArchive}
          onAdvance={handleAdvance}
          onWriteEntry={handleWriteEntry}
          onRequestUpdate={handleRequestUpdate}
        />
      )}

      {reportOpen && (
        <ReportsModal leads={visibleLeads} stages={allStages} showTotals={showTotals} canExport={canExport} onClose={() => setReportOpen(false)} />
      )}


      {detailLead && (
        <LeadDetailModal
          lead={detailLead}
          ownerAvatarUrl={detailLead.owner ? staffAvatars?.[String(detailLead.owner.id)] ?? null : null}
          moverAvatarUrl={detailLead.mover ? staffAvatars?.[String(detailLead.mover.id)] ?? null : null}
          stages={allStages}
          onClose={() => setDetailId(null)}
          onEdit={openEdit}
          onDelete={handleDelete}
          onMove={handleMove}
          onAddTask={handleAddTask}
          onWriteEntry={handleWriteEntry}
          onArchive={isManager ? (l) => { setDetailId(null); handleArchive(l); } : undefined}
          canManage={canCreate}
          canDelete={isManager}
          isManager={isManager}
          meId={userId}
        />
      )}
      {modalOpen && <LeadFormModal lead={editing} onClose={() => setModalOpen(false)} />}
      {stagesOpen && <StagesManagerModal stages={allStages} onClose={() => setStagesOpen(false)} />}
      {pointsSettingsOpen && <PointsSettingsModal onClose={() => setPointsSettingsOpen(false)} />}
      {taskInitial && <TaskFormModal task={null} initial={taskInitial} onClose={() => setTaskInitial(null)} />}

      {toasts.length > 0 && (
        <div className="crm-toast-wrap">
          {toasts.map((t) => <div key={t.id} className={`crm-toast ${t.type}`}>{t.msg}</div>)}
        </div>
      )}
    </div>
  );
}
