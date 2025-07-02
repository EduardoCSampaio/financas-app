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
    setLoading(true);

    const formData = new URLSearchParams();
    formData.append('email', email);
    formData.append('password', password);

    try {
      localStorage.removeItem('token');
      const response = await api.post('/auth/token', formData);
      const { access_token, user } = response.data;
      if (access_token) {
        login(access_token, user);
        router.push('/');
      } else {
        setError('Token de acesso não recebido. Contate o suporte.');
        toast.error('Token de acesso não recebido. Contate o suporte.');
      }
    } catch (err: unknown) {
      let errorMessage = 'E-mail ou senha inválidos.';
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as any).response;
        if (!response) {
          errorMessage = 'Erro de conexão. Tente novamente mais tarde.';
        } else if (response.data?.detail) {
          errorMessage = response.data.detail;
        }
      } else if (!err || typeof err !== 'object') {
        errorMessage = 'Erro de conexão. Tente novamente mais tarde.';
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md p-6 sm:p-10 bg-white/80 backdrop-blur-md rounded-3xl shadow-lg flex flex-col items-center">
        <Image src="/logo.svg" alt="Logo" width={56} height={56} className="mb-4" />
        <span className="text-3xl font-black text-indigo-600 tracking-tight mb-2 select-none" style={{letterSpacing: '-0.03em'}}>FinançasPro</span>
        <h1 className="text-center mb-8 text-lg sm:text-2xl font-semibold text-slate-800">Entrar</h1>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-600 mb-2">E-mail</label>
            <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Digite seu e-mail" className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-base shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition" />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-600 mb-2">Senha</label>
            <div className="relative">
              <input id="password" type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Digite sua senha" className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 pr-10 text-base shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition" />
              <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 focus:outline-none">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          {error && <span className="text-xs text-red-500 mt-1 block text-center">{error}</span>}
          <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold text-base py-3 shadow-md hover:from-indigo-700 hover:to-blue-600 transition-all duration-150 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading}>
            {loading ? <span className="loader ml-2 w-4 h-4 border-2 border-t-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span> : "Entrar"}
          </button>
        </form>
        <div className="flex flex-col gap-2 items-center mt-8 w-full">
          <Link href="/register" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">Criar conta</Link>
          <Link href="/esqueci-senha" className="text-slate-400 hover:text-indigo-500 text-xs transition-colors">Esqueci minha senha</Link>
        </div>
      </div>
    </div>
  );
} 