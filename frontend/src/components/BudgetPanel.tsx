"use client";
import React, { useEffect, useState } from 'react';
import { useUserCategories } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface Budget {
  id: number;
  category_id: number;
  limit: number;
  month?: string;
}

interface BudgetPanelProps {
  userId: number;
  currentMonth: string;
  expensesByCategory: Record<number, number>; // category_id -> total gasto
}

const BudgetPanel: React.FC<BudgetPanelProps> = ({ userId, currentMonth, expensesByCategory }) => {
  const { categories: userCategories } = useUserCategories();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [editing, setEditing] = useState<{ [catId: number]: boolean }>({});
  const [inputValues, setInputValues] = useState<{ [catId: number]: string }>({});
  const [addingCatId, setAddingCatId] = useState<number | null>(null);
  const [addValue, setAddValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBudgets();
  }, [userId]);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/budgets');
      setBudgets(res.data);
    } catch {}
    setLoading(false);
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
    } catch {}
    setLoading(false);
  };

  const handleDeleteBudget = async (catId: number) => {
    setLoading(true);
    try {
      await api.delete(`/users/budgets/${catId}`);
      await fetchBudgets();
    } catch {}
    setLoading(false);
  };

  const handleAddBudget = async () => {
    if (!addingCatId || !addValue.trim()) return;
    const value = parseFloat(addValue);
    if (isNaN(value) || value < 0) return;
    setLoading(true);
    try {
      await api.post('/users/budgets', {
        category_id: addingCatId,
        limit: value,
        month: currentMonth,
      });
      setAddingCatId(null);
      setAddValue('');
      await fetchBudgets();
    } catch {}
    setLoading(false);
  };

  // Só mostrar categorias que têm orçamento definido
  const budgetedCategories = budgets.map(b => b.category_id);
  const availableCategories = userCategories.filter(cat => !budgetedCategories.includes(cat.id));

  return (
    <div className="apple-card p-6 mb-8">
      <h2 className="apple-subtitle mb-4">Orçamento por Categoria</h2>
      {/* Adicionar nova categoria ao orçamento */}
      {availableCategories.length > 0 && (
        <div className="flex gap-2 mb-6 items-end">
          <select
            value={addingCatId ?? ''}
            onChange={e => setAddingCatId(Number(e.target.value))}
            className="apple-input w-56"
          >
            <option value="">Adicionar categoria ao orçamento</option>
            {availableCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            value={addValue}
            onChange={e => setAddValue(e.target.value)}
            placeholder="Limite (R$)"
            className="apple-input w-32"
            disabled={!addingCatId}
          />
          <button onClick={handleAddBudget} className="apple-btn px-4" disabled={!addingCatId || loading}>Adicionar</button>
        </div>
      )}
      <div className="space-y-4">
        {budgets.map(budget => {
          const cat = userCategories.find(c => c.id === budget.category_id);
          if (!cat) return null;
          const gasto = expensesByCategory[cat.id] || 0;
          const limite = budget.limit ?? 0;
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
                    <button onClick={() => setEditing((prev) => ({ ...prev, [cat.id]: false }))} className="text-slate-400 hover:text-slate-600 text-xs">Cancelar</button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <span className="text-lg font-semibold text-indigo-600">R$ {limite.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <button onClick={() => handleEdit(cat.id, limite)} className="apple-btn-secondary px-3 py-1 text-sm">Editar</button>
                    <button onClick={() => handleDeleteBudget(cat.id)} className="text-red-500 hover:underline text-xs">Remover</button>
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
        {budgets.length === 0 && (
          <div className="text-slate-400 text-center py-8">Nenhuma categoria com orçamento definido.</div>
        )}
      </div>
    </div>
  );
};

export default BudgetPanel; 