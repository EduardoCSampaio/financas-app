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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl">&times;</button>
        <h2 className="text-2xl font-bold text-center text-white">Criar Nova Conta</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-300">
              Nome da Conta
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full mt-1 input-style"
              placeholder="Ex: Carteira, Banco Digital"
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-zinc-300">
              Tipo da Conta
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              className="w-full mt-1 input-style"
            >
              <option value="corrente">Corrente</option>
              <option value="poupança">Poupança</option>
            </select>
          </div>
          <div>
            <label htmlFor="initialBalance" className="block text-sm font-medium text-zinc-300">
              Saldo Inicial
            </label>
            <input
              type="number"
              id="initialBalance"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              required
              className="w-full mt-1 input-style"
              placeholder="0.00"
            />
          </div>
          <button type="submit" className="w-full py-3 font-semibold text-black bg-amber-400 rounded-md hover:bg-amber-500 transition-colors">
            Adicionar Conta
          </button>
          {error && <p className="text-sm text-center text-red-500">{error}</p>}
        </form>
      </div>
    </div>
  );
} 