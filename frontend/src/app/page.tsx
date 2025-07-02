"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from 'next/navigation';
import { useAuth, useUserCategories } from '@/contexts/AuthContext';
import { FaEdit, FaTrash, FaChevronDown, FaFileAlt, FaExternalLinkAlt } from 'react-icons/fa';
import debounce from 'lodash.debounce';
import Pagination from "@/components/Pagination";
import { toast } from 'react-toastify';
import api from "@/lib/api"; // Importando o cliente API
import AddTransactionModal from '@/components/AddTransactionModal';
import EditTransactionModal from '@/components/EditTransactionModal';
import { Transaction, Category } from '@/types';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, CartesianGrid, XAxis, YAxis, Line } from 'recharts';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const colors = [
  '#6366f1', // Indigo
  '#22d3ee', // Cyan
  '#f59e42', // Amber
  '#a21caf', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#06d6a0', // Green
  '#84cc16', // Lime
  '#fb923c', // Orange
  '#14b8a6', // Teal
];

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
// Função utilitária para calcular diferença de dias
function daysUntil(dateStr: string) {
  const today = new Date();
  const date = new Date(dateStr);
  const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function DashboardPage() {
  const { 
    token, 
    user, 
    accounts: authAccounts, 
    selectedAccount, 
    selectAccount,
    fetchAccounts,
  } = useAuth();
  const router = useRouter();
  const { categories: userCategories } = useUserCategories();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransactionForEdit, setSelectedTransactionForEdit] = useState<Transaction | null>(null);
  const [filterText, setFilterText] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const nowDate = useMemo(() => new Date(), []);

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
    } else if (token && authAccounts.length === 0) {
      setLoading(false);
      setTransactions([]);
    } else if (!token) {
      router.push('/login');
    }
  }, [token, selectedAccount, filterText, filterCategory, currentPage, itemsPerPage, router, debouncedFetch, authAccounts, filterStartDate, filterEndDate, filterType, filterStatus]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [txRes, catRes] = await Promise.all([
          api.get('/transactions/'),
          api.get('/categories/'),
        ]);
        setTransactions(txRes.data);
        setCategories(catRes.data);
      } catch {
        // Trate erros conforme necessário
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Cálculos dinâmicos
  const saldoAtual =
    (selectedAccount?.initial_balance || 0) +
    transactions
      .filter(t => t.paid && t.account_id === selectedAccount?.id)
      .reduce((acc, t) => acc + (t.type === 'income' ? Number(t.value) : -Number(t.value)), 0);
  const receitas = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.value), 0);
  const despesas = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.value), 0);

  // Gráfico de pizza: gastos por categoria
  const pieData = (categories as Category[]).map((cat: Category) => ({
    name: cat.name,
    value: transactions.filter(t => t.type === 'expense' && t.category_id === cat.id).reduce((acc, t) => acc + Number(t.value), 0)
  })).filter(c => c.value > 0);

  // Gráfico de linha: evolução do saldo (simples, por mês)
  const saldoPorMes: Record<string, number> = {};
  transactions.forEach(t => {
    const mes = new Date(t.date).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
    if (!saldoPorMes[mes]) saldoPorMes[mes] = 0;
    saldoPorMes[mes] += t.type === 'income' ? Number(t.value) : -Number(t.value);
  });
  const lineData = Object.entries(saldoPorMes).map(([month, saldo]) => ({ month, saldo }));

  // Cálculo de tendências reais mês a mês
  function getMonthYear(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  const currentMonth = getMonthYear(nowDate);
  const prevMonthDate = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1);
  const prevMonth = getMonthYear(prevMonthDate);

  // Filtrar transações do mês atual e anterior
  const txCurrentMonth = transactions.filter(t => getMonthYear(new Date(t.date)) === currentMonth);
  const txPrevMonth = transactions.filter(t => getMonthYear(new Date(t.date)) === prevMonth);

  const saldoAtualMes = txCurrentMonth.reduce((acc, t) => acc + (t.type === 'income' ? Number(t.value) : -Number(t.value)), 0);
  const saldoPrevMes = txPrevMonth.reduce((acc, t) => acc + (t.type === 'income' ? Number(t.value) : -Number(t.value)), 0);
  const receitasAtualMes = txCurrentMonth.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.value), 0);
  const receitasPrevMes = txPrevMonth.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.value), 0);
  const despesasAtualMes = txCurrentMonth.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.value), 0);
  const despesasPrevMes = txPrevMonth.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.value), 0);

  // Tendências em porcentagem
  function calcTrend(current: number, prev: number) {
    if (prev === 0) return current === 0 ? 0 : 100;
    return ((current - prev) / Math.abs(prev)) * 100;
  }
  const saldoTrend = calcTrend(saldoAtualMes, saldoPrevMes);
  const receitasTrend = calcTrend(receitasAtualMes, receitasPrevMes);
  const despesasTrend = calcTrend(despesasAtualMes, despesasPrevMes);

  // Variáveis para alertas reais (a lógica será implementada em seguida)
  // let alertOrcamento = null;
  // let alertSaldoBaixo = null;

  useEffect(() => {
    if (!loading && categories.length > 0 && transactions.length > 0 && userCategories.length > 0) {
      // Alerta de orçamento por categoria
      userCategories.forEach(cat => {
        const limite = cat.limit || 0;
        if (limite > 0) {
          // Gasto no mês nesta categoria
          const gasto = transactions.filter(t => t.type === 'expense' && t.category_id === cat.id && new Date(t.date).getMonth() === nowDate.getMonth() && new Date(t.date).getFullYear() === nowDate.getFullYear()).reduce((acc, t) => acc + Number(t.value), 0);
          if (gasto >= 0.8 * limite && gasto < limite) {
            toast.warn(`Atenção: Você já gastou ${Math.round((gasto/limite)*100)}% do orçamento da categoria "${cat.name}" este mês!`);
          } else if (gasto >= limite) {
            toast.error(`Limite de orçamento da categoria "${cat.name}" ULTRAPASSADO!`);
          }
        }
      });
      // Alerta de saldo baixo
      if (selectedAccount && selectedAccount.initial_balance < 100) {
        toast.error('Atenção: Saldo da conta está abaixo de R$ 100,00!');
      }
    }
  }, [loading, categories, transactions, userCategories, selectedAccount, nowDate]);

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

  // Calcular gastos do mês atual por categoria
  const firstDay = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
  const lastDay = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0);
  const expensesByCategory: Record<number, number> = {};
  transactions.forEach(t => {
    if (
      t.type === 'expense' &&
      t.category &&
      typeof t.category === 'object' &&
      (t.category as { id?: number }).id
    ) {
      const date = new Date(t.date);
      if (date >= firstDay && date <= lastDay) {
        const catId = (t.category as { id: number }).id;
        expensesByCategory[catId] = (expensesByCategory[catId] || 0) + t.value;
      }
    }
  });

  // Função para exportar CSV melhorada (padrão Brasil/Excel)
  function exportCSV() {
    const headers = [
      'Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status', 'Comprovante'
    ];
    const rows = transactions.map(t => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      t.description?.replace(/\r?\n|\r/g, ' ') ?? '',
      isCategoryObject(t.category) ? t.category.name : '',
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.value.toFixed(2).replace('.', ','),
      t.paid ? 'Pago' : 'Pendente',
      t.proof_url || ''
    ]);
    // CSV com BOM para Excel, separador ponto e vírgula, sem aspas exceto se necessário
    const csv = [
      '\uFEFF' + headers.join(';'),
      ...rows.map(row =>
        row.map(field => {
          if (typeof field === 'string' && (field.includes(';') || field.includes('"') || field.includes('\n'))) {
            return '"' + field.replace(/"/g, '""') + '"';
          }
          return field;
        }).join(';')
      )
    ].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'transacoes.csv');
  }

  // Notificações automáticas de boletos próximos do vencimento
  const boletosAVencer = transactions.filter(t =>
    t.type === 'expense' &&
    t.date &&
    daysUntil(t.date) >= 0 && daysUntil(t.date) <= 3 &&
    (!t.paid)
  );
  const boletoNotifications = boletosAVencer.map(t => ({
    id: `boleto-${t.id}`,
    type: 'warning',
    message: `Boleto de R$ ${Number(t.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} vence em ${daysUntil(t.date)} dia(s): ${t.description}`
  }));

  // Notificações de orçamento e saldo baixo
  const orcamentoNotifications = userCategories.flatMap(cat => {
    const limite = cat.limit || 0;
    if (limite > 0) {
      const gasto = transactions.filter(t => t.type === 'expense' && t.category_id === cat.id && new Date(t.date).getMonth() === nowDate.getMonth() && new Date(t.date).getFullYear() === nowDate.getFullYear()).reduce((acc, t) => acc + Number(t.value), 0);
      if (gasto >= 0.8 * limite && gasto < limite) {
        return [{
          id: `orcamento-${cat.id}`,
          type: 'warning',
          message: `Atenção: Você já gastou ${Math.round((gasto/limite)*100)}% do orçamento da categoria "${cat.name}" este mês!`
        }];
      } else if (gasto >= limite) {
        return [{
          id: `orcamento-${cat.id}`,
          type: 'error',
          message: `Limite de orçamento da categoria "${cat.name}" ULTRAPASSADO!`
        }];
      }
    }
    return [];
  });

  const saldoNotifications = selectedAccount && selectedAccount.initial_balance < 100 ? [{
    id: 'saldo-baixo',
    type: 'error',
    message: 'Atenção: Saldo da conta está abaixo de R$ 100,00!'
  }] : [];

  // Notificações finais
  const allNotifications = [
    ...boletoNotifications,
    ...orcamentoNotifications,
    ...saldoNotifications
  ];

  function exportPDF() {
    if (!transactions || transactions.length === 0) {
      alert("Não há transações para exportar.");
      return;
    }
    const doc = new jsPDF();
    const now = new Date();
    const period = (filterStartDate && filterEndDate)
      ? `Período: ${new Date(filterStartDate).toLocaleDateString('pt-BR')} a ${new Date(filterEndDate).toLocaleDateString('pt-BR')}`
      : 'Todas as datas';
    doc.setFontSize(16);
    doc.text('Relatório de Transações', 14, 18);
    doc.setFontSize(10);
    doc.text(`Usuário: ${user?.name || user?.email || ''}`, 14, 26);
    doc.text(period, 14, 32);
    doc.text(`Exportado em: ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`, 14, 38);

    const headers = [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status']];
    const rows = transactions.map(t => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      t.description?.replace(/\r?\n|\r/g, ' ') ?? '',
      isCategoryObject(t.category) ? t.category.name : '',
      t.type === 'income' ? 'Receita' : 'Despesa',
      `R$ ${t.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      t.paid ? 'Pago' : 'Pendente',
    ]);
    // @ts-expect-error jsPDF types do not include autoTable plugin
    doc.autoTable({ head: headers, body: rows, startY: 44 });
    const finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 44;
    doc.setFontSize(12);
    doc.text(`Receitas: R$ ${receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, finalY + 10);
    doc.text(`Despesas: R$ ${despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, finalY + 16);
    doc.text(`Saldo: R$ ${saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, finalY + 22);
    doc.save('relatorio-transacoes.pdf');
  }

  if (loading) {
    return <div className="w-full flex justify-center items-center py-20 text-xl text-indigo-600">Carregando dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header com saudação e seletor de contas */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="apple-title text-2xl sm:text-3xl">
            Olá, {user?.name || user?.email || 'Usuário'}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 mt-1">
            Bem-vindo ao seu dashboard premium
          </p>
        </div>
        
        {/* Seletor de contas */}
        {authAccounts.length > 0 && (
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
                  {authAccounts.map((account) => (
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

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="apple-card">
          <div className="text-slate-600 font-medium mb-2">Saldo Atual</div>
          <div className="text-3xl font-bold text-slate-800 mb-1">
            R$ {saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
        <div className="lg:col-span-2 apple-card p-2 sm:p-6">
          <div className="apple-subtitle mb-4 sm:mb-6">Transações Recentes</div>
          
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
                {userCategories.map(cat => (
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
            <button onClick={exportCSV} className="apple-btn-secondary px-4 py-2 text-sm mr-2">Exportar CSV</button>
            <button onClick={exportPDF} className="apple-btn-secondary px-4 py-2 text-sm">Exportar PDF</button>
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
              <table className="w-full min-w-[600px] sm:min-w-0 text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 px-2 sm:py-3 sm:px-4 text-slate-600 font-semibold">Data</th>
                    <th className="py-2 px-2 sm:py-3 sm:px-4 text-slate-600 font-semibold">Descrição</th>
                    <th className="py-2 px-2 sm:py-3 sm:px-4 text-slate-600 font-semibold hidden xs:table-cell">Categoria</th>
                    <th className="py-2 px-2 sm:py-3 sm:px-4 text-slate-600 font-semibold">Valor</th>
                    <th className="py-2 px-2 sm:py-3 sm:px-4 text-slate-600 font-semibold hidden md:table-cell">Comprovante</th>
                    <th className="py-2 px-2 sm:py-3 sm:px-4 text-slate-600 font-semibold hidden md:table-cell">Status</th>
                    <th className="py-2 px-2 sm:py-3 sm:px-4 text-slate-600 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-slate-700 whitespace-nowrap">
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-slate-800 font-medium">
                        {transaction.description}
                      </td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-slate-700 hidden xs:table-cell">
                        {isCategoryObject(transaction.category) ? (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getCategoryColor(transaction.category.name)}`}>
                            {transaction.category.name}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className={`py-2 px-2 sm:py-3 sm:px-4 font-semibold ${transaction.type === 'income' ? 'amount-positive' : 'amount-negative'}`}>
                        {transaction.type === 'income' ? '+' : '-'}R$ {transaction.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 hidden md:table-cell">
                        {transaction.proof_url ? (
                          <a href={transaction.proof_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:underline">
                            <FaFileAlt className="inline-block" />
                            <FaExternalLinkAlt className="inline-block text-xs" />
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 hidden md:table-cell">
                        {transaction.paid ? (
                          <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Pago</span>
                        ) : (
                          <button
                            className="apple-btn-secondary px-2 py-1 text-xs"
                            title="Marcar como pago"
                            onClick={async () => {
                              try {
                                await api.patch(`/transactions/${transaction.id}`, { paid: true });
                                setTransactions(prev => prev.map(tx => tx.id === transaction.id ? { ...tx, paid: true } : tx));
                                toast.success('Transação marcada como paga!');
                              } catch {
                                toast.error('Erro ao marcar como paga.');
                              }
                            }}
                          >
                            Marcar como pago
                          </button>
                        )}
                      </td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4">
                        <div className="flex gap-2 flex-wrap">
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
        <div className="apple-card mt-8 lg:mt-0">
          <div className="apple-subtitle mb-4 sm:mb-6">Resumo Gráfico</div>
          <div className="w-full h-64 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                </PieChart>
              </ResponsiveContainer>
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

      {/* Cards de destaque */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 rounded-2xl shadow p-6 flex flex-col items-center">
          <span className="text-xs text-slate-500 mb-1">Saldo Atual</span>
          <span className="text-3xl font-black text-indigo-600">R$ {saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="bg-white/80 rounded-2xl shadow p-6 flex flex-col items-center">
          <span className="text-xs text-slate-500 mb-1">Gastos do mês</span>
          <span className="text-3xl font-black text-rose-500">R$ {despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="bg-white/80 rounded-2xl shadow p-6 flex flex-col items-center">
          <span className="text-xs text-slate-500 mb-1">Receitas do mês</span>
          <span className="text-3xl font-black text-emerald-500">R$ {receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/80 rounded-2xl shadow p-6">
          <h2 className="text-lg font-bold text-indigo-600 mb-4">Gastos por Categoria</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {categories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white/80 rounded-2xl shadow p-6">
          <h2 className="text-lg font-bold text-indigo-600 mb-4">Evolução do Saldo</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={lineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
              <Line type="monotone" dataKey="saldo" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Central de notificações */}
      <div className="bg-white/80 rounded-2xl shadow p-6 mb-4">
        <h2 className="text-lg font-bold text-indigo-600 mb-4">Notificações</h2>
        <ul className="flex flex-col gap-2">
          {allNotifications.length === 0 && (
            <li className="text-slate-500 text-sm">Nenhuma notificação no momento.</li>
          )}
          {allNotifications.map(n => (
            <li key={n.id} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${n.type === 'warning' ? 'bg-yellow-100 text-yellow-800' : n.type === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
              {n.type === 'warning' && <span className="text-lg">⚠️</span>}
              {n.type === 'error' && <span className="text-lg">❗</span>}
              {n.type === 'info' && <span className="text-lg">ℹ️</span>}
              {n.message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}