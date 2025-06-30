"use client";
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaIdCard, FaSignOutAlt, FaCog } from 'react-icons/fa';

export default function PerfilPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      logout();
      router.push('/login');
      toast.success('Logout realizado com sucesso!');
    } catch {
      toast.error('Erro ao fazer logout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-2xl p-6 sm:p-10 bg-white/80 backdrop-blur-md rounded-3xl shadow-lg flex flex-col gap-8">
        <h1 className="text-3xl font-black text-indigo-700 text-center mb-2 tracking-tight select-none">Meu Perfil</h1>
        {/* Informações do usuário */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white/70 rounded-2xl shadow p-6 flex flex-col gap-6">
            <div className="text-lg font-bold text-indigo-600 mb-2">Informações Pessoais</div>
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <FaUser className="text-2xl text-indigo-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">E-mail</div>
                  <div className="font-semibold text-slate-800 break-all">{user?.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <FaIdCard className="text-2xl text-indigo-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Tipo de Conta</div>
                  <div className="font-semibold text-slate-800 uppercase">{user?.account_type}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <FaEnvelope className="text-2xl text-indigo-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Documento</div>
                  <div className="font-semibold text-slate-800">{user?.document}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/70 rounded-2xl shadow p-6 flex flex-col gap-6">
            <div className="text-lg font-bold text-indigo-600 mb-2">Configurações</div>
            <div className="space-y-4">
              <button className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <FaCog className="text-xl text-slate-600" />
                <div className="text-left">
                  <div className="font-semibold text-slate-800">Configurações da Conta</div>
                  <div className="text-xs text-slate-500">Alterar senha e preferências</div>
                </div>
              </button>
              <button 
                onClick={handleLogout}
                disabled={loading}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-red-200 hover:bg-red-50 transition-colors"
              >
                <FaSignOutAlt className="text-xl text-red-600" />
                <div className="text-left">
                  <div className="font-semibold text-red-800">Sair da Conta</div>
                  <div className="text-xs text-red-500">Fazer logout do sistema</div>
                </div>
              </button>
            </div>
          </div>
        </div>
        {/* Estatísticas */}
        <div className="bg-white/70 rounded-2xl shadow p-6 flex flex-col gap-6">
          <div className="text-lg font-bold text-indigo-600 mb-2">Estatísticas da Conta</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-black text-indigo-600">0</div>
              <div className="text-xs text-slate-500">Contas Criadas</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-indigo-600">0</div>
              <div className="text-xs text-slate-500">Transações</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-indigo-600">0</div>
              <div className="text-xs text-slate-500">Categorias</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 