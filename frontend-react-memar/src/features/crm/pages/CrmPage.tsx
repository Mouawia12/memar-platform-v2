import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { usePermission } from '../../auth/hooks/usePermission';
import { useIsAdmin } from '../../auth/hooks/useIsAdmin';
import { useCrmSettings } from '../../settings/hooks/useSettings';
import { useStaffAvatars } from '../../users/hooks/useUsers';
import { useAuthStore } from '../../../store/auth';
import { useExportDisabled } from '../../../components/ExportGuard';
import type { CrmSavedView } from '../../../types/api';
import type { TaskFormData } from '../../tasks/types';
import { TaskFormModal } from '../../tasks/components/TaskFormModal';
import { DirectiveModal } from '../../tasks/components/DirectiveModal';
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
import { STATUS_ORDER, boardStatus, nextStageOf, promptOf, slaLabel, valueOf, type BoardStatus } from '../board/model';
import { useAcknowledge, useArchiveLead, useBlinkPref, useIncomingAlerts, useReplyDirective, useRequestUpdate, useSavedViews, useSoundPref } from '../board/useBoard';
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
  const exportDisabled = useExportDisabled();
  const { settings: crmSettings } = useCrmSettings();
  const showTotals = canManagePoints || !crmSettings.finance_privacy.hide_totals_from_staff;

  const [view, setView] = useState<BoardView>('kanban');
  const [soundOn, setSoundOn] = useSoundPref();
  const [blinkOn, setBlinkOn] = useBlinkPref();
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
  const [directiveFor, setDirectiveFor] = useState<Lead | null>(null);
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
  const savedViews = useSavedViews();

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

  const owners = useMemo(() => {
    const map = new Map<number, string>();
    leads.forEach((l) => { if (l.owner) map.set(l.owner.id, l.owner.name); });
    if (userId && meName && !map.has(userId)) map.set(userId, meName);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'ar'));
  }, [leads, userId, meName]);

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

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<BoardStatus, number>;
    visibleLeads.forEach((l) => { counts[boardStatus(l)] += 1; });
    return counts;
  }, [visibleLeads]);
  const pipelineValue = visibleLeads.reduce((s, l) => s + valueOf(l), 0);

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

  const applyView = (v: CrmSavedView) => {
    setFilters({
      search: v.search ?? '', status: (v.status || 'all') as BoardFilters['status'], owner: v.owner || 'all',
      priority: (v.priority || 'all') as BoardFilters['priority'], temperature: (v.temperature || 'all') as BoardFilters['temperature'], tag: v.tag || 'all',
    });
    showToast(`تم تطبيق العرض المحفوظ — ${v.name}`, 'info');
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
        soundOn={soundOn}
        onSound={() => setSoundOn(!soundOn)}
        blinkOn={blinkOn}
        onBlink={() => setBlinkOn(!blinkOn)}
        pipelineValue={pipelineValue}
        showTotals={showTotals}
        canCreate={canCreate}
        onAdd={openCreate}
        filters={eff}
        onFilters={setFilters}
        statusCounts={statusCounts}
        owners={owners}
        tags={tagLibrary}
        savedViews={savedViews.views}
        onSaveView={(name) => { savedViews.save({ name, ...eff }); showToast(`تم حفظ العرض — ${name}`); }}
        onApplyView={applyView}
        onDeleteView={savedViews.remove}
        canArchive={isManager}
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
        <ReportsModal leads={visibleLeads} stages={allStages} showTotals={showTotals} canExport={!exportDisabled} onClose={() => setReportOpen(false)} />
      )}

      {directiveFor && (
        <DirectiveModal
          card={{ kind: 'opportunity', id: directiveFor.id, code: `#${directiveFor.id}`, title: directiveFor.full_name, owner: directiveFor.owner?.name ?? null, ownerLabel: 'صاحب الفرصة' }}
          canSend={isManager}
          canReply={isManager || directiveFor.owner?.id === userId}
          onClose={() => setDirectiveFor(null)}
        />
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
          onDirective={(l) => { setDetailId(null); setDirectiveFor(l); }}
          onArchive={isManager ? (l) => { setDetailId(null); handleArchive(l); } : undefined}
          canManage={canCreate}
          canDelete={isManager}
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
