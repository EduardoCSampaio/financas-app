import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider, CategoriesProvider, useAuth } from "@/contexts/AuthContext";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from "next/link";
import { FaHome, FaWallet, FaTags, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FinanceDash - Seu sistema financeiro premium",
  description: "Gerencie suas finanças, visualize gráficos e exporte relatórios de forma simples e moderna.",
  openGraph: {
    title: "FinanceDash - Seu sistema financeiro premium",
    description: "Gerencie suas finanças, visualize gráficos e exporte relatórios de forma simples e moderna.",
    url: "https://financas-app-mu.vercel.app/",
    siteName: "FinanceDash",
    images: [
      {
        url: "/logo.svg",
        width: 1200,
        height: 630,
        alt: "Logo FinanceDash",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FinanceDash - Seu sistema financeiro premium",
    description: "Gerencie suas finanças, visualize gráficos e exporte relatórios de forma simples e moderna.",
    images: ["/logo.svg"],
    creator: "@e_sampaio_",
  },
  metadataBase: new URL("https://financas-app-mu.vercel.app"),
  other: {
    whatsapp: "+5515997972008"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isLoginPage = pathname === '/login';
  const { user, logout } = useAuth?.() || { user: null, logout: () => {} };
  return (
    <html lang="pt-br">
      <body className={`${inter.className} bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen text-slate-800`}>
        <AuthProvider>
          <CategoriesProvider>
            <div className="flex min-h-screen">
              {/* Sidebar premium (client-side) */}
              {!isLoginPage && (
                <Sidebar pathname={pathname} user={user} logout={logout} />
              )}
              {/* Conteúdo principal */}
              <main className="flex-1 p-8">
                {children}
              </main>
            </div>
            <ToastContainer
              position="bottom-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
              toastClassName="rounded-xl shadow-lg"
              className="text-sm"
            />
          </CategoriesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
