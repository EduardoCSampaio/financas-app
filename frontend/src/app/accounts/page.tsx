"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import AddAccountModal from '@/components/AddAccountModal';
import EditAccountModal from '@/components/EditAccountModal';
import { FaEdit, FaTrash, FaPlus, FaUniversity, FaSearch, FaFilter } from 'react-icons/fa';
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
  const [search, setSearch] = useState('');
  const [minBalance, setMinBalance] = useState('');
  const [maxBalance, setMaxBalance] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/login');
    } else {
      fetchAccounts();
    }
  }, [router, fetchAccounts]);

  const handleDelete = async (accountId: number) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      try {
        await api.delete(`/accounts/${accountId}`);
        toast.success('Conta excluída com sucesso!');
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

  const filteredAccounts = Array.isArray(accounts)
    ? accounts.filter(account => {
        const matchesSearch = account.name.toLowerCase().includes(search.toLowerCase());
        const min = minBalance ? parseFloat(minBalance) : -Infinity;
        const max = maxBalance ? parseFloat(maxBalance) : Infinity;
        const matchesBalance = account.initial_balance >= min && account.initial_balance <= max;
        return matchesSearch && matchesBalance;
      })
    : [];

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
      <div className="space-y-8">
        <AddAccountModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
        <EditAccountModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          account={selectedAccountForEdit}
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="apple-title">Gerenciar Contas</h1>
            <p className="text-lg text-slate-600 mt-1">
              Adicione, edite ou remova suas contas financeiras
            </p>
          </div>
          <Link href="/">
            <button className="apple-btn-secondary">
              Voltar ao Dashboard
            </button>
          </Link>
        </div>

        {/* Barra de busca e filtros */}
        <div className="flex flex-col md:flex-row gap-3 items-center mt-4 mb-2">
          <div className="relative w-full md:w-72">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome da conta..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white/70 shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                value={minBalance}
                onChange={e => setMinBalance(e.target.value)}
                placeholder="Saldo mín."
                className="w-28 pl-8 pr-2 py-2 rounded-xl border border-slate-200 bg-white/70 shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition"
              />
            </div>
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                value={maxBalance}
                onChange={e => setMaxBalance(e.target.value)}
                placeholder="Saldo máx."
                className="w-28 pl-8 pr-2 py-2 rounded-xl border border-slate-200 bg-white/70 shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Botão de adicionar */}
        <div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="apple-btn inline-flex items-center gap-2"
          >
            <FaPlus />
            Criar Nova Conta
          </button>
        </div>

        {/* Grid de contas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAccounts.map(account => (
            <div key={account.id} className="apple-card hover:shadow-lg transition-all duration-200">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-slate-800">{account.name}</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => openEditModal(account)} 
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <FaEdit size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(account.id)} 
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-bold text-indigo-600">
                  R$ {account.initial_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-slate-500">Saldo Inicial</div>
              </div>
            </div>
          ))}
        </div>

        {/* Estado vazio */}
        {(!Array.isArray(accounts) || accounts.length === 0) && (
          <div className="apple-card text-center py-16">
            <FaUniversity className="mx-auto text-6xl text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Nenhuma conta cadastrada
            </h3>
            <p className="text-slate-500 mb-6">
              Use o botão acima para criar sua primeira conta!
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="apple-btn inline-flex items-center gap-2"
            >
              <FaPlus />
              Criar Primeira Conta
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}