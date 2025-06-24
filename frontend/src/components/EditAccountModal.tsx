"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Account } from '@/types';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
}

export default function EditAccountModal({ isOpen, onClose, account }: EditAccountModalProps) {
  const { fetchAccounts } = useAuth();
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('0');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setInitialBalance(String(account.initial_balance));
    }
  }, [account]);

  if (!isOpen || !account) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    try {
      await api.put(`/accounts/${account.id}`, {
        name,
        initial_balance: parseFloat(initialBalance) || 0,
      });
      toast.success('Conta atualizada com sucesso!');
      await fetchAccounts();
      onClose();
    } catch (err: unknown) {
      let errorMessage = 'Falha ao atualizar a conta.';
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'detail' in err.response.data) {
        errorMessage = (err.response as { data?: { detail?: string } }).data?.detail || errorMessage;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl">&times;</button>
        <h2 className="text-2xl font-bold text-center text-white">Editar Conta</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium text-zinc-400">Nome da Conta</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full mt-1 input-style" />
          </div>
          <div>
            <label htmlFor="initialBalance" className="text-sm font-medium text-zinc-400">Saldo Inicial (R$)</label>
            <input id="initialBalance" type="number" step="0.01" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} required className="w-full mt-1 input-style" />
          </div>
          <button type="submit" className="w-full py-3 font-semibold text-black bg-amber-400 rounded-md hover:bg-amber-500 transition-colors">Salvar Alterações</button>
          {error && <p className="text-sm text-center text-red-500">{error}</p>}
        </form>
      </div>
    </div>
  );
} 