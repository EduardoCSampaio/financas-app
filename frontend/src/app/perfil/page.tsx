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
    } catch (error) {
      toast.error('Erro ao fazer logout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="apple-title">Perfil</h1>
        <p className="text-lg text-slate-600 mt-1">
          Gerencie suas informações pessoais
        </p>
      </div>

      {/* Informações do usuário */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="apple-card">
          <div className="apple-subtitle mb-6">Informações Pessoais</div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <FaUser className="text-indigo-600" />
              </div>
              <div>
                <div className="text-sm text-slate-500">E-mail</div>
                <div className="font-medium text-slate-800">{user?.email}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <FaIdCard className="text-indigo-600" />
              </div>
              <div>
                <div className="text-sm text-slate-500">Tipo de Conta</div>
                <div className="font-medium text-slate-800 uppercase">{user?.account_type}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <FaEnvelope className="text-indigo-600" />
              </div>
              <div>
                <div className="text-sm text-slate-500">Documento</div>
                <div className="font-medium text-slate-800">{user?.document}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="apple-card">
          <div className="apple-subtitle mb-6">Configurações</div>
          
          <div className="space-y-4">
            <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
              <FaCog className="text-slate-600" />
              <div className="text-left">
                <div className="font-medium text-slate-800">Configurações da Conta</div>
                <div className="text-sm text-slate-500">Alterar senha e preferências</div>
              </div>
            </button>
            
            <button 
              onClick={handleLogout}
              disabled={loading}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-red-200 hover:bg-red-50 transition-colors"
            >
              <FaSignOutAlt className="text-red-600" />
              <div className="text-left">
                <div className="font-medium text-red-800">Sair da Conta</div>
                <div className="text-sm text-red-500">Fazer logout do sistema</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="apple-card">
        <div className="apple-subtitle mb-6">Estatísticas da Conta</div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600">0</div>
            <div className="text-sm text-slate-500">Contas Criadas</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600">0</div>
            <div className="text-sm text-slate-500">Transações</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600">0</div>
            <div className="text-sm text-slate-500">Categorias</div>
          </div>
        </div>
      </div>
    </div>
  );
} 