import { useState } from 'react';

import { isSoundEnabled, toggleSound } from '../opsNotify';

/** مفتاح تشغيل/إيقاف التنبيهات الصوتية — طبق أصل V42 mountSoundToggle. */
export function SoundToggle() {
  const [on, setOn] = useState(isSoundEnabled());
  return (
    <button
      type="button"
      className="crm-btn crm-btn-outline"
      title={on ? 'إيقاف أصوات التنبيهات' : 'تفعيل أصوات التنبيهات'}
      onClick={() => setOn(toggleSound())}
      style={on ? undefined : { color: '#94A3B8', borderColor: '#CBD5E1' }}
    >
      {on ? '🔊 الصوت مفعّل' : '🔇 الصوت موقوف'}
    </button>
  );
}
