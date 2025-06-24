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
  category: string;
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