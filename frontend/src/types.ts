export interface Category {
  id: number;
  name: string;
}

export interface Account {
  id: number;
  name: string;
  initial_balance: number;
  owner_id: number;
}

export interface Transaction {
  id: number;
  description: string;
  value: number;
  type: 'income' | 'expense';
  category_id?: number | null;
  category?: Category | null;
  date: string;
  paid: boolean;
  account_id: number;
  proof_url?: string | null;
}

export interface User {
  email: string;
  id: number;
  is_active: boolean;
} 