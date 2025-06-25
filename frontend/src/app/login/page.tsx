"use client";
import React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      setLoading(true);
      const response = await api.post('/auth/token', formData);
      const { access_token, user } = response.data;
      login(access_token, user);
      router.push('/');
    } catch (err: unknown) {
      let errorMessage = 'E-mail ou senha inválidos.';
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
        <div className="flex flex-col items-center justify-center mb-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Logo" width={40} height={40} />
            <span className="text-2xl font-extrabold text-amber-400 tracking-tight drop-shadow-lg select-none" style={{letterSpacing: '-1px'}}>Finanças Premium</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center text-white drop-shadow-lg">
          Login
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <FaUser className="inline mr-1" /> Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu e-mail"
              className={`w-full px-3 py-2 mt-1 text-white bg-white/5 border ${error ? 'border-red-500' : 'border-zinc-600'} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400`}
            />
            {error && <span className="text-xs text-red-400">{error}</span>}
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <FaLock className="inline mr-1" /> Senha
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className={`w-full px-3 py-2 mt-1 text-white bg-white/5 border ${error ? 'border-red-500' : 'border-zinc-600'} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 pr-10`}
              />
              <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-400 focus:outline-none">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 font-semibold text-black bg-amber-400 rounded-md hover:bg-amber-500 transition-colors flex items-center justify-center gap-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
            disabled={!!error || !email || !password}
          >
            {loading ? <span className="loader ml-2 w-4 h-4 border-2 border-t-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span> : "Entrar"}
          </button>
        </form>
        <div className="flex flex-col items-center gap-2 mt-4">
          <Link href="/esqueci-senha" className="text-sm font-semibold text-amber-400 hover:underline transition-colors">
            Esqueci minha senha?
          </Link>
          <p className="text-sm text-center text-zinc-400">
            Não tem uma conta?{' '}
            <Link href="/register" className="font-medium text-amber-400 hover:underline">
              Registre-se
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
} 