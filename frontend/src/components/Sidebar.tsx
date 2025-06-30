"use client";
import Link from "next/link";
import { FaHome, FaWallet, FaTags, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { useState } from 'react';
import type { User } from '@/types';
import Image from 'next/image';

export default function Sidebar({ pathname, user, logout }: { pathname: string, user: User | null, logout: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <>
      {/* Sidebar premium - desktop only */}
      <aside className="hidden md:flex w-64 bg-white/70 backdrop-blur-md shadow-xl rounded-3xl m-4 flex-col items-center py-8 px-4 gap-10 border border-slate-100 justify-between">
        <div className="w-full flex flex-col items-center">
          <Image src="/logo.svg" alt="Logo" width={56} height={56} className="mb-2" />
          <span className="text-2xl font-black tracking-tight text-indigo-700 mb-6" style={{letterSpacing: '-0.03em'}}>Finanças<span className="text-slate-800">Pro</span></span>
          <nav className="flex flex-col gap-2 w-full">
            <Link href="/" className={`flex items-center gap-3 px-5 py-3 rounded-xl font-semibold text-base transition-all duration-150 ${pathname === '/' ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg' : 'text-slate-800 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-blue-50 hover:text-indigo-700'}`}>
              <FaHome className="text-xl" /> Dashboard
            </Link>
            <Link href="/accounts" className={`flex items-center gap-3 px-5 py-3 rounded-xl font-semibold text-base transition-all duration-150 ${pathname === '/accounts' ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg' : 'text-slate-800 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-blue-50 hover:text-indigo-700'}`}>
              <FaWallet className="text-xl" /> Contas
            </Link>
            <Link href="/categorias" className={`flex items-center gap-3 px-5 py-3 rounded-xl font-semibold text-base transition-all duration-150 ${pathname === '/categorias' ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg' : 'text-slate-800 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-blue-50 hover:text-indigo-700'}`}>
              <FaTags className="text-xl" /> Categorias
            </Link>
            <Link href="/perfil" className={`flex items-center gap-3 px-5 py-3 rounded-xl font-semibold text-base transition-all duration-150 ${pathname === '/perfil' ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg' : 'text-slate-800 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-blue-50 hover:text-indigo-700'}`}>
              <FaUserCircle className="text-xl" /> Perfil
            </Link>
          </nav>
        </div>
        {/* Bloco inferior: avatar, nome/email e logout */}
        <div className="w-full flex flex-col items-center gap-3 mt-8">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center mb-1">
            <FaUserCircle className="text-3xl text-indigo-600" />
          </div>
          <div className="text-sm font-semibold text-slate-700 text-center break-all max-w-[12rem]">{user?.name || user?.email || 'Usuário'}</div>
          <button onClick={logout} className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold shadow hover:from-red-600 hover:to-pink-600 transition-all duration-150 text-sm">
            <FaSignOutAlt /> Sair
          </button>
        </div>
      </aside>
      {/* Botão mobile menu */}
      <button className="md:hidden fixed top-4 left-4 z-50 bg-white/80 backdrop-blur-md shadow-lg rounded-full p-3 border border-slate-200" onClick={() => setMobileMenuOpen(true)}>
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-indigo-700">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {/* Drawer mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          {/* Drawer */}
          <aside className="relative w-64 bg-white/90 backdrop-blur-md shadow-2xl rounded-r-3xl flex flex-col items-center py-8 px-4 gap-10 border-r border-slate-100 h-full animate-slide-in-left">
            <div className="w-full flex flex-col items-center">
              <Image src="/logo.svg" alt="Logo" width={56} height={56} className="mb-2" />
              <span className="text-2xl font-black tracking-tight text-indigo-700 mb-6" style={{letterSpacing: '-0.03em'}}>Finanças<span className="text-slate-800">Pro</span></span>
              <nav className="flex flex-col gap-2 w-full">
                <Link href="/" className={`flex items-center gap-3 px-5 py-3 rounded-xl font-semibold text-base transition-all duration-150 ${pathname === '/' ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg' : 'text-slate-800 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-blue-50 hover:text-indigo-700'}`} onClick={() => setMobileMenuOpen(false)}>
                  <FaHome className="text-xl" /> Dashboard
                </Link>
                <Link href="/accounts" className={`flex items-center gap-3 px-5 py-3 rounded-xl font-semibold text-base transition-all duration-150 ${pathname === '/accounts' ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg' : 'text-slate-800 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-blue-50 hover:text-indigo-700'}`} onClick={() => setMobileMenuOpen(false)}>
                  <FaWallet className="text-xl" /> Contas
                </Link>
                <Link href="/categorias" className={`flex items-center gap-3 px-5 py-3 rounded-xl font-semibold text-base transition-all duration-150 ${pathname === '/categorias' ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg' : 'text-slate-800 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-blue-50 hover:text-indigo-700'}`} onClick={() => setMobileMenuOpen(false)}>
                  <FaTags className="text-xl" /> Categorias
                </Link>
                <Link href="/perfil" className={`flex items-center gap-3 px-5 py-3 rounded-xl font-semibold text-base transition-all duration-150 ${pathname === '/perfil' ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg' : 'text-slate-800 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-blue-50 hover:text-indigo-700'}`} onClick={() => setMobileMenuOpen(false)}>
                  <FaUserCircle className="text-xl" /> Perfil
                </Link>
              </nav>
            </div>
            {/* Bloco inferior: avatar, nome/email e logout */}
            <div className="w-full flex flex-col items-center gap-3 mt-8">
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center mb-1">
                <FaUserCircle className="text-3xl text-indigo-600" />
              </div>
              <div className="text-sm font-semibold text-slate-700 text-center break-all max-w-[12rem]">{user?.name || user?.email || 'Usuário'}</div>
              <button onClick={() => { setMobileMenuOpen(false); logout(); }} className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold shadow hover:from-red-600 hover:to-pink-600 transition-all duration-150 text-sm">
                <FaSignOutAlt /> Sair
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
} 