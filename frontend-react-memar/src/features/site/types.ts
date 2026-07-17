export type SiteSettings = Record<string, string>;

export interface SettingField {
  key: string;
  label: string;
  type?: 'text' | 'textarea';
  placeholder?: string;
  dir?: 'rtl' | 'ltr';
}

export interface SettingGroup {
  title: string;
  fields: SettingField[];
}

export const SETTING_GROUPS: SettingGroup[] = [
  {
    title: '🏛️ هوية الموقع',
    fields: [
      { key: 'site_name', label: 'اسم الموقع' },
      { key: 'tagline', label: 'الشعار التسويقي' },
      { key: 'about', label: 'نبذة عن المكتب', type: 'textarea' },
    ],
  },
  {
    title: '📞 معلومات التواصل',
    fields: [
      { key: 'phone', label: 'الهاتف', dir: 'ltr' },
      { key: 'whatsapp', label: 'واتساب (رقم دولي بدون +)', dir: 'ltr', placeholder: '96599887766' },
      { key: 'email', label: 'البريد الإلكتروني', dir: 'ltr' },
      { key: 'address', label: 'العنوان' },
      { key: 'working_hours', label: 'ساعات العمل' },
    ],
  },
  {
    title: '🌐 وسائل التواصل الاجتماعي',
    fields: [
      { key: 'facebook', label: 'فيسبوك', dir: 'ltr', placeholder: 'https://…' },
      { key: 'instagram', label: 'إنستغرام', dir: 'ltr', placeholder: 'https://…' },
      { key: 'twitter', label: 'إكس (تويتر)', dir: 'ltr', placeholder: 'https://…' },
    ],
  },
];
