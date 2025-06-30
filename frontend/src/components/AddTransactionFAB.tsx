"use client";
import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import AddTransactionModal from './AddTransactionModal';
import { useAuth } from '@/contexts/AuthContext';

export default function AddTransactionFAB() {
  const [open, setOpen] = useState(false);
  const { selectedAccount } = useAuth();

  // Função dummy para onTransactionAdded (pode ser customizada depois)
  const handleTransactionAdded = () => {};

  // Não renderiza se não houver conta selecionada
  if (!selectedAccount) return null;

  return (
    <>
      {/* FAB flutuante, só no mobile */}
      <button
        className="fixed bottom-6 right-6 z-40 md:hidden w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 text-white shadow-2xl flex items-center justify-center text-3xl hover:scale-110 active:scale-95 transition-all duration-150"
        onClick={() => setOpen(true)}
        aria-label="Adicionar transação"
      >
        <FaPlus />
      </button>
      <AddTransactionModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onTransactionAdded={handleTransactionAdded}
        accountId={selectedAccount.id}
      />
    </>
  );
} 