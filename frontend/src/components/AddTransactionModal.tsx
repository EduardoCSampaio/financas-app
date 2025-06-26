"use client";
import { useState, FormEvent, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import { Transaction } from '@/types';
import { useCategories } from '@/contexts/AuthContext';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionAdded: (newTransaction: Transaction) => void;
  accountId: number | null;
}

export default function AddTransactionModal({ isOpen, onClose, onTransactionAdded, accountId }: AddTransactionModalProps) {
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paid, setPaid] = useState(true);
  const [proof, setProof] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { categories, loading } = useCategories();

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setDescription('');
      setValue('');
      setType('expense');
      setCategoryId('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaid(true);
      setProof(null);
      setError(null);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProof(e.target.files[0]);
    } else {
      setProof(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      toast.error("Nenhuma conta selecionada.");
      return;
    }
    setError(null);

    const formData = new FormData();
    formData.append('description', description);
    formData.append('value', value);
    formData.append('type', type);
    formData.append('date', new Date(date).toISOString());
    formData.append('paid', String(paid));
    formData.append('account_id', String(accountId));
    if (categoryId) formData.append('category_id', String(categoryId));
    if (proof) {
      formData.append('proof', proof);
    }

    try {
      const response = await api.post('/transactions/', formData);
      toast.success('Transação adicionada com sucesso!');
      onTransactionAdded(response.data);
      onClose();
    } catch (err: unknown) {
      let errorMessage = 'Falha ao adicionar transação.';
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
      <div className="w-full max-w-lg p-8 space-y-6 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white">&times;</button>
        <h2 className="text-2xl font-bold text-center text-white">Adicionar Transação</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="description" className="text-sm font-medium text-zinc-400">Descrição</label>
            <input id="description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full mt-1 input-style" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="value" className="text-sm font-medium text-zinc-400">Valor (R$)</label>
              <input id="value" type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} required className="w-full mt-1 input-style" />
            </div>
            <div>
              <label htmlFor="type" className="text-sm font-medium text-zinc-400">Tipo</label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value as "income" | "expense")} required className="w-full mt-1 input-style">
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="text-sm font-medium text-zinc-400">Categoria</label>
              <select
                id="category"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                required
                className="w-full mt-1 input-style bg-zinc-900 text-white border-amber-400"
                disabled={loading}
              >
                <option value="" className="bg-zinc-900 text-white">Selecione...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-zinc-900 text-white">{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="date" className="text-sm font-medium text-zinc-400">Data</label>
              <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full mt-1 input-style" />
            </div>
          </div>
          <div>
            <label htmlFor="proof" className="text-sm font-medium text-zinc-400">Comprovante (Opcional)</label>
            <input 
              id="proof" 
              type="file" 
              onChange={handleFileChange} 
              className="w-full mt-1 text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-amber-500 file:text-black hover:file:bg-amber-600" 
            />
          </div>
          <div className="flex items-center justify-center pt-2">
            <label htmlFor="paid" className="flex items-center cursor-pointer">
              <input 
                id="paid" 
                type="checkbox" 
                checked={paid} 
                onChange={(e) => setPaid(e.target.checked)} 
                className="form-checkbox h-5 w-5 text-amber-400 bg-zinc-800 border-zinc-600 rounded focus:ring-amber-500"
              />
              <span className="ml-2 text-zinc-300">{type === 'income' ? 'Recebido?' : 'Pago?'}</span>
            </label>
          </div>
          <button type="submit" className="w-full py-3 font-semibold text-black bg-amber-400 rounded-md hover:bg-amber-500 transition-colors">Adicionar</button>
          {error && <p className="text-sm text-center text-red-500">{error}</p>}
        </form>
      </div>
    </div>
  );
} 