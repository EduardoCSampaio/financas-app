"use client";
import { useEffect, useRef, useState, useCallback, Fragment } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Chart from 'chart.js/auto';
import { FaEdit, FaTrash, FaUserCircle, FaPaperclip } from 'react-icons/fa';
import debounce from 'lodash.debounce';
import Pagination from "@/components/Pagination";
import { toast } from 'react-toastify';
import { Menu, Transition } from '@headlessui/react';
import Link from "next/link";
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import api from "@/lib/api"; // Importando o cliente API
import AddTransactionModal from '@/components/AddTransactionModal';
import EditTransactionModal from '@/components/EditTransactionModal';
import { Transaction } from '@/types';
import { Tooltip } from 'react-tooltip';

// Spinner de carregamento
function Spinner() {
  return (
    <span className="inline-block w-6 h-6 border-2 border-t-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
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
    logout, 
    accounts, 
    selectedAccount, 
    selectAccount,
    fetchAccounts 
  } = useAuth();
  const router = useRouter();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [viewMode, setViewMode] = useState<'real' | 'previsto'>('real');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10); // Remover setItemsPerPage se não for usado
  const [chartType, setChartType] = useState<'pie' | 'bar' | 'line'>('pie');
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransactionForEdit, setSelectedTransactionForEdit] = useState<Transaction | null>(null);

  // Refs para os gráficos
  const pizzaChartRef = useRef<Chart | null>(null);
  const barChartRef = useRef<Chart | null>(null);
  const pizzaCanvasRef = useRef<HTMLCanvasElement>(null);
  const barCanvasRef = useRef<HTMLCanvasElement>(null);

  // Estados para filtros
  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingCategory, setPendingCategory] = useState('');
  const [pendingStartDate, setPendingStartDate] = useState("");
  const [pendingEndDate, setPendingEndDate] = useState("");

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

  const handleTogglePaid = async (transaction: Transaction) => {
    try {
      const response = await api.patch(`/transactions/${transaction.id}/toggle-paid`, { paid: !transaction.paid });
      handleTransactionUpdated(response.data);
      toast.success('Status da transação atualizado!');
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao atualizar status.');
      }
    }
  };

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

  // Atualizar filtros só ao clicar em Filtrar
  const handleFilter = () => {
    setSearch(pendingSearch);
    setCategory(pendingCategory);
    setStartDate(pendingStartDate);
    setEndDate(pendingEndDate);
    setCurrentPage(1);
    // O useEffect de fetch por search/category/startDate/endDate já vai rodar
  };

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

  // Filtra as transações com base na visão selecionada
  const visibleTransactions = viewMode === 'real' 
    ? transactions.filter(t => t.paid) 
    : transactions;

  // Cálculos derivados usam 'visibleTransactions'
  const saldo = visibleTransactions.reduce(
    (acc, t) => t.type === 'income' ? acc + t.value : acc - t.value, 
    selectedAccount?.initial_balance || 0
  );
  const receitas = visibleTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.value, 0);
  const despesas = visibleTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.value, 0);
  const gastosPorCategoria = visibleTransactions.filter(t => t.type === 'expense').reduce((acc, t) => {
    let key = '';
    if (typeof t.category === 'string') {
      key = t.category;
    } else if (t.category && typeof t.category === 'object' && 'name' in t.category) {
      key = t.category.name;
    }
    acc[key] = (acc[key] || 0) + t.value;
    return acc;
  }, {} as Record<string, number>);
  
  // Atualiza Gráficos
  useEffect(() => {
    if (transactions.length > 0) {
      // Gráfico de Pizza
      if (pizzaCanvasRef.current) {
        if(pizzaChartRef.current) pizzaChartRef.current.destroy();
        pizzaChartRef.current = new Chart(pizzaCanvasRef.current, {
          type: "pie",
          data: {
            labels: Object.keys(gastosPorCategoria),
            datasets: [{ data: Object.values(gastosPorCategoria), backgroundColor: ["#FFD700", "#222", "#444", "#666", "#888"] }],
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#fff" } } } },
        });
      }
      // Gráfico de Barras (simplificado, apenas para exemplo)
      if (barCanvasRef.current) {
        if(barChartRef.current) barChartRef.current.destroy();
        barChartRef.current = new Chart(barCanvasRef.current, {
            type: "bar",
            data: {
                labels: ["Total"],
                datasets: [
                    { label: "Receitas", data: [receitas], backgroundColor: "#22c55e" },
                    { label: "Despesas", data: [despesas], backgroundColor: "#ef4444" },
                ],
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#fff" } } }, scales: { x: { ticks: { color: "#fff" } }, y: { ticks: { color: "#fff" } } } },
        });
      }
    }
  }, [transactions, gastosPorCategoria, receitas, despesas]);
  
  if (loading && !token) {
    return null; // Evita piscar a tela de login
  }
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-black text-white">Carregando Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-zinc-800">
      <EditTransactionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        transaction={selectedTransactionForEdit}
        onTransactionUpdated={handleTransactionUpdated}
      />
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onTransactionAdded={handleTransactionAdded}
        accountId={selectedAccount?.id ?? null}
      />
      {/* Navbar no topo */}
      <header className="w-full bg-gradient-to-r from-zinc-900 to-zinc-800 px-6 py-3 flex flex-col sm:flex-row items-center justify-between shadow-md sticky top-0 z-20 mb-8">
        <span className="text-xl font-bold text-amber-400">FinanceDash</span>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          {/* SELETOR DE CONTAS */}
          {accounts.length > 0 && selectedAccount && (
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-700 hover:bg-white/20">
                  {selectedAccount.name}
                  <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                </Menu.Button>
              </div>
              <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    {accounts.map((account) => (
                      <Menu.Item key={account.id}>
                        {({ active }) => (
                          <button onClick={() => selectAccount(account)} className={`${active ? 'bg-gray-700' : ''} block w-full text-left px-4 py-2 text-sm text-gray-300`}>
                            {account.name}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                    <div className="border-t border-gray-700 my-1" />
                    <Menu.Item>
                       {({ active }) => (
                         <Link href="/accounts" className={`${active ? 'bg-gray-700' : ''} block px-4 py-2 text-sm text-gray-300`}>
                           Gerenciar Contas
                         </Link>
                       )}
                     </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          )}
          {/* MENU DO USUÁRIO */}
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="inline-flex w-full justify-center gap-x-2 rounded-md bg-amber-400/80 px-4 py-2 text-sm font-semibold text-black shadow-sm hover:bg-amber-400">
                <FaUserCircle className="h-5 w-5" aria-hidden="true" />
                {user?.email}
              </Menu.Button>
            </div>
            <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
              <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button onClick={logout} className={`${active ? 'bg-gray-700' : ''} block w-full text-left px-4 py-2 text-sm text-gray-300`}>
                        Sair
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </header>
      <div className="py-8">
      {/* Container principal centralizado e limitado */}
      <div className="w-full flex flex-col items-center px-2">
        <div className="w-full max-w-2xl">
          {/* Header centralizado e responsivo */}
          <div className="mt-8 mb-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center sm:items-start w-full sm:w-auto">
              <span className="text-lg text-zinc-400">Saldo atual</span>
              <span className="text-3xl font-bold text-amber-400 drop-shadow">{saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <div className="flex flex-row gap-8 w-full sm:w-auto justify-center sm:justify-end">
              <div className="flex flex-col items-center">
                <span className="text-sm text-zinc-400">Receitas</span>
                <span className="text-xl font-semibold text-green-400">{receitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-sm text-zinc-400">Despesas</span>
                <span className="text-xl font-semibold text-red-400">{despesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            </div>
          </div>
          {/* Filtros responsivos */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
              <input
                type="text"
                placeholder="Buscar descrição..."
                value={pendingSearch}
                onChange={e => setPendingSearch(e.target.value)}
                className="px-3 py-2 rounded-md bg-zinc-800 text-white border border-zinc-700 focus:ring-2 focus:ring-amber-400 outline-none w-full sm:w-64 text-sm"
              />
              <input
                type="text"
                placeholder="Filtrar por categoria..."
                value={pendingCategory}
                onChange={e => setPendingCategory(e.target.value)}
                className="px-3 py-2 rounded-md bg-zinc-800 text-white border border-zinc-700 focus:ring-2 focus:ring-amber-400 outline-none w-full sm:w-48 text-sm"
              />
              <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
                <label htmlFor="start-date" className="text-sm text-zinc-300">De:</label>
                <input
                  id="start-date"
                  type="date"
                  value={pendingStartDate}
                  onChange={e => setPendingStartDate(e.target.value)}
                  className="px-3 py-2 rounded-md bg-zinc-800 text-white border border-zinc-700 focus:ring-2 focus:ring-amber-400 outline-none text-sm w-full sm:w-auto"
                />
                <label htmlFor="end-date" className="text-sm text-zinc-300 ml-2">até</label>
                <input
                  id="end-date"
                  type="date"
                  value={pendingEndDate}
                  onChange={e => setPendingEndDate(e.target.value)}
                  className="px-3 py-2 rounded-md bg-zinc-800 text-white border border-zinc-700 focus:ring-2 focus:ring-amber-400 outline-none text-sm w-full sm:w-auto"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <button
                  onClick={handleFilter}
                  className="px-4 py-2 rounded-md bg-amber-400 text-black font-bold shadow hover:bg-amber-500 transition-colors flex items-center gap-2 w-full sm:w-auto text-sm"
                  disabled={loading}
                >
                  {loading ? <Spinner /> : 'Filtrar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingSearch('');
                    setPendingCategory('');
                    setPendingStartDate('');
                    setPendingEndDate('');
                  }}
                  className="px-4 py-2 rounded-md bg-zinc-700 text-white font-bold shadow hover:bg-zinc-600 transition-colors flex items-center gap-2 w-full sm:w-auto text-sm"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
              <button
                onClick={() => setViewMode('real')}
                className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                  viewMode === 'real'
                    ? 'bg-amber-400 text-black shadow'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Real
              </button>
              <button
                onClick={() => setViewMode('previsto')}
                className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                  viewMode === 'previsto'
                    ? 'bg-amber-400 text-black shadow'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Previsto
              </button>
            </div>
          </div>
          {/* Tabela e botão juntos, centralizados */}
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 w-full">
              <h2 className="text-lg font-semibold text-white w-full sm:w-auto text-center sm:text-left">Últimas Transações</h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-6 rounded-lg transition-colors w-full sm:w-auto"
              >
                Adicionar Transação
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-zinc-800 w-full">
              <table className="w-full min-w-[600px] text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-zinc-700 bg-zinc-900">
                    <th className="p-2 sm:p-3 text-zinc-200">Status</th>
                    <th className="p-2 sm:p-3 text-zinc-200">Descrição</th>
                    <th className="p-2 sm:p-3 text-zinc-200">Valor</th>
                    <th className="p-2 sm:p-3 text-zinc-200">Categoria</th>
                    <th className="p-2 sm:p-3 text-zinc-200">Data</th>
                    <th className="p-2 sm:p-3 text-zinc-200 hidden xs:table-cell">Comprovante</th>
                    <th className="p-2 sm:p-3 text-center text-zinc-200 hidden xs:table-cell">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <Spinner />
                        <div className="mt-2 text-zinc-400">Carregando transações...</div>
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-400 text-sm sm:text-base">
                        <div className="flex flex-col items-center gap-3 px-2">
                          <span className="text-4xl sm:text-5xl">🗒️</span>
                          <span className="text-base sm:text-lg font-semibold">Nenhuma transação encontrada</span>
                          <span className="text-xs sm:text-sm text-zinc-500">Tente ajustar os filtros ou adicione uma nova transação!</span>
                          <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="mt-4 px-4 py-2 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-600 transition-colors text-xs sm:text-sm"
                          >
                            Adicionar Transação
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t, idx) => (
                      <tr key={t.id} className={`border-b border-zinc-800 hover:bg-zinc-800/50 ${idx % 2 === 0 ? 'bg-zinc-900/60' : 'bg-zinc-800/40'}`}>
                        <td className="p-2 sm:p-3 text-zinc-100 text-xs sm:text-sm text-center">
                          <div onClick={() => handleTogglePaid(t)} className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer ${t.paid ? 'bg-green-500' : 'bg-zinc-700'}`}> 
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${t.paid ? 'translate-x-5' : 'translate-x-0'}`}></div>
                          </div>
                        </td>
                        <td className="p-2 sm:p-3 text-zinc-100 text-xs sm:text-sm break-words max-w-[120px] sm:max-w-[200px] align-middle">{t.description}</td>
                        <td className={`p-2 sm:p-3 font-bold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'} text-xs sm:text-base align-middle`}>{t.type === 'expense' && '-'} R$ {t.value.toLocaleString('pt-BR')}</td>
                        <td className="p-2 sm:p-3 text-zinc-100 text-xs sm:text-sm align-middle">
                          {(() => {
                            let catName = '';
                            if (isCategoryObject(t.category)) catName = t.category.name;
                            else if (typeof t.category === 'string') catName = t.category;
                            if (catName)
                              return <span className={`inline-block px-2 py-1 rounded text-xs font-semibold shadow-sm ${getCategoryColor(catName)} text-black bg-opacity-80`}>{catName}</span>;
                            return '';
                          })()}
                        </td>
                        <td className="p-2 sm:p-3 text-zinc-100 text-xs sm:text-sm align-middle">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                        <td className="p-2 sm:p-3 hidden xs:table-cell align-middle">
                          {t.proof_url && (
                            <a
                              href={`http://localhost:8000${t.proof_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-400 hover:text-amber-300"
                              data-tooltip-id={`proof-tooltip-${t.id}`}
                              data-tooltip-content="Ver comprovante"
                            >
                              <FaPaperclip size={18} />
                              <Tooltip id={`proof-tooltip-${t.id}`} />
                            </a>
                          )}
                        </td>
                        <td className="p-2 sm:p-3 flex justify-center items-center gap-4 hidden xs:table-cell align-middle">
                          <button
                            onClick={() => {
                              setSelectedTransactionForEdit(t);
                              setIsEditModalOpen(true);
                            }}
                            className="text-blue-400 hover:text-blue-300"
                            data-tooltip-id={`edit-tooltip-${t.id}`}
                            data-tooltip-content="Editar transação"
                          >
                            <FaEdit />
                            <Tooltip id={`edit-tooltip-${t.id}`} />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="text-red-500 hover:text-red-400"
                            data-tooltip-id={`delete-tooltip-${t.id}`}
                            data-tooltip-content="Excluir transação"
                          >
                            <FaTrash />
                            <Tooltip id={`delete-tooltip-${t.id}`} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      </div>
      </div>

      {/* Análise Gráfica - sem card, borda ou sombra */}
      <div className="w-full max-w-4xl mx-auto mt-12">
        <div>
          <h2 className="text-xl font-bold text-amber-400 mb-4 text-center tracking-tight">Análise Gráfica</h2>
          {/* Seleção de período e exportação */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex gap-2 items-center">
              <label htmlFor="start-date" className="text-sm text-zinc-300">De:</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="px-3 py-2 rounded-md bg-zinc-800 text-white border border-zinc-700 focus:ring-2 focus:ring-amber-400 outline-none"
              />
              <label htmlFor="end-date" className="text-sm text-zinc-300 ml-2">até</label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="px-3 py-2 rounded-md bg-zinc-800 text-white border border-zinc-700 focus:ring-2 focus:ring-amber-400 outline-none"
              />
            </div>
            <button
              onClick={() => alert('Exportação de PDF em breve!')}
              className="px-6 py-2 rounded-md bg-amber-400 text-black font-bold shadow hover:bg-amber-500 transition-colors"
            >
              Exportar PDF
            </button>
          </div>
          <div className="flex gap-2 mb-4 justify-center">
            <button
              onClick={() => setChartType('pie')}
              className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                chartType === 'pie'
                  ? 'bg-amber-400 text-black shadow'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              Pizza
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                chartType === 'bar'
                  ? 'bg-amber-400 text-black shadow'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              Barras
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                chartType === 'line'
                  ? 'bg-amber-400 text-black shadow'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              Linha
            </button>
          </div>
          <div className="flex justify-center items-center min-h-[220px]">
            {chartType === 'pie' && (
              <canvas ref={pizzaCanvasRef} style={{ width: '100%', maxWidth: '340px', height: '220px', maxHeight: '220px', display: 'block' }}></canvas>
            )}
            {chartType === 'bar' && (
              <canvas ref={barCanvasRef} style={{ width: '100%', maxWidth: '340px', height: '220px', maxHeight: '220px', display: 'block' }}></canvas>
            )}
            {chartType === 'line' && (
              <span className="text-zinc-400">Gráfico de linha em breve!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}