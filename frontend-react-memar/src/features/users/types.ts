export interface User {
  contact_id?: number | null;
  contact_name?: string | null;
  id: number;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  last_login_at: string | null;
  roles: string[];
  permissions: string[];
  created_at: string | null;
}

export interface Role {
  name: string;
  label: string;
}

export interface UserContactLink {
  contact_id?: number | null;
  contact_name?: string | null;
}

export interface UserFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  is_active: boolean;
  roles: string[];
  /** ربط الحساب بسجل عميل — يُفعّل بوابة العميل. */
  contact_id: number | '';
}
