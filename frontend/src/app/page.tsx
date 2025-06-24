"use client";
import { useEffect, useRef, useState, useCallback, Fragment } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Chart from 'chart.js/auto';
import AddTransactionModal from "@/components/AddTransactionModal";
import EditTransactionModal from "@/components/EditTransactionModal";
import { FaEdit, FaTrash, FaUserCircle, FaPaperclip } from 'react-icons/fa';
import debounce from 'lodash.debounce';
import Pagination from "@/components/Pagination";
import { toast } from 'react-toastify';
import { Menu, Transition } from '@headlessui/react';
import Link from "next/link";
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import api from "@/lib/api"; // Importando o cliente API

// Tipagem para as transações
interface Transaction {
  id: number;
  description: string;
  value: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  paid: boolean;
  account_id: number;
  proof_url?: string | null;
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [viewMode, setViewMode] = useState<'real' | 'previsto'>('real');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10); // Remover setItemsPerPage se não for usado

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

  const openEditModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
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
    debounce(async (currentAccount, currentSearch, currentCategory, page, limit) => {
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
      debouncedFetch(selectedAccount, search, category, currentPage, itemsPerPage);
    } else if (token && accounts.length === 0) {
      setLoading(false);
      setTransactions([]);
    } else if (!token) {
      router.push('/login');
    }
  }, [token, selectedAccount, search, category, currentPage, itemsPerPage, router, debouncedFetch, accounts]);

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
      acc[t.category] = (acc[t.category] || 0) + t.value;
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
          options: { plugins: { legend: { labels: { color: "#fff" } } } },
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
            options: { plugins: { legend: { labels: { color: "#fff" } } }, scales: { x: { ticks: { color: "#fff" } }, y: { ticks: { color: "#fff" } } } },
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
    <div className="min-h-screen bg-black text-white">
      {/* Modais */}
      {selectedAccount && (
        <AddTransactionModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          onTransactionAdded={handleTransactionAdded}
          accountId={selectedAccount.id} 
        />
      )}
      <EditTransactionModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} transaction={selectedTransaction} onTransactionUpdated={handleTransactionUpdated} />

      <header className="bg-gray-900/50 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-xl font-bold text-amber-400">Finance<span className="text-white">Dash</span></h1>
        
        <div className="flex items-center gap-4">
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

      <main className="p-4 sm:p-6 lg:p-8">
        {!selectedAccount && !loading && (
          <div className="text-center py-20 bg-gray-900/50 rounded-lg">
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
            {/* Seletor de Visão */}
            <div className="mb-8 flex justify-center items-center gap-4">
                <span className={`cursor-pointer p-2 rounded-md ${viewMode === 'previsto' ? 'bg-zinc-700' : ''}`} onClick={() => setViewMode('previsto')}>Previsto</span>
                <div onClick={() => setViewMode(viewMode === 'real' ? 'previsto' : 'real')} className="w-14 h-7 flex items-center bg-zinc-700 rounded-full p-1 cursor-pointer">
                    <div className={`bg-amber-400 w-5 h-5 rounded-full shadow-md transform duration-300 ease-in-out ${viewMode === 'real' ? 'translate-x-0' : 'translate-x-7'}`}></div>
                </div>
                <span className={`cursor-pointer p-2 rounded-md ${viewMode === 'real' ? 'bg-zinc-700' : ''}`} onClick={() => setViewMode('real')}>Real</span>
            </div>
            
            {/* Filtros */}
            <section className="mb-8 p-6 backdrop-blur-lg bg-white/10 border border-zinc-700 rounded-2xl shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="search" className="text-sm font-medium text-zinc-400">Buscar por Descrição</label>
                        <input 
                            id="search" 
                            type="text" 
                            value={search} 
                            onChange={(e) => setSearch(e.target.value)} 
                            placeholder="Ex: iFood, Salário..."
                            className="w-full mt-1 input-style"
                        />
                    </div>
                    <div>
                        <label htmlFor="category-filter" className="text-sm font-medium text-zinc-400">Filtrar por Categoria</label>
                        <input 
                            id="category-filter" 
                            type="text" 
                            value={category} 
                            onChange={(e) => setCategory(e.target.value)} 
                            placeholder="Ex: Lazer, Alimentação..."
                            className="w-full mt-1 input-style"
                        />
                    </div>
                </div>
            </section>
            
            {/* Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              <div className="backdrop-blur-lg bg-white/10 border border-zinc-700 rounded-2xl shadow-lg p-6 flex flex-col items-center">
                <span className="text-zinc-400">Saldo</span>
                <span className="text-2xl font-semibold text-amber-400">R$ {saldo.toLocaleString("pt-BR")}</span>
              </div>
              <div className="backdrop-blur-lg bg-white/10 border border-zinc-700 rounded-2xl shadow-lg p-6 flex flex-col items-center">
                <span className="text-zinc-400">Receitas</span>
                <span className="text-2xl font-semibold text-green-400">R$ {receitas.toLocaleString("pt-BR")}</span>
              </div>
              <div className="backdrop-blur-lg bg-white/10 border border-zinc-700 rounded-2xl shadow-lg p-6 flex flex-col items-center">
                <span className="text-zinc-400">Despesas</span>
                <span className="text-2xl font-semibold text-red-400">R$ {despesas.toLocaleString("pt-BR")}</span>
              </div>
            </section>
            
            {/* Gráficos e Tabela */}
            <section className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Gráfico de Pizza */}
                <div className="backdrop-blur-lg bg-white/10 border border-zinc-700 rounded-2xl shadow-lg p-6">
                  <h2 className="text-lg font-semibold mb-4 text-white">Gastos por Categoria</h2>
                  <canvas ref={pizzaCanvasRef} height={250}></canvas>
                </div>
              </div>
              <div className="lg:col-span-3">
                 {/* Tabela de Transações */}
                <div className="backdrop-blur-lg bg-white/10 border border-zinc-700 rounded-2xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-white">Últimas Transações</h2>
                      <button 
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
                                    <th className="p-2">Status</th>
                                    <th className="p-2">Descrição</th>
                                    <th className="p-2">Valor</th>
                                    <th className="p-2">Categoria</th>
                                    <th className="p-2">Data</th>
                                    <th className="p-2">Comprovante</th>
                                    <th className="p-2 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(t => (
                                    <tr key={t.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                                        <td className="p-2">
                                          <div onClick={() => handleTogglePaid(t)} className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${t.paid ? 'bg-green-500' : 'bg-zinc-700'}`}>
                                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${t.paid ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                          </div>
                                        </td>
                                        <td className="p-2">{t.description}</td>
                                        <td className={`p-2 font-semibold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                          {t.type === 'expense' && '-'} R$ {t.value.toLocaleString('pt-BR')}
                                        </td>
                                        <td className="p-2">{t.category}</td>
                                        <td className="p-2">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                                        <td className="p-2">
                                          {t.proof_url && (
                                            <a href={`http://localhost:8000${t.proof_url}`} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300">
                                              <FaPaperclip size={18} />
                                            </a>
                                          )}
                                        </td>
                                        <td className="p-2 flex justify-center items-center gap-4">
                                            <button onClick={() => openEditModal(t)} className="text-blue-400 hover:text-blue-300"><FaEdit /></button>
                                            <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-400"><FaTrash /></button>
                                        </td>
                                    </tr>
                                ))}
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
            </section>
          </>
        )}
      </main>
    </div>
  );
}
