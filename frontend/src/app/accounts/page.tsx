"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import AddAccountModal from '@/components/AddAccountModal';
import EditAccountModal from '@/components/EditAccountModal';
import { FaEdit, FaTrash, FaPlus, FaUniversity } from 'react-icons/fa';
import { Account } from '@/types';
import api from '@/lib/api';
import Link from 'next/link';
import ErrorBoundary from "@/components/ErrorBoundary";

export default function AccountsPage() {
  const { user, accounts, fetchAccounts } = useAuth();
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAccountForEdit, setSelectedAccountForEdit] = useState<Account | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/login');
    } else {
      fetchAccounts();
    }
  }, [router, fetchAccounts]);

  const handleDelete = async (accountId: number) => {
    if (confirm('Tem certeza?')) {
      try {
        await api.delete(`/accounts/${accountId}`);
        toast.success('Conta excluída!');
        await fetchAccounts();
      } catch {
        toast.error('Erro ao excluir a conta.');
      }
    }
  };

  const openEditModal = (account: Account) => {
    setSelectedAccountForEdit(account);
    setIsEditModalOpen(true);
  };

  const FallbackUI = (
    <div className="text-center text-red-500">
      <h2>Algo deu errado.</h2>
      <p>Por favor, atualize a página ou tente novamente mais tarde.</p>
    </div>
  );

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <ErrorBoundary fallback={FallbackUI}>
      <div className="min-h-screen bg-black text-white p-4 sm:p-8">
        <AddAccountModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
        <EditAccountModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          account={selectedAccountForEdit}
        />

        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Contas</h1>
            <p className="text-zinc-400">Adicione, edite ou remova suas contas financeiras.</p>
          </div>
          <Link href="/">
              <button className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  Voltar ao Dashboard
              </button>
          </Link>
        </header>

        <div className="mb-6">
            <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold py-2 px-4 rounded-lg transition-colors"
            >
                <FaPlus />
                Criar Nova Conta
            </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.isArray(accounts) && accounts.map(account => (
            <div key={account.id} className="bg-zinc-900 rounded-lg p-6 flex flex-col justify-between shadow-lg hover:shadow-amber-400/20 transition-shadow duration-300">
              <div>
                <h2 className="text-xl font-bold text-amber-400">{account.name}</h2>
                <p className="text-2xl mt-2">
                  R$ {account.initial_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-zinc-500">Saldo Inicial</p>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => openEditModal(account)} className="p-2 text-zinc-400 hover:text-amber-400 transition-colors">
                  <FaEdit />
                </button>
                <button onClick={() => handleDelete(account.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>

        {(!Array.isArray(accounts) || accounts.length === 0) && (
            <div className="text-center py-16 border-2 border-dashed border-zinc-800 rounded-lg">
                <FaUniversity className="mx-auto text-4xl text-zinc-600 mb-4" />
                <p className="text-zinc-400">Você ainda não tem nenhuma conta cadastrada.</p>
                <p className="text-zinc-500">Use o botão acima para criar sua primeira conta!</p>
            </div>
        )}
      </div>
    </ErrorBoundary>
  );
}