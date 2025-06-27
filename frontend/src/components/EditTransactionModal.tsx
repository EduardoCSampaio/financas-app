"use client";
import React, { useState, useEffect, FormEvent } from 'react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import { Transaction } from '@/types';
import { useUserCategories } from '@/contexts/AuthContext';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onTransactionUpdated: (updatedTransaction: Transaction) => void;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onTransactionUpdated,
}) => {
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [date, setDate] = useState('');
  const [paid, setPaid] = useState(false);
  const [proof, setProof] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { categories: userCategories } = useUserCategories();

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl border border-slate-200 p-8 relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-2xl transition-colors"
        >
          &times;
        </button>
        
        <h2 className="apple-title mb-6">Editar Transação</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="edit-description" className="block text-sm font-medium text-slate-700 mb-2">
              Descrição
            </label>
            <input 
              id="edit-description" 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              required 
              className="apple-input w-full" 
              placeholder="Digite a descrição da transação"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-value" className="block text-sm font-medium text-slate-700 mb-2">
                Valor (R$)
              </label>
              <input 
                id="edit-value" 
                type="number" 
                step="0.01" 
                value={value} 
                onChange={(e) => setValue(e.target.value)} 
                required 
                className="apple-input w-full" 
                placeholder="0,00"
              />
            </div>
            <div>
              <label htmlFor="edit-type" className="block text-sm font-medium text-slate-700 mb-2">
                Tipo
              </label>
              <select 
                id="edit-type" 
                value={type} 
                onChange={(e) => setType(e.target.value as "income" | "expense")}
                required
                className="apple-input w-full"
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </div>
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
              Categoria
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={e => setCategoryId(Number(e.target.value))}
              required
              className="w-full mt-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            >
              <option value="">Selecione</option>
              {userCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="edit-date" className="block text-sm font-medium text-slate-700 mb-2">
              Data
            </label>
            <input 
              id="edit-date" 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              required 
              className="apple-input w-full"
            />
          </div>
          
          <div>
            <label htmlFor="proof" className="block text-sm font-medium text-slate-700 mb-2">
              Comprovante (Opcional)
            </label>
            <input
              type="file"
              id="proof"
              onChange={handleFileChange}
              className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 transition-colors"
            />
            {transaction?.proof_url && !proof && (
              <p className="text-xs text-slate-500 mt-1">
                Comprovante existente. Envie um novo para substituí-lo.
              </p>
            )}
          </div>
          
          <div className="flex items-center justify-center">
            <label htmlFor="edit-paid" className="flex items-center cursor-pointer">
              <input 
                id="edit-paid" 
                type="checkbox" 
                checked={paid} 
                onChange={(e) => setPaid(e.target.checked)} 
                className="h-5 w-5 text-indigo-600 bg-white border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-slate-700 font-medium">
                {type === 'income' ? 'Recebido?' : 'Pago?'}
              </span>
            </label>
          </div>
          
          <button 
            type="submit" 
            className="apple-btn w-full"
          >
            Salvar Alterações
          </button>
          
          {error && (
            <p className="text-sm text-center text-red-500 mt-2">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default EditTransactionModal; 