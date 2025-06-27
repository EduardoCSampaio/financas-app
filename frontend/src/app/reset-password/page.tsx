"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { toast } from "react-toastify";
import { FaLock, FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = "force-dynamic";

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: newPassword });
      toast.success("Senha redefinida com sucesso!");
      router.push("/login");
    } catch {
      toast.error("Erro ao redefinir senha. O link pode estar expirado ou inválido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-2">
      <div className="w-full max-w-md p-4 sm:p-8 bg-white rounded-2xl shadow-xl border border-slate-200">
        <h1 className="apple-title text-center mb-6 text-xl sm:text-2xl">Redefinir Senha</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="newPassword" className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <FaLock className="inline mr-1" /> Nova senha
            </label>
            <input
              id="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-white bg-white/5 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <FaLock className="inline mr-1" /> Confirmar nova senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-white bg-white/5 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 font-semibold text-black bg-amber-400 rounded-md hover:bg-amber-500 transition-colors flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? <span className="loader ml-2 w-4 h-4 border-2 border-t-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span> : "Redefinir senha"}
          </button>
        </form>
        <div className="flex justify-center mt-4">
          <Link href="/login" className="flex items-center text-sm text-zinc-400 hover:text-amber-400 transition-colors">
            <FaArrowLeft className="mr-1" /> Voltar para login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}