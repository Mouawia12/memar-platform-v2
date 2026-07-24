import type { CSSProperties } from 'react';

const WIDTHS = ['0%', '30%', '55%', '75%', '100%'];
const COLORS = ['transparent', '#DC4A3D', '#E8A838', '#2D9B6F', '#1B6CA8'];
const LABELS = ['', 'ضعيفة', 'متوسطة', 'جيدة', 'قوية'];

/** درجة القوة 0..4 — نفس معايير الأصل (طول، حرف كبير، رقم، رمز). */
export function passwordScore(value: string): number {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return score;
}

/** مقياس قوة كلمة المرور — شريط ملوّن كما في صفحة الدخول الأصلية. */
export function PasswordStrength({ value }: { value: string }) {
  const score = passwordScore(value);

  return (
    <>
      <div style={track}>
        <div style={{ ...bar, width: WIDTHS[score], background: COLORS[score] }} />
      </div>
      {value !== '' && (
        <div style={{ fontSize: '11px', color: COLORS[score], marginTop: '3px' }}>{LABELS[score]}</div>
      )}
    </>
  );
}

const track: CSSProperties = { height: '4px', borderRadius: '2px', background: '#E4E8EF', marginTop: '5px', overflow: 'hidden' };
const bar: CSSProperties = { height: '100%', borderRadius: '2px', transition: 'all .3s' };
