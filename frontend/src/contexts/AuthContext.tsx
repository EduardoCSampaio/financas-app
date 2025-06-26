"use client";
import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Account, User } from '@/types';
import { getCategories } from '../lib/api';
import { Category } from '../types';

interface AuthContextType {
  token: string | null;
  user: User | null;
  accounts: Account[];
  selectedAccount: Account | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  selectAccount: (account: Account | null) => void;
  fetchAccounts: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface CategoriesContextType {
  categories: Category[];
  refreshCategories: () => Promise<void>;
  loading: boolean;
}

const CategoriesContext = React.createContext<CategoriesContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const router = useRouter();

  const selectAccount = useCallback((account: Account | null) => {
    setSelectedAccount(account);
    if (account) {
      localStorage.setItem('selectedAccountId', String(account.id));
    } else {
      localStorage.removeItem('selectedAccountId');
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await api.get('/accounts/');
      const fetchedAccounts: Account[] = response.data;
      setAccounts(fetchedAccounts);
      
      const storedAccountId = localStorage.getItem('selectedAccountId');
      const accountToSelect = storedAccountId
        ? fetchedAccounts.find(acc => acc.id === Number(storedAccountId))
        : (fetchedAccounts.length > 0 ? fetchedAccounts[0] : null);
      
      selectAccount(accountToSelect ?? null);

    } catch (error) {
      console.error('Failed to fetch accounts', error);
      setAccounts([]);
      selectAccount(null);
    }
  }, [selectAccount]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('selectedAccountId');
    setToken(null);
    setUser(null);
    setAccounts([]);
    setSelectedAccount(null);
    router.push('/login');
  }, [router]);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await api.get('/users/me');
        setUser(response.data);
        await fetchAccounts();
      } catch (error) {
        console.error('Failed to fetch user', error);
        logout();
      }
    }
  }, [fetchAccounts, logout]);

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
    router.push('/');
    fetchAccounts();
  };

  useEffect(() => {
    const tokenInStorage = localStorage.getItem('token');
    if (tokenInStorage && !token) {
        setToken(tokenInStorage);
        fetchUser();
    }
  }, [token, fetchUser]);

  const value = { token, user, accounts, selectedAccount, login, logout, selectAccount, fetchAccounts, fetchUser };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const CategoriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(false);
  const { token } = useAuth();

  const fetchCategories = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCategories(token || undefined);
      setCategories(data);
    } catch (_) {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <CategoriesContext.Provider value={{ categories, refreshCategories: fetchCategories, loading }}>
      {children}
    </CategoriesContext.Provider>
  );
};

export function useCategories() {
  const ctx = React.useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories must be used within a CategoriesProvider');
  return ctx;
} 