export interface Service {
  id: number;
  name: string;
  category: string | null;
  unit: string | null;
  price_kwd: string;
  description: string | null;
  is_active: boolean;
  created_at: string | null;
}

export interface ServiceFormData {
  name: string;
  category: string;
  unit: string;
  price_kwd: string;
  description: string;
  is_active: boolean;
}
