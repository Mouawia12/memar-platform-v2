import type { Communication } from '../types';
import { groupByDay } from '../utils';
import { CommunicationCard } from './CommunicationCard';

interface Props {
  rows: Communication[];
  canManage: boolean;
  onOpen: (c: Communication) => void;
  onEdit: (c: Communication) => void;
  onDelete: (c: Communication) => void;
  onFollowUpDone: (c: Communication) => void;
}

export function CommunicationTimeline({ rows, ...handlers }: Props) {
  return (
    <>
      {groupByDay(rows).map((group) => (
        <section key={group.label} className="comms-day">
          <h3 className="comms-day-label" style={{ margin: 0 }}>{group.label}</h3>
          <ul className="comms-list">
            {group.items.map((c) => (
              <CommunicationCard key={c.id} item={c} canManage={handlers.canManage}
                onOpen={() => handlers.onOpen(c)} onEdit={() => handlers.onEdit(c)}
                onDelete={() => handlers.onDelete(c)} onFollowUpDone={() => handlers.onFollowUpDone(c)} />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

export function TimelineSkeleton() {
  return (
    <div aria-busy="true" aria-label="جارٍ التحميل">
      <div className="comms-skel" style={{ width: 90, height: 14, margin: '18px 2px 10px' }} />
      <div className="comms-list">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="comms-card" style={{ cursor: 'default' }}>
            <div className="comms-skel" style={{ width: 44, height: 44, borderRadius: '50%' }} />
            <div>
              <div className="comms-skel" style={{ width: '40%', height: 14 }} />
              <div className="comms-skel" style={{ width: '70%', height: 12, marginTop: 8 }} />
              <div className="comms-skel" style={{ width: '25%', height: 10, marginTop: 8 }} />
            </div>
            <div />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimelineEmpty({ filtered, canManage, onCreate, onClear }: { filtered: boolean; canManage: boolean; onCreate: () => void; onClear: () => void }) {
  return (
    <div className="comms-empty">
      <div className="comms-empty-icon"><i className={filtered ? 'fa-solid fa-magnifying-glass' : 'fa-regular fa-comments'} /></div>
      {filtered ? (
        <>
          <h3>لا نتائج مطابقة</h3>
          <p>جرّب كلمة بحث أخرى أو أزل بعض الفلاتر.</p>
          <button type="button" className="btn" onClick={onClear}>مسح الفلاتر</button>
        </>
      ) : (
        <>
          <h3>لا يوجد تواصل مسجّل بعد</h3>
          <p>سجّل كل اتصال أو رسالة أو اجتماع مع عملائك ليبقى الفريق كله على اطّلاع.</p>
          {canManage && <button type="button" className="btn btn-primary" onClick={onCreate}>+ سجّل أول تواصل</button>}
        </>
      )}
    </div>
  );
}
