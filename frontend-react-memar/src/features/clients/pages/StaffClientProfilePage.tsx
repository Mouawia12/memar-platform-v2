import { useParams } from 'react-router-dom';

import { ClientPortalV2Page } from '../../clientPortal/pages/ClientPortalV2Page';

/**
 * بروفيل العميل للأدمن/الموظف = «تسجيل دخول إداري» يعرض بوابة العميل بنفس تصميمها تمامًا
 * (كأنك العميل)، مع شريط إداري وتقييم داخلي — الإضافة الوحيدة المتاحة للإدارة.
 * يُتاح بصلاحية clients.view (تحرسها نقطة الطاقم في الباك اند).
 */
export function StaffClientProfilePage() {
  const { id } = useParams();

  return <ClientPortalV2Page adminContactId={Number(id)} />;
}
