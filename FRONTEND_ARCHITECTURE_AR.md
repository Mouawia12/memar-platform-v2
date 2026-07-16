# معمارية الواجهة — Memar (React + Vite + TS)

> **الهدف:** واجهة احترافية منظّمة — **كل وحدة في مجلد مستقل**، لا "كل شيء في صفحة واحدة".
> **الموقع:** `frontend-react-memar/` · React 19 + Vite + TypeScript.

## المكدّس
React Router · **TanStack Query** (جلب/كاش) · **Axios** (توكن Sanctum + فكّ الظرف) · **Zustand** (حالة) · CSS الموروث (تصميم مطابق).

## بنية المجلدات
```
src/
├── lib/          api.ts (عميل موحّد) · queryClient.ts
├── store/        auth.ts (Zustand)
├── config/       nav.ts (القائمة الجانبية)
├── layouts/      DashboardLayout
├── components/   مكوّنات مشتركة (Sidebar, Topbar, PlaceholderPage) + ui/
├── types/        أنواع عامة (الظرف الموحّد)
└── features/<module>/          ← كل وحدة هنا
    ├── api/       <module>Api.ts     استدعاءات الـAPI
    ├── hooks/     use<Module>.ts     خطافات React Query
    ├── components/ <pieces>.tsx      مكوّنات فرعية للوحدة
    ├── pages/     <Module>Page.tsx   صفحة المسار
    └── types.ts                       أنواع الوحدة
```

## قاعدة الوحدة (لكل صفحة جديدة)
1. **api/** — دوال الاستدعاء عبر `apiGet/apiPost…` (تعيد data مباشرة).
2. **hooks/** — `useQuery`/`useMutation` (لا استدعاء مباشر داخل المكوّن).
3. **components/** — تقسيم الواجهة لمكوّنات صغيرة (جدول، نموذج، بطاقة…).
4. **pages/** — الصفحة تجمع المكوّنات فقط (رفيعة).
5. **types.ts** — أنواع الوحدة.

> الصفحة لا تحتوي منطق شبكة مباشر ولا منطق أعمال ضخم — تنسّق فقط. المنطق في hooks/api.

## مثال منجز: وحدة المصادقة (auth) ✅
```
features/auth/
├── api/authApi.ts       login · me · logout
├── hooks/useAuth.ts     useLogin · useLogout
└── pages/LoginPage.tsx  صفحة الدخول (رفيعة)
```
مُختبَرة: دخول حقيقي بتوكن Sanctum → لوحة التحكم، وخروج يلغي التوكن.

## التشغيل
```bash
# الباك اند
cd backend-memar && php artisan serve --port=8010
# الواجهة
cd frontend-react-memar && npm run dev   # http://localhost:3015
```
حساب أدمن تجريبي: `admin@memar.local` / `password`.
