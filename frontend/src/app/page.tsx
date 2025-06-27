"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { useAuth, useCategories } from '@/contexts/AuthContext';
import { FaEdit, FaTrash, FaChevronDown, FaFileAlt, FaExternalLinkAlt } from 'react-icons/fa';
import debounce from 'lodash.debounce';
import Pagination from "@/components/Pagination";
import { toast } from 'react-toastify';
import api from "@/lib/api"; // Importando o cliente API
import AddTransactionModal from '@/components/AddTransactionModal';
import EditTransactionModal from '@/components/EditTransactionModal';
import { Transaction } from '@/types';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Link from 'next/link';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import BudgetPanel from '@/components/BudgetPanel';
import { saveAs } from 'file-saver';
ChartJS.register(ArcElement, Tooltip, Legend);

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

// Função para exportar CSV
function exportCSV() {
  const headers = [
    'Data', 'Descrição', 'Categoria', 'Valor', 'Comprovante', 'Status'
  ];
  const rows = transactions.map(t => [
    new Date(t.date).toLocaleDateString('pt-BR'),
    t.description,
    isCategoryObject(t.category) ? t.category.name : '-',
    (t.type === 'income' ? '+' : '-') + 'R$ ' + t.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    t.proof_url || '-',
    t.paid ? 'Pago' : 'Pendente',
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, 'transacoes.csv');
}

export default function DashboardPage() {
  const { 
    token, 
    user, 
    accounts, 
    selectedAccount, 
    selectAccount,
    fetchAccounts,
    categories
  } = useAuth();
  const { categories: authCategories } = useCategories();
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
  const [filterText, setFilterText] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

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
    debounce(async (currentAccount, currentSearch, currentCategory, page, limit, currentStartDate, currentEndDate, currentType, currentStatus) => {
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
        ...(currentType ? { type: currentType } : {}),
        ...(currentStatus ? { status: currentStatus } : {}),
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
      debouncedFetch(
        selectedAccount,
        filterText,
        filterCategory,
        currentPage,
        itemsPerPage,
        filterStartDate,
        filterEndDate,
        filterType,
        filterStatus
      );
    } else if (token && accounts.length === 0) {
      setLoading(false);
      setTransactions([]);
    } else if (!token) {
      router.push('/login');
    }
  }, [token, selectedAccount, filterText, filterCategory, currentPage, itemsPerPage, router, debouncedFetch, accounts, filterStartDate, filterEndDate, filterType, filterStatus]);

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

  // Agrupar despesas por categoria
  const despesasPorCategoria: Record<string, number> = {};
  transactions.forEach(t => {
    if (
      t.type === 'expense' &&
      t.category &&
      typeof t.category === 'object' &&
      (t.category as { name?: string }).name
    ) {
      const cat = (t.category as { name: string }).name;
      despesasPorCategoria[cat] = (despesasPorCategoria[cat] || 0) + t.value;
    }
  });
  const pieData = {
    labels: Object.keys(despesasPorCategoria),
    datasets: [
      {
        data: Object.values(despesasPorCategoria),
        backgroundColor: [
          '#6366f1', '#818cf8', '#a5b4fc', '#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#f87171', '#facc15', '#38bdf8'
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  // Calcular gastos do mês atual por categoria
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const expensesByCategory: Record<number, number> = {};
  transactions.forEach(t => {
    if (
      t.type === 'expense' &&
      t.category &&
      typeof t.category === 'object' &&
      (t.category as { id?: number }).id &&
      t.date.startsWith(currentMonth)
    ) {
      const catId = (t.category as { id: number }).id;
      expensesByCategory[catId] = (expensesByCategory[catId] || 0) + t.value;
    }
  });

  return (
    <div className="space-y-8">
      {/* Header com saudação e seletor de contas */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="apple-title">
              Olá, {user?.name || user?.email || 'Usuário'} 
            </h1>
            <p className="text-lg text-slate-600 mt-1">
              Bem-vindo ao seu dashboard premium
            </p>
          </div>
          
          {/* Seletor de contas */}
          {accounts.length > 0 && (
            <Menu as="div" className="relative">
              <Menu.Button className="apple-btn-secondary inline-flex items-center gap-2">
                {selectedAccount ? selectedAccount.name : 'Selecionar Conta'}
                <FaChevronDown className="text-sm" />
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right bg-white rounded-xl shadow-lg border border-slate-200 focus:outline-none">
                  <div className="py-1">
                    {accounts.map((account) => (
                      <Menu.Item key={account.id}>
                        {({ active }) => (
                          <button
                            onClick={() => selectAccount(account)}
                            className={`${
                              active ? 'bg-slate-50 text-slate-900' : 'text-slate-700'
                            } ${
                              selectedAccount?.id === account.id ? 'bg-indigo-50 text-indigo-700' : ''
                            } block w-full text-left px-4 py-2 text-sm font-medium`}
                          >
                            {account.name}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                    <div className="border-t border-slate-200 my-1" />
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/accounts"
                          className={`${
                            active ? 'bg-slate-50 text-slate-900' : 'text-slate-700'
                          } block px-4 py-2 text-sm font-medium`}
                        >
                          Gerenciar Contas
                        </Link>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          )}
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

      {/* Painel de orçamento por categoria */}
      <BudgetPanel userId={user?.id} currentMonth={currentMonth} expensesByCategory={expensesByCategory} />

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tabela de transações */}
        <div className="lg:col-span-2 apple-card">
          <div className="apple-subtitle mb-6">Transações Recentes</div>
          
          {/* Filtros avançados */}
          <div className="apple-card mb-6 flex flex-wrap gap-4 items-end p-6">
            <div className="flex flex-col">
              <label className="text-xs text-slate-600 mb-1">Buscar</label>
              <input type="text" value={filterText} onChange={e => setFilterText(e.target.value)} placeholder="Descrição..." className="apple-input w-40" />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-600 mb-1">Categoria</label>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="apple-input w-40">
                <option value="">Todas</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-600 mb-1">Tipo</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="apple-input w-32">
                <option value="">Todos</option>
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-600 mb-1">Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="apple-input w-32">
                <option value="">Todos</option>
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-600 mb-1">Data Inicial</label>
              <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="apple-input w-36" />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-600 mb-1">Data Final</label>
              <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="apple-input w-36" />
            </div>
          </div>
          
          {/* Botão de exportação */}
          <div className="flex justify-end mb-2">
            <button onClick={exportCSV} className="apple-btn-secondary px-4 py-2 text-sm">Exportar CSV</button>
          </div>
          
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
                    <th className="text-left py-3 px-4 text-slate-600 font-semibold">Comprovante</th>
                    <th className="text-left py-3 px-4 text-slate-600 font-semibold">Status</th>
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
                        {transaction.proof_url ? (
                          <a href={transaction.proof_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:underline">
                            <FaFileAlt className="inline-block" />
                            <FaExternalLinkAlt className="inline-block text-xs" />
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {transaction.paid ? (
                          <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Pago</span>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">Pendente</span>
                        )}
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
          <div className="w-full h-64 flex items-center justify-center">
            {Object.keys(despesasPorCategoria).length > 0 ? (
              <Pie data={pieData} options={{
                plugins: {
                  legend: {
                    display: true,
                    position: 'right',
                    labels: {
                      color: '#334155',
                      font: { family: 'Inter, sans-serif', size: 14, weight: 'bold' },
                      padding: 20,
                    },
                  },
                },
                responsive: true,
                maintainAspectRatio: false,
              }} />
            ) : (
              <div className="text-indigo-600 font-semibold opacity-70 text-center">
                Nenhuma despesa para exibir no gráfico
              </div>
            )}
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