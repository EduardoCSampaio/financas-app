import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider, CategoriesProvider } from "@/contexts/AuthContext";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '@/components/Sidebar';
import AddTransactionFAB from '@/components/AddTransactionFAB';
import { useEffect, useState } from 'react';

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
  // Dark mode state
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') setDark(true);
  }, []);
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);
  return (
    <html lang="pt-br">
      <body className={`${inter.className} bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 min-h-screen text-slate-800 dark:text-slate-100`}>
        {/* Toggle dark mode */}
        <button
          className="fixed top-4 right-4 z-50 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-full p-3 shadow-lg hover:scale-110 transition-all"
          onClick={() => setDark(d => !d)}
          aria-label="Alternar modo escuro"
        >
          {dark ? (
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-yellow-400">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.07l-.71.71M21 12h-1M4 12H3m16.95 7.07l-.71-.71M6.34 6.34l-.71-.71M12 5a7 7 0 100 14 7 7 0 000-14z" />
            </svg>
          ) : (
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-slate-700">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
            </svg>
          )}
        </button>
        <AuthProvider>
          <CategoriesProvider>
            <div className="flex min-h-screen">
              {/* Sidebar premium (client-side) */}
              {!isLoginPage && (
                <Sidebar />
              )}
              {/* Conteúdo principal */}
              <main className="flex-1 p-8 relative">
                {children}
                {/* FAB para mobile */}
                <AddTransactionFAB />
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
