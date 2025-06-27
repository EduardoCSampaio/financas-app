"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-slate-200">
        <div className="flex flex-col items-center mb-6">
          <Image src="/logo.svg" alt="Logo" width={44} height={44} />
          <span className="text-2xl font-extrabold text-indigo-600 tracking-tight mt-2 select-none" style={{letterSpacing: '-0.03em'}}>FinançasPro</span>
        </div>
        <h1 className="apple-title text-center mb-2">Acesse sua conta</h1>
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              E-mail
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
              className={`apple-input w-full ${error ? 'border-red-500' : ''}`}
            />
            {error && <span className="text-xs text-red-500 mt-1 block">{error}</span>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
              Senha
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
                className={`apple-input w-full pr-10 ${error ? 'border-red-500' : ''}`}
              />
              <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 focus:outline-none">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="apple-btn w-full flex items-center justify-center"
            disabled={!!error || !email || !password || loading}
          >
            {loading ? <span className="loader ml-2 w-4 h-4 border-2 border-t-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span> : "Entrar"}
          </button>
        </form>
        <div className="flex flex-col items-center gap-2 mt-6">
          <Link href="/esqueci-senha" className="text-sm font-semibold text-indigo-600 hover:underline transition-colors">
            Esqueci minha senha?
          </Link>
          <p className="text-sm text-center text-slate-500">
            Não tem uma conta?{' '}
            <Link href="/register" className="font-medium text-indigo-600 hover:underline">
              Registre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 