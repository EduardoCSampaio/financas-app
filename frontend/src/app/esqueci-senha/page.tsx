"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "react-toastify";
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("Se o e-mail existir, um link de redefinição foi enviado!");
      router.push("/login");
    } catch {
      toast.error("Erro ao solicitar redefinição de senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md p-6 sm:p-10 bg-white/80 backdrop-blur-md rounded-3xl shadow-lg flex flex-col items-center">
        <h1 className="text-center mb-8 text-lg sm:text-2xl font-semibold text-slate-800">Recuperar Senha</h1>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-600 mb-2 flex items-center gap-2">
              <FaEnvelope className="inline mr-1" /> E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-base shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold text-base py-3 shadow-md hover:from-indigo-700 hover:to-blue-600 transition-all duration-150 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? <span className="loader ml-2 w-4 h-4 border-2 border-t-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span> : "Enviar link de redefinição"}
          </button>
        </form>
        <div className="flex justify-center mt-8 w-full">
          <Link href="/login" className="flex items-center text-sm text-slate-500 hover:text-indigo-600 transition-colors">
            <FaArrowLeft className="mr-2" /> Voltar para login
          </Link>
        </div>
      </div>
    </div>
  );
} 