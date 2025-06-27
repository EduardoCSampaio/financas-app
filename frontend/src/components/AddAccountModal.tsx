"use client";
import React from 'react';
import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddAccountModal({ isOpen, onClose }: AddAccountModalProps) {
  const { fetchAccounts } = useAuth();
  const [name, setName] = useState('');
  const [type, setType] = useState('corrente');
  const [initialBalance, setInitialBalance] = useState('0');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/accounts/', {
        name,
        type,
        initial_balance: parseFloat(initialBalance) || 0,
      });
      toast.success('Conta adicionada com sucesso!');
      await fetchAccounts();
      onClose();
      setName('');
      setInitialBalance('0');
      setType('corrente');
    } catch (err: unknown) {
      let errorMessage = 'Falha ao criar a conta.';
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'detail' in err.response.data) {
        errorMessage = (err.response as { data?: { detail?: string } }).data?.detail || errorMessage;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white border border-slate-200 rounded-2xl shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-2xl font-light transition-colors">&times;</button>
        <h2 className="text-2xl font-bold text-center text-slate-900">Criar Nova Conta</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
              Nome da Conta
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full mt-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              placeholder="Ex: Carteira, Banco Digital"
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1">
              Tipo da Conta
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              className="w-full mt-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            >
              <option value="corrente">Corrente</option>
              <option value="poupança">Poupança</option>
            </select>
          </div>
          <div>
            <label htmlFor="initialBalance" className="block text-sm font-medium text-slate-700 mb-1">
              Saldo Inicial
            </label>
            <input
              type="number"
              id="initialBalance"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              required
              className="w-full mt-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              placeholder="0.00"
            />
          </div>
          <button type="submit" className="w-full py-3 font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors text-lg shadow-sm">
            Adicionar Conta
          </button>
          {error && <p className="text-sm text-center text-red-500">{error}</p>}
        </form>
      </div>
    </div>
  );
} 