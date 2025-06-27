import React, { useEffect, useState } from 'react';
import { useCategories } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface Budget {
  id: number;
  category_id: number;
  limit: number;
  month?: string;
}

interface Category {
  id: number;
  name: string;
}

interface BudgetPanelProps {
  userId: number;
  currentMonth: string;
  expensesByCategory: Record<number, number>; // category_id -> total gasto
}

const BudgetPanel: React.FC<BudgetPanelProps> = ({ userId, currentMonth, expensesByCategory }) => {
  const { categories } = useCategories();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [editing, setEditing] = useState<{ [catId: number]: boolean }>({});
  const [inputValues, setInputValues] = useState<{ [catId: number]: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBudgets();
  }, [userId]);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/budgets');
      setBudgets(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (catId: number, currentLimit: number) => {
    setEditing((prev) => ({ ...prev, [catId]: true }));
    setInputValues((prev) => ({ ...prev, [catId]: String(currentLimit ?? '') }));
  };

  const handleSave = async (catId: number) => {
    const value = parseFloat(inputValues[catId]);
    if (isNaN(value) || value < 0) return;
    setLoading(true);
    try {
      await api.post('/users/budgets', {
        category_id: catId,
        limit: value,
        month: currentMonth,
      });
      await fetchBudgets();
      setEditing((prev) => ({ ...prev, [catId]: false }));
    } finally {
      setLoading(false);
    }
  };

  const getBudgetForCategory = (catId: number) =>
    budgets.find((b) => b.category_id === catId && (!b.month || b.month === currentMonth));

  return (
    <div className="apple-card p-6 mb-8">
      <h2 className="apple-subtitle mb-4">Orçamento por Categoria</h2>
      <div className="space-y-4">
        {categories.map((cat) => {
          const budget = getBudgetForCategory(cat.id);
          const gasto = expensesByCategory[cat.id] || 0;
          const limite = budget?.limit ?? 0;
          const percent = limite > 0 ? Math.min(100, Math.round((gasto / limite) * 100)) : 0;
          return (
            <div key={cat.id} className="flex items-center gap-4 border-b border-slate-100 pb-3 last:border-b-0">
              <div className="flex-1">
                <div className="font-medium text-slate-800">{cat.name}</div>
                <div className="text-xs text-slate-500 mb-1">Limite mensal</div>
                {editing[cat.id] ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min={0}
                      value={inputValues[cat.id]}
                      onChange={e => setInputValues(v => ({ ...v, [cat.id]: e.target.value }))}
                      className="apple-input w-24"
                    />
                    <button onClick={() => handleSave(cat.id)} className="apple-btn px-3 py-1 text-sm">Salvar</button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <span className="text-lg font-semibold text-indigo-600">R$ {limite.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <button onClick={() => handleEdit(cat.id, limite)} className="text-xs text-indigo-500 hover:underline">Editar</button>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end min-w-[120px]">
                <div className="text-xs text-slate-500 mb-1">Gasto no mês</div>
                <span className="text-lg font-semibold text-slate-800">R$ {gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                {limite > 0 && (
                  <div className="w-28 h-2 bg-slate-200 rounded-full mt-2">
                    <div
                      className={`h-2 rounded-full ${percent < 80 ? 'bg-indigo-500' : percent < 100 ? 'bg-amber-400' : 'bg-red-500'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )}
                {limite > 0 && percent >= 80 && (
                  <div className={`text-xs mt-1 font-semibold ${percent < 100 ? 'text-amber-500' : 'text-red-500'}`}>
                    {percent < 100 ? 'Atenção: perto do limite!' : 'Limite ultrapassado!'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetPanel; 