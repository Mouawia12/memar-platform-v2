import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useProjects } from '../../projects/hooks/useProjects';
import { useAssignableUsers } from '../../users/hooks/useUsers';
import { useAddComment, useSaveTask } from '../hooks/useTasks';
import { PRIORITY_LABELS, STATUS_LABELS, type Task, type TaskFormData, type TaskPriority, type TaskStatus } from '../types';

interface Props {
  task: Task | null;
  /** قيم ابتدائية عند الإنشاء (مثال: مهمة مُسندة من صفقة CRM). */
  initial?: Partial<TaskFormData>;
  onClose: () => void;
}

const empty: TaskFormData = {
  title: '', description: '', project_id: '', assignee_id: '',
  status: 'todo', priority: 'medium', due_date: '',
};

type FieldErrors = Partial<Record<'title' | 'assignee_id' | 'due_date', string>>;

/** اليوم بصيغة YYYY-MM-DD (لمنع تاريخ استحقاق ماضٍ). */
const todayStr = () => new Date().toISOString().slice(0, 10);

export function TaskFormModal({ task, initial, onClose }: Props) {
  const save = useSaveTask();
  // تعليق «مَن عدّل ولماذا» يُنشر باسم المُعدِّل بعد الحفظ (طلب أيمن) — يُستخدم عند التعديل فقط.
  const addNote = useAddComment(task?.id ?? 0);
  const { data: projectsData } = useProjects({ per_page: 100 });
  const { data: usersData } = useAssignableUsers();
  const [form, setForm] = useState<TaskFormData>({ ...empty, ...initial });
  const [editNote, setEditNote] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description ?? '',
        project_id: task.project?.id ?? '',
        assignee_id: task.assignee?.id ?? '',
        status: task.status,
        priority: task.priority,
        due_date: task.due_date ?? '',
      });
    } else {
      setForm({ ...empty, ...initial });
    }
    setEditNote('');
    setErrors({});
  }, [task, initial]);

  const set = <K extends keyof TaskFormData>(key: K, value: TaskFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  /** فاليديشن العميل قبل الإرسال. */
  const validate = (): boolean => {
    const e: FieldErrors = {};
    if (!form.title.trim()) e.title = 'عنوان المهمة مطلوب.';
    else if (form.title.trim().length < 3) e.title = 'العنوان قصير جدًا (٣ أحرف على الأقل).';
    if (!form.assignee_id) e.assignee_id = 'اختر المكلَّف — إليه تُسند المهمة ويصله الإشعار.';
    // تاريخ ماضٍ يُقبل عند التعديل (تصحيح)، لكن يُمنع عند الإنشاء
    if (!task && form.due_date && form.due_date < todayStr()) e.due_date = 'لا يمكن أن يكون تاريخ الاستحقاق في الماضي.';
    setErrors(e);

    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const note = editNote.trim();
    save.mutate({ id: task?.id, data: { ...form, title: form.title.trim() } }, {
      onSuccess: () => {
        // عند التعديل مع رسالة: تُنشر تعليقًا باسم المُعدِّل ثم نُغلق (الإغلاق يتم على أي حال)
        if (task && note) addNote.mutate(note, { onSettled: onClose });
        else onClose();
      },
    });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{task ? 'تعديل مهمة' : 'مهمة جديدة'}</h2>

        <label style={label}>العنوان *
          <input className="input" style={{ ...input, ...(errors.title ? inputErr : null) }} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="مثال: متابعة مخطط العميل" />
        </label>
        {errors.title && <span style={errText}>{errors.title}</span>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={label}>المشروع
            <select className="input" style={input} value={form.project_id} onChange={(e) => set('project_id', e.target.value ? Number(e.target.value) : '')}>
              <option value="">— بدون —</option>
              {projectsData?.data.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label style={label}>المكلَّف *
            <select className="input" style={{ ...input, ...(errors.assignee_id ? inputErr : null) }} value={form.assignee_id} onChange={(e) => set('assignee_id', e.target.value ? Number(e.target.value) : '')}>
              <option value="">— اختر الموظف —</option>
              {usersData?.data.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            {errors.assignee_id && <span style={errText}>{errors.assignee_id}</span>}
          </label>
          <label style={label}>الحالة
            <select className="input" style={input} value={form.status} onChange={(e) => set('status', e.target.value as TaskStatus)}>
              {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </label>
          <label style={label}>الأولوية
            <select className="input" style={input} value={form.priority} onChange={(e) => set('priority', e.target.value as TaskPriority)}>
              {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
            </select>
          </label>
        </div>

        <label style={label}>تاريخ الاستحقاق
          <input className="input" style={{ ...input, ...(errors.due_date ? inputErr : null) }} type="date" min={task ? undefined : todayStr()} value={form.due_date} onChange={(e) => set('due_date', e.target.value)} />
        </label>
        {errors.due_date && <span style={errText}>{errors.due_date}</span>}
        <label style={label}>الوصف
          <textarea className="input" style={{ ...input, minHeight: '60px' }} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </label>

        {/* رسالة التعديل (عند التعديل فقط): تُنشر باسم المُعدِّل ليعرف الجميع مَن غيّر ولماذا */}
        {task && (
          <label style={label}>✍️ رسالة التعديل (اختياري)
            <textarea
              className="input"
              style={{ ...input, minHeight: '48px' }}
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="مثال: عدّلت الأولوية لعاجل بعد اتصال العميل — بتوقيعك تظهر في التعليقات"
            />
          </label>
        )}

        {/* تلميح وجهة المهمة */}
        <div style={hint}>
          📋 بعد الحفظ تظهر المهمة في <b>«المهام والمتابعة»</b> ضمن عمود موعدها ({form.due_date ? 'حسب تاريخ الاستحقاق' : 'قادمة — بلا موعد'})،
          ويصل <b>المكلَّف</b> إشعار «مهام مسندة إليك».
        </div>

        {save.isError && <p style={{ color: '#ef4444', marginTop: '8px' }}>{apiErrorMessage(save.error, 'تعذّر الحفظ')}</p>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button className="btn btn-primary" type="submit" disabled={save.isPending}>{save.isPending ? 'جارٍ الحفظ…' : 'حفظ'}</button>
          <button className="btn" type="button" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 50, padding: '20px' };
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto' };
const label: CSSProperties = { display: 'block', marginTop: '10px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
const inputErr: CSSProperties = { borderColor: '#DC4A3D', outline: 'none' };
const errText: CSSProperties = { display: 'block', color: '#DC4A3D', fontSize: '12px', marginTop: '3px' };
const hint: CSSProperties = { marginTop: '14px', fontSize: '12.5px', color: '#5A6478', background: '#eaeff6', borderRadius: '8px', padding: '9px 12px', lineHeight: 1.7 };
