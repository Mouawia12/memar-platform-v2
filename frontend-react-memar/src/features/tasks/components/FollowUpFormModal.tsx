import { type CSSProperties, type FormEvent, useMemo, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useLeads } from '../../crm/hooks/useCrm';
import { useProjects } from '../../projects/hooks/useProjects';
import { useAssignableUsers } from '../../users/hooks/useUsers';
import { useCreateFollowUp } from '../hooks/useFollowUps';
import { RepeatPicker, repeatLabel } from './RepeatPicker';

interface Props {
  onClose: () => void;
}

type FieldErrors = Partial<Record<'title' | 'contact' | 'assignee' | 'when', string>>;

const pad = (n: number) => `${n}`.padStart(2, '0');

/** التاريخ والوقت محلّيًّا (لا UTC كي لا يزحف اليوم عند الحدّين). */
const dateOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeOf = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** الافتراضي: الساعة القادمة تمامًا. */
function defaultWhen(): { date: string; time: string } {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);

  return { date: dateOf(d), time: timeOf(d) };
}

/**
 * متابعة جديدة من لوحة المتابعة — بنيتها كنافذة «مهمة جديدة» (طلب أيمن
 * 2026-08-29): حقول مرقّمة بنجمة للمطلوب، صفّان متجاوران، تلميح وجهة أسفلها،
 * وأزرار «حفظ / إلغاء» بنفس الترتيب. المتابعة تذكيرٌ على عميل، فاختياره شرطها.
 */
export function FollowUpFormModal({ onClose }: Props) {
  const create = useCreateFollowUp();
  const { data: leads, isLoading } = useLeads({ per_page: 100 });
  const { data: projectsData } = useProjects({ per_page: 100 });
  const { data: usersData } = useAssignableUsers();

  const [contactId, setContactId] = useState<number | ''>('');
  const [projectId, setProjectId] = useState<number | ''>('');
  const [assigneeId, setAssigneeId] = useState<number | ''>('');
  const [when, setWhen] = useState(defaultWhen());
  const today = dateOf(new Date());
  const [note, setNote] = useState('');
  const [repeat, setRepeat] = useState('');
  const [desc, setDesc] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  // القائمة كاملة بلا حقل بحث (طلب أيمن 2026-08-30) — القائمة المنسدلة نفسها
  // تقفز للاسم بالكتابة عليها، والعملاء هنا عشرات لا آلاف.
  const options = leads?.data ?? [];
  const chosen = useMemo(() => options.find((c) => c.id === contactId), [options, contactId]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: FieldErrors = {};
    if (!note.trim()) errs.title = 'عنوان المتابعة مطلوب.';
    else if (note.trim().length < 3) errs.title = 'العنوان قصير جدًا (٣ أحرف على الأقل).';
    if (!assigneeId) errs.assignee = 'اختر المكلَّف — إليه تُسند المتابعة وتظهر في «متابعاتي».';
    if (contactId === '') errs.contact = 'اختر العميل — المتابعة تكون على عميل.';
    if (!when.date) errs.when = 'حدّد تاريخ المتابعة.';
    else if (!when.time) errs.when = 'حدّد وقت المتابعة.';
    else if (`${when.date}T${when.time}` < `${today}T${timeOf(new Date())}`) errs.when = 'لا يمكن أن يكون موعد المتابعة في الماضي.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    create.mutate(
      {
        contactId: contactId as number,
        remind_at: `${when.date} ${when.time}`,
        note: note.trim(),
        description: desc.trim() || undefined,
        repeat_every: repeat || undefined,
        project_id: projectId === '' ? undefined : projectId,
        assignee_id: assigneeId === '' ? undefined : assigneeId,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2 style={{ marginTop: 0 }}>متابعة جديدة</h2>

        {/* العنوان بعرض كامل ومطلوب — نظير «العنوان *» في نافذة المهمة
            (طلب أيمن 2026-08-30، حلّ محلّ حقل البحث). هو نفسه سبب المتابعة:
            عمود النصّ الوحيد في التذكير، فلا يُكرَّر حقلًا ثانيًا في الأسفل. */}
        <label style={label}>العنوان *
          <input
            className="input"
            style={{ ...input, ...(errors.title ? inputErr : null) }}
            maxLength={255}
            placeholder="مثال: متابعة عرض السعر المرسل"
            value={note}
            onChange={(e) => { setNote(e.target.value); setErrors((x) => ({ ...x, title: undefined })); }}
          />
        </label>
        {errors.title && <span style={errText}>{errors.title}</span>}

        {/* صفّ «المشروع ⟷ المكلَّف» طبق نافذة المهمة (طلب أيمن 2026-08-30) —
            وهما عمودان حقيقيّان على المتابعة لا حقلان للشكل. */}
        <div style={grid}>
          <label style={label}>المشروع
            <select className="input" style={input} value={projectId} onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">— بدون —</option>
              {projectsData?.data.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label style={label}>المكلَّف *
            <select
              className="input"
              style={{ ...input, ...(errors.assignee ? inputErr : null) }}
              value={assigneeId}
              onChange={(e) => { setAssigneeId(e.target.value ? Number(e.target.value) : ''); setErrors((x) => ({ ...x, assignee: undefined })); }}
            >
              <option value="">— اختر الموظف —</option>
              {usersData?.data.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            {errors.assignee && <span style={errText}>{errors.assignee}</span>}
          </label>
        </div>

        {/* صفّ «العميل ⟷ التكرار» — خاصّ بالمتابعة، بنفس شكل الصفّ أعلاه. */}
        <div style={grid}>
          {/* بلا نجمة (طلب أيمن 2026-08-30) — والمتابعة تبقى معلَّقة على عميل
              فيمنع الحفظُ بلا اختياره، لكن دون تمييز الحقل بالنجمة. */}
          <label style={label}>العميل
            <select
              className="input"
              style={{ ...input, ...(errors.contact ? inputErr : null) }}
              value={contactId}
              onChange={(e) => { setContactId(e.target.value ? Number(e.target.value) : ''); setErrors((x) => ({ ...x, contact: undefined })); }}
            >
              <option value="">— اختر العميل —</option>
              {isLoading && <option value="" disabled>جارٍ التحميل…</option>}
              {!isLoading && options.length === 0 && <option value="" disabled>لا نتائج مطابقة</option>}
              {options.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}{c.company ? ` — ${c.company}` : ''}</option>
              ))}
            </select>
            {errors.contact && <span style={errText}>{errors.contact}</span>}
          </label>
          <label style={label}>التكرار
            <RepeatPicker value={repeat} onChange={setRepeat} />
          </label>
        </div>

        {/* صفّ من حقلين متجاورين كصفوف نافذة المهمة (طلب أيمن 2026-08-30)،
            والتاريخ منفصل عن الوقت كنموذج الفرصة. */}
        <div style={grid}>
          <label style={label}>تاريخ المتابعة *
            <input
              className="input"
              style={{ ...input, ...(errors.when ? inputErr : null) }}
              type="date"
              min={today}
              value={when.date}
              onChange={(e) => { setWhen((w) => ({ ...w, date: e.target.value })); setErrors((x) => ({ ...x, when: undefined })); }}
            />
          </label>
          <label style={label}>وقت المتابعة *
            <input
              className="input"
              style={{ ...input, ...(errors.when ? inputErr : null) }}
              type="time"
              value={when.time}
              onChange={(e) => { setWhen((w) => ({ ...w, time: e.target.value })); setErrors((x) => ({ ...x, when: undefined })); }}
            />
          </label>
        </div>
        {errors.when && <span style={errText}>{errors.when}</span>}


        {/* الوصف بعرض كامل نظير «الوصف» في نافذة المهمة (طلب أيمن 2026-08-30). */}
        <label style={label}>وصف المتابعة
          <textarea
            className="input"
            style={{ ...input, minHeight: '60px' }}
            placeholder="تفاصيل ما يجب متابعته — ما دار في آخر اتصال، وما المطلوب هذه المرّة"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </label>

        {/* تلميح وجهة المتابعة — نظير تلميح نافذة المهمة */}
        <div style={hint}>
          🔄 بعد الحفظ تظهر المتابعة في <b>«المهام والمتابعة»</b> ضمن عمود موعدها
          ({when.date === today ? 'اليوم' : 'مجدولة'})
          {chosen ? <> على العميل <b>{chosen.full_name}</b></> : null}
          {assigneeId ? <>، ويصل <b>{usersData?.data.find((u) => u.id === assigneeId)?.name}</b> إشعارها</> : null}
          {repeat ? <>، وتتكرّر <b>{repeatLabel(repeat)}</b> — كلّما أُنجزت جُدولت تلقائيًا لدورتها التالية</> : null}.
        </div>

        {create.isError && <p style={{ color: '#ef4444', marginTop: '8px' }}>{apiErrorMessage(create.error, 'تعذّر الحفظ')}</p>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button className="btn btn-primary" type="submit" disabled={create.isPending}>{create.isPending ? 'جارٍ الحفظ…' : 'حفظ'}</button>
          <button className="btn" type="button" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 11000, padding: '20px' };
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto' };
const grid: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' };
const label: CSSProperties = { display: 'block', marginTop: '10px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
const inputErr: CSSProperties = { borderColor: '#DC4A3D', outline: 'none' };
const errText: CSSProperties = { display: 'block', color: '#DC4A3D', fontSize: '12px', marginTop: '3px' };
const hint: CSSProperties = { marginTop: '14px', fontSize: '12.5px', color: '#5A6478', background: '#eaeff6', borderRadius: '8px', padding: '9px 12px', lineHeight: 1.7 };
