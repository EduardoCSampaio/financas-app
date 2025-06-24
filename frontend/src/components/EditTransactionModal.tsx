"use client";
import React, { useState, useEffect, FormEvent } from 'react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import { Transaction } from '@/types';

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
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [paid, setPaid] = useState(false);
  const [proof, setProof] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setValue(String(transaction.value));
      setType(transaction.type);
      setCategory(transaction.category);
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
    formData.append('category', category);
    formData.append('date', new Date(date).toISOString());
    formData.append('paid', String(paid));
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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="w-full max-w-lg p-8 space-y-6 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white">&times;</button>
        <h2 className="text-2xl font-bold text-center text-white">Editar Transação</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-description" className="text-sm font-medium text-zinc-400">Descrição</label>
            <input id="edit-description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full mt-1 input-style" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-value" className="text-sm font-medium text-zinc-400">Valor (R$)</label>
              <input id="edit-value" type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} required className="w-full mt-1 input-style" />
            </div>
            <div>
              <label htmlFor="edit-type" className="text-sm font-medium text-zinc-400">Tipo</label>
              <select id="edit-type" value={type} onChange={(e) => setType(e.target.value as "income" | "expense")} required className="w-full mt-1 input-style">
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-category" className="text-sm font-medium text-zinc-400">Categoria</label>
              <input id="edit-category" type="text" value={category} onChange={(e) => setCategory(e.target.value)} required className="w-full mt-1 input-style" />
            </div>
            <div>
              <label htmlFor="edit-date" className="text-sm font-medium text-zinc-400">Data</label>
              <input id="edit-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full mt-1 input-style" />
            </div>
          </div>
          <div className="flex items-center justify-center pt-2">
            <label htmlFor="edit-paid" className="flex items-center cursor-pointer">
              <input 
                id="edit-paid" 
                type="checkbox" 
                checked={paid} 
                onChange={(e) => setPaid(e.target.checked)} 
                className="form-checkbox h-5 w-5 text-amber-400 bg-zinc-800 border-zinc-600 rounded focus:ring-amber-500"
              />
              <span className="ml-2 text-zinc-300">{type === 'income' ? 'Recebido?' : 'Pago?'}</span>
            </label>
          </div>
          <div className="mb-4">
            <label htmlFor="proof" className="block text-sm font-medium text-gray-700">
                Comprovante (Opcional)
            </label>
            <input
                type="file"
                id="proof"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
            />
            {transaction?.proof_url && !proof && (
                <p className="text-xs text-gray-500 mt-1">
                    Comprovante existente. Envie um novo para substituí-lo.
                </p>
            )}
          </div>
          <button type="submit" className="w-full py-3 font-semibold text-black bg-amber-400 rounded-md hover:bg-amber-500 transition-colors">Salvar Alterações</button>
          {error && <p className="text-sm text-center text-red-500">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default EditTransactionModal; 