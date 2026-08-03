import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../../lib/api';

interface PublicForumAnswer {
  author: string;
  body: string;
  at: string | null;
}

interface PublicForumThread {
  id: number;
  title: string;
  body: string | null;
  asker: string;
  answered: boolean;
  at: string | null;
  answers: PublicForumAnswer[];
}

/**
 * منتدى المجتمع على صفحة اللاندنج (اجتماع 2026-08-03، بند 9).
 * يعرض للزوّار (بلا تسجيل دخول) الأسئلة/الأجوبة التي اعتمدها الطاقم فقط.
 * يختفي القسم بالكامل إن لم يُعتمد أي سؤال بعد — فلا مساحة فارغة.
 */
export function PublicForumSection() {
  const { data } = useQuery({
    queryKey: ['public-forum'],
    queryFn: () => apiGet<PublicForumThread[]>('/public/forum'),
    staleTime: 5 * 60 * 1000,
  });

  if (!data || data.length === 0) return null;

  return (
    <section id="community" className="forum-public-section">
      <div className="section-inner">
        <div className="section-header">
          <div className="section-tag">مجتمع معمار</div>
          <h2 className="section-title">أسئلة شائعة من عملائنا وإجابات فريقنا</h2>
          <p className="section-sub">نجيب على أكثر ما يهمّ عملاءنا — تصفّح قبل أن تسأل، أو انضم إلينا واطرح سؤالك.</p>
        </div>

        <div className="forum-public-grid">
          {data.map((t) => (
            <article key={t.id} className="forum-public-card">
              <div className="forum-public-q">
                <span className="forum-public-badge">سؤال</span>
                <h3>{t.title}</h3>
                {t.body && <p className="forum-public-body">{t.body}</p>}
                <span className="forum-public-asker">— {t.asker}</span>
              </div>

              {t.answers.map((a, i) => (
                <div key={i} className="forum-public-a">
                  <div className="forum-public-a-head">
                    <span className="forum-public-staff"><i className="fas fa-circle-check" /> {a.author}</span>
                    <span className="forum-public-team">فريق معمار</span>
                  </div>
                  <p>{a.body}</p>
                </div>
              ))}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
