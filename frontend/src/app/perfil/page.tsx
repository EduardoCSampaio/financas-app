"use client";
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaUser } from 'react-icons/fa';
import Image from 'next/image';
import { toast } from 'react-toastify';

export default function PerfilPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  // Estados para edição
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  // Preview instantâneo da foto
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoPreview(URL.createObjectURL(e.target.files[0]));
    }
  };
  // Simula salvar alterações
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Alterações salvas com sucesso! (Simulado)');
    }, 1200);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-2xl p-6 sm:p-10 bg-white/80 backdrop-blur-md rounded-3xl shadow-lg flex flex-col gap-8">
        <h1 className="text-3xl font-black text-indigo-700 text-center mb-2 tracking-tight select-none">Meu Perfil</h1>
        {/* Card de edição de perfil */}
        <form onSubmit={handleSave} className="bg-white/70 rounded-2xl shadow p-6 flex flex-col gap-6 items-center">
          {/* Foto de perfil */}
          <div className="relative group">
            {photoPreview ? (
              <Image src={photoPreview} alt="Foto de perfil" width={96} height={96} className="rounded-full object-cover w-24 h-24 border-4 border-indigo-200" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center border-4 border-indigo-200">
                <FaUser className="text-4xl text-indigo-600" />
              </div>
            )}
            <label className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-2 cursor-pointer shadow-lg opacity-80 group-hover:opacity-100 transition-all" title="Alterar foto">
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 10-4-4l-8 8v3h3z" /></svg>
            </label>
          </div>
          {/* Inputs editáveis */}
          <div className="w-full flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nome</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-base shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">E-mail</label>
              <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-base shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition" />
            </div>
            <div>
              <button type="button" className="text-indigo-600 text-xs font-semibold underline" onClick={() => setShowPassword(v => !v)}>
                {showPassword ? 'Cancelar alteração de senha' : 'Alterar senha'}
              </button>
              {showPassword && (
                <input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Nova senha" className="mt-2 w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-base shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition" />
              )}
            </div>
          </div>
          <button type="submit" disabled={loading} className="mt-2 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold text-base py-3 shadow-md hover:from-indigo-700 hover:to-blue-600 transition-all duration-150 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
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