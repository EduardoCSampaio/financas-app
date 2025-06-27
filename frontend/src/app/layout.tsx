import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider, CategoriesProvider } from "@/contexts/AuthContext";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from "next/link";

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
  return (
    <html lang="pt-br">
      <body className={`${inter.className} bg-gradient-to-br from-primary via-gray-900 to-black min-h-screen text-white`}> 
        <AuthProvider>
          <CategoriesProvider>
            {/* Header premium fixo */}
            <header className="w-full fixed top-0 left-0 z-50 bg-primary shadow-lg border-b border-gold flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <img src="/logo.svg" alt="Logo" className="h-10 w-10" />
                <span className="text-2xl font-extrabold tracking-tight text-gold drop-shadow-lg select-none" style={{letterSpacing: '-1px'}}>FinanceDash</span>
              </div>
              <nav className="flex items-center gap-6">
                <Link href="/" className="text-lg font-semibold hover:text-gold transition-colors">Dashboard</Link>
                <Link href="/accounts" className="text-lg font-semibold hover:text-gold transition-colors">Contas</Link>
                <Link href="/perfil" className="text-lg font-semibold hover:text-gold transition-colors">Perfil</Link>
              </nav>
              <div className="flex items-center gap-3">
                {/* Avatar fake para demo, pode trocar pelo usuário real depois */}
                <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-primary font-bold text-xl shadow-lg">E</div>
              </div>
            </header>
            {/* Espaço para o header fixo */}
            <div className="pt-20 max-w-6xl mx-auto px-4">
              {children}
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
              theme="dark"
              toastClassName="rounded-lg shadow-lg"
              className="text-sm"
            />
          </CategoriesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
