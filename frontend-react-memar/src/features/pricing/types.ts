/** خيارات الحاسبة الهندسية — تأتي من الخادم لا تُكتب في الواجهة. */
export interface PricingOptions {
  building_types: string[];
  design_levels: { key: string; label: string; factor: number }[];
  services: { id: number; name: string; category: string | null; unit: string | null; price_kwd: number }[];
}

export interface CalcLine {
  service_id: number;
  name: string;
  unit: string | null;
  qty: number;
  unit_price_kwd: number;
  total_kwd: number;
}

export interface CalcResult {
  lines: CalcLine[];
  total_kwd: number;
  team_size: number;
  duration_days: number;
  factors: { building_type: number; floors: number; design_level: number; design_level_label: string };
  suggestions: { service_id: number; name: string; price_kwd: number; unit: string | null }[];
}

export interface StaffRow { role: string; hours: string; rate_kwd: string }
export interface CostRow { label: string; amount_kwd: string }

export interface CostResult {
  staff: { role: string; hours: number; rate_kwd: number; total_kwd: number }[];
  other_costs: { label: string; amount_kwd: number }[];
  cost_kwd: number;
  margin_percent: number;
  margin_kwd: number;
  final_price_kwd: number;
  benchmark_kwd: number | null;
  benchmark_label: string | null;
  diff_percent: number | null;
}

export interface ServicePackage {
  id: number;
  name: string;
  icon: string | null;
  description: string | null;
  price_kwd: number;
  reference_area_sqm: number;
  is_featured: boolean;
  items_total_kwd: number;
  savings_kwd: number;
  services: { id: number; name: string; price_kwd: number; unit: string | null }[];
}

export interface AiEstimate {
  similar_projects: { id: number; name: string; type: string | null; budget_kwd: number }[];
  average_kwd: number | null;
  suggested_price_kwd: number | null;
  note: string;
  has_ai: boolean;
}

export const money = (v: number) => `${v.toLocaleString('ar', { maximumFractionDigits: 0 })} د.ك`;
