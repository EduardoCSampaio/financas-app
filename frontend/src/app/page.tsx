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
import { Transaction } from '@/types';

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

  // Refs para os gráficos
  const pizzaChartRef = useRef<Chart | null>(null);
  const barChartRef = useRef<Chart | null>(null);
  const pizzaCanvasRef = useRef<HTMLCanvasElement>(null);
  const barCanvasRef = useRef<HTMLCanvasElement>(null);

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

  // Resetar a página para 1 quando os filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [search, category]);

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
      {/* Header com saldo e totais - agora sem card, borda ou sombra */}
      <div className="w-full max-w-4xl mx-auto mt-8 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-start">
          <span className="text-lg text-zinc-400">Saldo atual</span>
          <span className="text-3xl font-bold text-amber-400 drop-shadow">{saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
        <div className="flex gap-6">
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
      {/* Barra de filtros e botões "Previsto/Real" - sem card */}
      <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar descrição..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 rounded-md bg-zinc-800 text-white border border-zinc-700 focus:ring-2 focus:ring-amber-400 outline-none w-full md:w-64"
          />
          <input
            type="text"
            placeholder="Filtrar por categoria..."
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="px-3 py-2 rounded-md bg-zinc-800 text-white border border-zinc-700 focus:ring-2 focus:ring-amber-400 outline-none w-full md:w-48"
          />
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
            <button
              onClick={() => debouncedFetch(selectedAccount, search, category, 1, itemsPerPage, startDate, endDate)}
              className="ml-2 px-4 py-2 rounded-md bg-amber-400 text-black font-bold shadow hover:bg-amber-500 transition-colors flex items-center gap-2"
              disabled={loading}
            >
              {loading ? <Spinner /> : 'Filtrar'}
            </button>
          </div>
        </div>
        {/* Botões Previsto/Real */}
        <div className="flex gap-2 w-full md:w-auto justify-end">
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
      {/* Tabela de Transações - sem card, borda ou sombra */}
      <main className="p-4 sm:p-6 lg:p-8">
        {!selectedAccount && !loading && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-white">Nenhuma conta encontrada</h2>
            <p className="text-gray-400 mt-2">Vá para a página de gerenciamento para criar sua primeira conta.</p>
            <Link href="/accounts">
               <button className="mt-6 px-5 py-2.5 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-600 transition-colors">
                Gerenciar Contas
              </button>
            </Link>
          </div>
        )}

        {selectedAccount && (
          <>
            <section className="w-full max-w-4xl mx-auto mb-8">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">Últimas Transações</h2>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    Adicionar Transação
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-zinc-700">
                        <th className="p-2 text-zinc-200">Status</th>
                        <th className="p-2 text-zinc-200">Descrição</th>
                        <th className="p-2 text-zinc-200">Valor</th>
                        <th className="p-2 text-zinc-200">Categoria</th>
                        <th className="p-2 text-zinc-200">Data</th>
                        <th className="p-2 text-zinc-200">Comprovante</th>
                        <th className="p-2 text-center text-zinc-200">Ações</th>
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
                          <td colSpan={7} className="py-12 text-center text-zinc-400">
                            <div className="flex flex-col items-center gap-3">
                              <span className="text-5xl">🗒️</span>
                              <span className="text-lg font-semibold">Nenhuma transação encontrada</span>
                              <span className="text-sm text-zinc-500">Comece adicionando sua primeira transação!</span>
                              <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="mt-4 px-5 py-2 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-600 transition-colors"
                              >
                                Adicionar Transação
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        transactions.map(t => (
                          <tr key={t.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                            <td className="p-2">
                              <div onClick={() => handleTogglePaid(t)} className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${t.paid ? 'bg-green-500' : 'bg-zinc-700'}`}> 
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${t.paid ? 'translate-x-6' : 'translate-x-0'}`}></div>
                              </div>
                            </td>
                            <td className="p-2 text-zinc-100">{t.description}</td>
                            <td className={`p-2 font-semibold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>{t.type === 'expense' && '-'} R$ {t.value.toLocaleString('pt-BR')}</td>
                            <td className="p-2 text-zinc-100">
                              {isCategoryObject(t.category)
                                ? t.category.name
                                : typeof t.category === 'string'
                                  ? t.category
                                  : ''}
                            </td>
                            <td className="p-2 text-zinc-100">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                            <td className="p-2">
                              {t.proof_url && (
                                <a href={`http://localhost:8000${t.proof_url}`} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300">
                                  <FaPaperclip size={18} />
                                </a>
                              )}
                            </td>
                            <td className="p-2 flex justify-center items-center gap-4">
                              <button onClick={() => handleTransactionUpdated({ ...t, description: '' })} className="text-blue-400 hover:text-blue-300"><FaEdit /></button>
                              <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-400"><FaTrash /></button>
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
            </section>
          </>
        )}
      </main>
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