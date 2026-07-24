import { type CSSProperties, useEffect, useRef } from 'react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  /** يُعيد ضبط المحتوى عند تغيّره (عند فتح مستند مختلف). */
  resetKey?: string | number;
  minHeight?: string;
}

interface ToolItem {
  cmd: string;
  arg?: string;
  label: string;
  title: string;
  style?: CSSProperties;
}

const TOOLS: (ToolItem | 'sep')[] = [
  { cmd: 'bold', label: 'ع', title: 'عريض', style: { fontWeight: 800 } },
  { cmd: 'italic', label: 'م', title: 'مائل', style: { fontStyle: 'italic' } },
  { cmd: 'underline', label: 'ت', title: 'تسطير', style: { textDecoration: 'underline' } },
  'sep',
  { cmd: 'formatBlock', arg: 'h1', label: 'ع1', title: 'عنوان كبير' },
  { cmd: 'formatBlock', arg: 'h2', label: 'ع2', title: 'عنوان متوسط' },
  { cmd: 'formatBlock', arg: 'p', label: '¶', title: 'فقرة' },
  'sep',
  { cmd: 'insertUnorderedList', label: '•', title: 'قائمة نقطية' },
  { cmd: 'insertOrderedList', label: '1.', title: 'قائمة مرقّمة' },
  'sep',
  { cmd: 'justifyRight', label: '⇥', title: 'محاذاة يمين' },
  { cmd: 'justifyCenter', label: '≡', title: 'توسيط' },
  { cmd: 'justifyLeft', label: '⇤', title: 'محاذاة يسار' },
  'sep',
  { cmd: 'removeFormat', label: '⌫', title: 'إزالة التنسيق' },
];

/** محرر نصوص غني (contentEditable) — بلا اعتماديات خارجية، يدعم RTL. */
export function RichTextEditor({ value, onChange, resetKey, minHeight = '260px' }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // ضبط المحتوى عند الفتح/التبديل فقط — حتى لا يقفز المؤشر أثناء الكتابة
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const exec = (tool: ToolItem) => {
    ref.current?.focus();
    document.execCommand(tool.cmd, false, tool.arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const insertLink = () => {
    const url = prompt('أدخل الرابط:');
    if (!url) return;
    ref.current?.focus();
    document.execCommand('createLink', false, url);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div style={wrap}>
      <div style={toolbar}>
        {TOOLS.map((t, i) => (t === 'sep'
          ? <span key={`sep-${i}`} style={sep} />
          : (
            <button key={t.title} type="button" title={t.title} onClick={() => exec(t)} style={{ ...toolBtn, ...t.style }}>
              {t.label}
            </button>
          )))}
        <button type="button" title="إدراج رابط" onClick={insertLink} style={toolBtn}>🔗</button>
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        dir="rtl"
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        style={{ ...editor, minHeight }}
      />
    </div>
  );
}

const wrap: CSSProperties = { border: '1.5px solid #E4E8EF', borderRadius: '10px', overflow: 'hidden', background: '#fff' };
const toolbar: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '2px', padding: '6px 8px', borderBottom: '1px solid #E4E8EF', background: '#F7F9FC', alignItems: 'center' };
const toolBtn: CSSProperties = { minWidth: '30px', height: '28px', border: '1px solid transparent', background: 'transparent', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#1A1F2E', fontFamily: 'inherit', padding: '0 6px' };
const sep: CSSProperties = { width: '1px', height: '18px', background: '#E4E8EF', margin: '0 4px' };
const editor: CSSProperties = { padding: '14px 16px', outline: 'none', lineHeight: 1.9, fontSize: '14px', color: '#1A1F2E', overflowY: 'auto', maxHeight: '46vh' };
