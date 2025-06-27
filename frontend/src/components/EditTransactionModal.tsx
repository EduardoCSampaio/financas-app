"use client";
import React, { useState, useEffect, FormEvent } from 'react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import { Transaction } from '@/types';
import { useCategories } from '@/contexts/AuthContext';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onTransactionUpdated: (updatedTransaction: Transaction) => void;
  // accountId não é mais necessário aqui, pois já está na transação
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onTransactionUpdated,
}) => {
  // const { token } = useAuth();
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [date, setDate] = useState('');
  const [paid, setPaid] = useState(false);
  const [proof, setProof] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { categories, loading } = useCategories();

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setValue(String(transaction.value));
      setType(transaction.type);
      setCategoryId(transaction.category_id ?? '');
      setDate(new Date(transaction.date).toISOString().split('T')[0]);
      setPaid(transaction.paid);
    }
  }, [transaction]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProof(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!transaction) {
      setError('Transação não encontrada.');
      return;
    }

    const formData = new FormData();
    formData.append('description', description);
    formData.append('value', value);
    formData.append('type', type);
    formData.append('date', new Date(date).toISOString());
    formData.append('paid', String(paid));
    if (categoryId) formData.append('category_id', String(categoryId));
    if (proof) {
      formData.append('proof', proof);
    }

    try {
      const response = await api.put(`/transactions/${transaction.id}`, formData);
      toast.success('Transação atualizada com sucesso!');
      onTransactionUpdated(response.data);
      onClose();
    } catch (err: unknown) {
      let errorMessage = 'Falha ao atualizar a transação.';
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'detail' in err.response.data) {
        errorMessage = (err.response as { data?: { detail?: string } }).data?.detail || errorMessage;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="w-full max-w-lg sm:max-w-md p-2 sm:p-8 space-y-6 bg-white/10 backdrop-blur-2xl border border-gold/40 rounded-2xl shadow-2xl relative overflow-y-auto max-h-[95vh] glass-card animate-slide-up">
        <button onClick={onClose} className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gold hover:text-white text-3xl sm:text-2xl transition-colors">&times;</button>
        <h2 className="text-2xl font-extrabold text-center text-gold mb-2 drop-shadow-lg">Editar Transação</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input id="edit-description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} required className="peer w-full pt-6 pb-2 px-3 rounded-lg bg-zinc-900/80 text-white border border-gold/30 focus:ring-2 focus:ring-gold outline-none text-base placeholder-transparent" placeholder="Descrição" />
            <label htmlFor="edit-description" className="absolute left-3 top-2 text-gold text-xs font-semibold transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-gold">Descrição</label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <input id="edit-value" type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} required className="peer w-full pt-6 pb-2 px-3 rounded-lg bg-zinc-900/80 text-white border border-gold/30 focus:ring-2 focus:ring-gold outline-none text-base placeholder-transparent" placeholder="Valor (R$)" />
              <label htmlFor="edit-value" className="absolute left-3 top-2 text-gold text-xs font-semibold transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-gold">Valor (R$)</label>
            </div>
            <div className="relative">
              <label htmlFor="edit-type" className="block text-xs font-semibold text-gold mb-1">Tipo</label>
              <select id="edit-type" value={type} onChange={(e) => setType(e.target.value as "income" | "expense")}
                required
                className="w-full rounded-lg bg-zinc-900/80 text-white border border-gold/30 focus:ring-2 focus:ring-gold outline-none text-base py-2 px-3">
                <option value="expense" className="bg-zinc-900 text-white">Despesa</option>
                <option value="income" className="bg-zinc-900 text-white">Receita</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label htmlFor="edit-category" className="block text-xs font-semibold text-gold mb-1">Categoria</label>
              <select
                id="edit-category"
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
              <input id="edit-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="peer w-full pt-6 pb-2 px-3 rounded-lg bg-zinc-900/80 text-white border border-gold/30 focus:ring-2 focus:ring-gold outline-none text-base placeholder-transparent" placeholder="Data" />
              <label htmlFor="edit-date" className="absolute left-3 top-2 text-gold text-xs font-semibold transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-gold">Data</label>
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="proof" className="block text-xs font-semibold text-gold mb-1">Comprovante (Opcional)</label>
            <input
                type="file"
                id="proof"
                onChange={handleFileChange}
                className="w-full text-sm text-gold file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gold file:text-primary hover:file:bg-yellow-400"
            />
            {transaction?.proof_url && !proof && (
                <p className="text-xs text-gray-500 mt-1">
                    Comprovante existente. Envie um novo para substituí-lo.
                </p>
            )}
          </div>
          <div className="flex items-center justify-center pt-2">
            <label htmlFor="edit-paid" className="flex items-center cursor-pointer">
              <input 
                id="edit-paid" 
                type="checkbox" 
                checked={paid} 
                onChange={(e) => setPaid(e.target.checked)} 
                className="form-checkbox h-5 w-5 text-gold bg-zinc-800 border-gold rounded focus:ring-gold"
              />
              <span className="ml-2 text-gold">{type === 'income' ? 'Recebido?' : 'Pago?'}</span>
            </label>
          </div>
          <button type="submit" className="w-full py-3 font-semibold text-primary bg-gold rounded-lg hover:bg-yellow-400 transition-colors text-lg shadow-lg">Salvar Alterações</button>
          {error && <p className="text-sm text-center text-red-500 mt-2">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default EditTransactionModal; 