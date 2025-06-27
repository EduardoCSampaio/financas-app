"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import { FaUser, FaLock, FaArrowLeft, FaEye, FaEyeSlash, FaCheckCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { IMaskInput } from 'react-imask';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
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

    try {
      setLoading(true);
      await api.post('/users/', { email, password, account_type: accountType, document });
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
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-black via-zinc-900 to-zinc-800">
        <FaCheckCircle className="text-6xl text-amber-400 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-white mb-2">Conta criada!</h2>
        <p className="text-zinc-300 mb-4">Redirecionando para o login...</p>
      </motion.div>
    );
  }

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
          <FaUser className="inline mb-1 mr-2 text-amber-400" /> Criar Conta
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-4 mb-2">
            <label className="flex items-center gap-1 text-zinc-400">
              <input type="radio" name="accountType" value="cpf" checked={accountType === 'cpf'} onChange={() => setAccountType('cpf')} /> CPF
            </label>
            <label className="flex items-center gap-1 text-zinc-400">
              <input type="radio" name="accountType" value="cnpj" checked={accountType === 'cnpj'} onChange={() => setAccountType('cnpj')} /> CNPJ
            </label>
          </div>
          <div>
            <label htmlFor="document" className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              {accountType === 'cpf' ? 'CPF' : 'CNPJ'}
            </label>
            <IMaskInput
              id="document"
              mask={accountType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
              value={document}
              onAccept={(value: string) => setDocument(value)}
              placeholder={accountType === 'cpf' ? 'Digite seu CPF' : 'Digite seu CNPJ'}
              className={`w-full px-3 py-2 mt-1 text-white bg-white/5 border ${error ? 'border-red-500' : 'border-zinc-600'} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400`}
              required
            />
          </div>
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
              placeholder="Digite seu e-mail"
              className={`w-full px-3 py-2 mt-1 text-white bg-white/5 border ${error ? 'border-red-500' : 'border-zinc-600'} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400`}
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <FaLock className="inline mr-1" /> Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
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
          <div>
            <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <FaLock className="inline mr-1" /> Confirmar senha
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua senha"
                className={`w-full px-3 py-2 mt-1 text-white bg-white/5 border ${error ? 'border-red-500' : 'border-zinc-600'} rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 pr-10`}
              />
              <button type="button" tabIndex={-1} onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-400 focus:outline-none">
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {error && <span className="text-xs text-red-400">{error}</span>}
          </div>
          <button
            type="submit"
            className="w-full py-3 font-semibold text-black bg-amber-400 rounded-md hover:bg-amber-500 transition-colors flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? <span className="loader ml-2 w-4 h-4 border-2 border-t-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span> : "Criar conta"}
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