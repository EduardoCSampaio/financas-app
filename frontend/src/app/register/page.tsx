"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import { FaArrowLeft, FaEye, FaEyeSlash, FaCheckCircle } from 'react-icons/fa';
import Image from 'next/image';
import { IMaskInput } from 'react-imask';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [accountType, setAccountType] = useState<'cpf' | 'cnpj'>('cpf');
  const [document, setDocument] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("As senhas não coincidem!");
      return;
    }

    if (!document) {
      setError(accountType === 'cpf' ? 'CPF obrigatório!' : 'CNPJ obrigatório!');
      return;
    }
    if (!name.trim()) {
      setError('Nome obrigatório!');
      return;
    }

    try {
      setLoading(true);
      await api.post('/users/', { name, email, password, account_type: accountType, document });
      setSuccess(true);
      toast.success('Usuário criado com sucesso! Por favor, faça o login.');
      setTimeout(() => router.push('/login'), 1500);
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

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-md rounded-3xl shadow-lg text-center">
          <FaCheckCircle className="text-6xl text-green-500 mb-4 mx-auto" />
          <h2 className="text-2xl font-bold mb-2 text-indigo-600">Conta criada!</h2>
          <p className="text-slate-600">Redirecionando para o login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md p-6 sm:p-10 bg-white/80 backdrop-blur-md rounded-3xl shadow-lg flex flex-col items-center">
        <Image src="/logo.svg" alt="Logo" width={56} height={56} className="mb-4" />
        <span className="text-3xl font-black text-indigo-600 tracking-tight mb-2 select-none" style={{letterSpacing: '-0.03em'}}>FinançasPro</span>
        <h1 className="text-center mb-8 text-lg sm:text-2xl font-semibold text-slate-800">Criar conta</h1>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          <div className="flex gap-4 mb-2">
            <label className="flex items-center gap-2 text-slate-700 font-medium">
              <input 
                type="radio" 
                name="accountType" 
                value="cpf" 
                checked={accountType === 'cpf'} 
                onChange={() => setAccountType('cpf')}
                className="text-indigo-600 focus:ring-indigo-500"
              /> 
              CPF
            </label>
            <label className="flex items-center gap-2 text-slate-700 font-medium">
              <input 
                type="radio" 
                name="accountType" 
                value="cnpj" 
                checked={accountType === 'cnpj'} 
                onChange={() => setAccountType('cnpj')}
                className="text-indigo-600 focus:ring-indigo-500"
              /> 
              CNPJ
            </label>
          </div>
          <div>
            <label htmlFor="document" className="block text-xs font-semibold text-slate-600 mb-2">
              {accountType === 'cpf' ? 'CPF' : 'CNPJ'}
            </label>
            <IMaskInput
              id="document"
              mask={accountType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
              value={document}
              onAccept={(value: string) => setDocument(value)}
              placeholder={accountType === 'cpf' ? 'Digite seu CPF' : 'Digite seu CNPJ'}
              className={`w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-base shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition ${error ? 'border-red-500' : ''}`}
              required
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-slate-600 mb-2">
              Nome completo
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome completo"
              className={`w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-base shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition ${error ? 'border-red-500' : ''}`}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-600 mb-2">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu e-mail"
              className={`w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-base shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition ${error ? 'border-red-500' : ''}`}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-600 mb-2">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className={`w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 pr-10 text-base shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition ${error ? 'border-red-500' : ''}`}
              />
              <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 focus:outline-none">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-600 mb-2">
              Confirmar senha
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua senha"
                className={`w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 pr-10 text-base shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition ${error ? 'border-red-500' : ''}`}
              />
              <button type="button" tabIndex={-1} onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 focus:outline-none">
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {error && <span className="text-xs text-red-500 mt-1 block">{error}</span>}
          </div>
          <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold text-base py-3 shadow-md hover:from-indigo-700 hover:to-blue-600 transition-all duration-150 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading}>
            {loading ? <span className="loader ml-2 w-4 h-4 border-2 border-t-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span> : "Criar conta"}
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