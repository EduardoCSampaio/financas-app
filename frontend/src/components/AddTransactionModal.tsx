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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="w-full max-w-lg sm:max-w-md p-2 sm:p-8 space-y-6 bg-white/10 backdrop-blur-2xl border border-gold/40 rounded-2xl shadow-2xl relative overflow-y-auto max-h-[95vh] glass-card animate-slide-up">
        <button onClick={onClose} className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gold hover:text-white text-3xl sm:text-2xl transition-colors">&times;</button>
        <h2 className="text-2xl font-extrabold text-center text-gold mb-2 drop-shadow-lg">Adicionar Transação</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input id="description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} required className="peer w-full pt-6 pb-2 px-3 rounded-lg bg-zinc-900/80 text-white border border-gold/30 focus:ring-2 focus:ring-gold outline-none text-base placeholder-transparent" placeholder="Descrição" />
            <label htmlFor="description" className="absolute left-3 top-2 text-gold text-xs font-semibold transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-gold">Descrição</label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <input id="value" type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} required className="peer w-full pt-6 pb-2 px-3 rounded-lg bg-zinc-900/80 text-white border border-gold/30 focus:ring-2 focus:ring-gold outline-none text-base placeholder-transparent" placeholder="Valor (R$)" />
              <label htmlFor="value" className="absolute left-3 top-2 text-gold text-xs font-semibold transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-gold">Valor (R$)</label>
            </div>
            <div className="relative">
              <label htmlFor="type" className="block text-xs font-semibold text-gold mb-1">Tipo</label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value as "income" | "expense")}
                required
                className="w-full rounded-lg bg-zinc-900/80 text-white border border-gold/30 focus:ring-2 focus:ring-gold outline-none text-base py-2 px-3">
                <option value="expense" className="bg-zinc-900 text-white">Despesa</option>
                <option value="income" className="bg-zinc-900 text-white">Receita</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label htmlFor="category" className="block text-xs font-semibold text-gold mb-1">Categoria</label>
              <select
                id="category"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                required
                className="w-full rounded-lg bg-zinc-900/80 text-white border border-gold/30 focus:ring-2 focus:ring-gold outline-none text-base py-2 px-3"
                disabled={loading}
              >
                <option value="" className="bg-zinc-900 text-white">Selecione...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-zinc-900 text-white">{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="peer w-full pt-6 pb-2 px-3 rounded-lg bg-zinc-900/80 text-white border border-gold/30 focus:ring-2 focus:ring-gold outline-none text-base placeholder-transparent" placeholder="Data" />
              <label htmlFor="date" className="absolute left-3 top-2 text-gold text-xs font-semibold transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-gold">Data</label>
            </div>
          </div>
          <div>
            <label htmlFor="proof" className="block text-xs font-semibold text-gold mb-1">Comprovante (Opcional)</label>
            <input 
              id="proof" 
              type="file" 
              onChange={handleFileChange} 
              className="w-full text-sm text-gold file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gold file:text-primary hover:file:bg-yellow-400" 
            />
          </div>
          <div className="flex items-center justify-center pt-2">
            <label htmlFor="paid" className="flex items-center cursor-pointer">
              <input 
                id="paid" 
                type="checkbox" 
                checked={paid} 
                onChange={(e) => setPaid(e.target.checked)} 
                className="form-checkbox h-5 w-5 text-gold bg-zinc-800 border-gold rounded focus:ring-gold"
              />
              <span className="ml-2 text-gold">{type === 'income' ? 'Recebido?' : 'Pago?'}</span>
            </label>
          </div>
          <button type="submit" className="w-full py-3 font-semibold text-primary bg-gold rounded-lg hover:bg-yellow-400 transition-colors text-lg shadow-lg">Adicionar</button>
          {error && <p className="text-sm text-center text-red-500 mt-2">{error}</p>}
        </form>
      </div>
    </div>
  );
} 