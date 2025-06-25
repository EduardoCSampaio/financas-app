"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import { FaUser, FaLock, FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("As senhas não coincidem!");
      return;
    }

    try {
      setLoading(true);
      await api.post('/users/', { email, password });
      toast.success('Usuário criado com sucesso! Por favor, faça o login.');
      router.push('/login');
    } catch (err: unknown) {
      let errorMessage = 'Falha ao criar usuário.';
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'detail' in err.response.data) {
        errorMessage = (err.response as { data?: { detail?: string } }).data?.detail || errorMessage;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-black via-zinc-900 to-zinc-800">
      <div className="w-full max-w-md p-8 space-y-8 backdrop-blur-lg bg-white/10 border border-zinc-700 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-center text-white drop-shadow-lg">
          <FaUser className="inline mb-1 mr-2 text-amber-400" /> Criar Conta
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <FaUser className="inline mr-1" /> Email
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
          <div>
            <label htmlFor="password" className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <FaLock className="inline mr-1" /> Senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-white bg-white/5 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <FaLock className="inline mr-1" /> Confirmar senha
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
            {loading ? <span className="loader ml-2 w-4 h-4 border-2 border-t-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span> : "Criar conta"}
          </button>
          {error && <p className="text-sm text-center text-red-500">{error}</p>}
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