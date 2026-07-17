export interface Expense {
  id: number;
  title: string;
  category: string | null;
  amount_kwd: string;
  spent_at: string | null;
  vendor: string | null;
  notes: string | null;
  recorder: { id: number; name: string } | null;
  created_at: string | null;
}

export interface ExpenseFormData {
  title: string;
  category: string;
  amount_kwd: string;
  spent_at: string;
  vendor: string;
  notes: string;
}

export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
}

export interface FinanceOverview {
  income: number;
  expenses: number;
  payroll_paid: number;
  net_profit: number;
  expenses_by_category: CategoryTotal[];
}
