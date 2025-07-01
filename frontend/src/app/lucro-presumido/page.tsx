"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Transaction } from "@/types";
import api from "@/lib/api";

export default function LucroPresumidoPage() {
  const { selectedAccount } = useAuth();
  const [data, setData] = useState<string>(new Date().toISOString().slice(0, 10));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTransactions = useCallback(async () => {
    if (!selectedAccount) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/transactions/", {
        params: {
          account_id: selectedAccount.id,
          end_date: data,
          page: 1,
          limit: 100
        }
      });
      setTransactions(res.data.items || res.data);
    } catch {
      setError("Erro ao buscar transações.");
    } finally {
      setLoading(false);
    }
  }, [selectedAccount, data]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Cálculo do saldo presumido
  const receitas = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + Number(t.value), 0);
  const despesas = transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + Number(t.value), 0);
  const saldoAtual = selectedAccount?.initial_balance || 0;
  const saldoProjetado = saldoAtual + receitas - despesas;

  return (
    <div className="max-w-2xl mx-auto bg-white/80 rounded-2xl shadow p-8 mt-8">
      <h1 className="text-2xl font-bold text-indigo-700 mb-6">Lucro Presumido</h1>
      <div className="flex flex-col sm:flex-row gap-4 items-end mb-8">
        <div className="flex flex-col">
          <label className="text-xs text-slate-600 mb-1">Data de projeção</label>
          <input type="date" value={data} onChange={e => setData(e.target.value)} className="apple-input w-48" />
        </div>
      </div>
      {loading ? (
        <div className="text-indigo-600">Carregando...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Saldo atual da conta:</span>
            <span className="text-lg font-semibold text-indigo-600">R$ {saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Saldo projetado em <b>{new Date(data).toLocaleDateString('pt-BR')}</b>:</span>
            <span className="text-2xl font-bold text-indigo-700">R$ {saldoProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Receitas até a data:</span>
            <span className="text-lg font-semibold text-emerald-600">R$ {receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Despesas até a data:</span>
            <span className="text-lg font-semibold text-rose-600">R$ {despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center border-t pt-4 mt-4">
            <span className="text-slate-700 font-semibold">Livre:</span>
            <span className="text-xl font-bold text-blue-700">R$ {saldoProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}
    </div>
  );
} 