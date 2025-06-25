"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "react-toastify";
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';
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
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-black via-zinc-900 to-zinc-800">
      <div className="w-full max-w-md p-8 space-y-8 backdrop-blur-lg bg-white/10 border border-zinc-700 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-center text-white drop-shadow-lg">
          <FaEnvelope className="inline mb-1 mr-2 text-amber-400" /> Esqueci minha senha
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <FaEnvelope className="inline mr-1" /> E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-white bg-white/5 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 font-semibold text-black bg-amber-400 rounded-md hover:bg-amber-500 transition-colors flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? <span className="loader ml-2 w-4 h-4 border-2 border-t-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span> : "Enviar link de redefinição"}
          </button>
        </form>
        <div className="flex justify-center mt-4">
          <Link href="/login" className="flex items-center text-sm text-zinc-400 hover:text-amber-400 transition-colors">
            <FaArrowLeft className="mr-1" /> Voltar para login
          </Link>
        </div>
      </div>
    </motion.div>
  );
} 