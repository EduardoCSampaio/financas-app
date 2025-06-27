"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaEdit, FaTrash } from 'react-icons/fa';
import debounce from 'lodash.debounce';
import Pagination from "@/components/Pagination";
import { toast } from 'react-toastify';
import api from "@/lib/api"; // Importando o cliente API
import AddTransactionModal from '@/components/AddTransactionModal';
import EditTransactionModal from '@/components/EditTransactionModal';
import { Transaction } from '@/types';

// Spinner de carregamento
function Spinner() {
  return (
    <span className="inline-block w-6 h-6 border-2 border-t-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
  );
}

function isCategoryObject(category: unknown): category is { name: string } {
  return (
    typeof category === 'object' &&
    category !== null &&
    'name' in category &&
    typeof (category as { name?: unknown }).name === 'string'
  );
}

// Função para gerar cor baseada no nome da categoria
function getCategoryColor(name: string) {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500', 'bg-red-500', 'bg-cyan-500', 'bg-lime-500', 'bg-orange-500', 'bg-teal-500'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % colors.length;
  return colors[idx];
}

export default function DashboardPage() {
  const { 
    token, 
    user, 
    accounts, 
    selectedAccount, 
    fetchAccounts 
  } = useAuth();
  const router = useRouter();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search] = useState('');
  const [category] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [startDate] = useState("");
  const [endDate] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransactionForEdit, setSelectedTransactionForEdit] = useState<Transaction | null>(null);

  const handleTransactionAdded = (newTransaction: Transaction) => {
    if(selectedAccount && newTransaction.account_id === selectedAccount.id) {
      setTransactions(prev => [newTransaction, ...prev]);
    }
    fetchAccounts();
  };

  const handleTransactionUpdated = (updatedTransaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
    fetchAccounts();
  };
  
  const handleDelete = async (transactionId: number) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await api.delete(`/transactions/${transactionId}`);
        toast.success('Transação excluída com sucesso!');
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
        fetchAccounts();
      } catch (error) {
        console.error(error);
        toast.error('Erro ao excluir transação.');
      }
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetch = useCallback(
    debounce(async (currentAccount, currentSearch, currentCategory, page, limit, currentStartDate, currentEndDate) => {
      if (!currentAccount) {
        setTransactions([]);
        setTotalPages(1);
        setCurrentPage(1);
        setLoading(false);
        return;
      };

      setLoading(true);
      const params = {
        account_id: String(currentAccount.id),
        search: currentSearch,
        category: currentCategory,
        page: String(page),
        limit: String(limit),
        ...(currentStartDate ? { start_date: currentStartDate } : {}),
        ...(currentEndDate ? { end_date: currentEndDate } : {}),
      };

      try {
        const response = await api.get('/transactions/', { params });
        setTransactions(response.data.items);
        setTotalPages(Math.ceil(response.data.total / limit));
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(error.message);
        } else {
          console.error(error);
        }
      } finally {
        setLoading(false);
      }
    }, 500),
    [api, fetchAccounts]
  );

  useEffect(() => {
    if (token && selectedAccount) {
      debouncedFetch(selectedAccount, search, category, currentPage, itemsPerPage, startDate, endDate);
    } else if (token && accounts.length === 0) {
      setLoading(false);
      setTransactions([]);
    } else if (!token) {
      router.push('/login');
    }
  }, [token, selectedAccount, search, category, currentPage, itemsPerPage, router, debouncedFetch, accounts, startDate, endDate]);

  // Cálculos derivados usam 'transactions'
  const saldo = transactions.reduce(
    (acc, t) => t.type === 'income' ? acc + t.value : acc - t.value, 
    selectedAccount?.initial_balance || 0
  );
  const receitas = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.value, 0);
  const despesas = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.value, 0);

  // Cálculo de tendências (simulado)
  const saldoTrend = 5.2;
  const receitasTrend = 2.1;
  const despesasTrend = -1.3;

  return (
    <div className="space-y-8">
      {/* Header com saudação */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="apple-title">
            Olá, {user?.email || 'Usuário'} 👋
          </h1>
          <p className="text-lg text-slate-600 mt-1">
            Bem-vindo ao seu dashboard premium
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="apple-btn"
        >
          Nova Transação
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="apple-card">
          <div className="text-slate-600 font-medium mb-2">Saldo Atual</div>
          <div className="text-3xl font-bold text-slate-800 mb-1">
            R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-green-600 font-semibold">
            +{saldoTrend}% este mês
          </div>
        </div>
        
        <div className="apple-card">
          <div className="text-slate-600 font-medium mb-2">Receitas</div>
          <div className="text-3xl font-bold text-slate-800 mb-1">
            R$ {receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-green-600 font-semibold">
            +{receitasTrend}% este mês
          </div>
        </div>
        
        <div className="apple-card">
          <div className="text-slate-600 font-medium mb-2">Despesas</div>
          <div className="text-3xl font-bold text-slate-800 mb-1">
            R$ {despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-red-500 font-semibold">
            {despesasTrend}% este mês
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tabela de transações */}
        <div className="lg:col-span-2 apple-card">
          <div className="apple-subtitle mb-6">Transações Recentes</div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Nenhuma transação encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-slate-600 font-semibold">Data</th>
                    <th className="text-left py-3 px-4 text-slate-600 font-semibold">Descrição</th>
                    <th className="text-left py-3 px-4 text-slate-600 font-semibold">Categoria</th>
                    <th className="text-left py-3 px-4 text-slate-600 font-semibold">Valor</th>
                    <th className="text-left py-3 px-4 text-slate-600 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-700">
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {transaction.description}
                      </td>
                      <td className="py-3 px-4">
                        {isCategoryObject(transaction.category) ? (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getCategoryColor(transaction.category.name)}`}>
                            {transaction.category.name}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className={`py-3 px-4 font-semibold ${transaction.type === 'income' ? 'amount-positive' : 'amount-negative'}`}>
                        {transaction.type === 'income' ? '+' : '-'}R$ {transaction.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedTransactionForEdit(transaction);
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>

        {/* Gráfico */}
        <div className="apple-card">
          <div className="apple-subtitle mb-6">Resumo Gráfico</div>
          <div className="w-full h-64 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl flex items-center justify-center">
            <div className="text-indigo-600 font-semibold opacity-70">
              [ Gráfico de barras aqui ]
            </div>
          </div>
        </div>
      </div>

      {/* Modais */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onTransactionAdded={handleTransactionAdded}
        accountId={selectedAccount?.id ?? null}
      />
      
      <EditTransactionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onTransactionUpdated={handleTransactionUpdated}
        transaction={selectedTransactionForEdit}
      />
    </div>
  );
}