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
      <body className={`${inter.className} bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen text-slate-800`}> 
        <AuthProvider>
          <CategoriesProvider>
            <div className="flex min-h-screen">
              {/* Sidebar fixa */}
              <aside className="w-60 bg-white border-r border-slate-200 flex flex-col p-6 gap-8 shadow-sm">
                <div className="text-2xl font-extrabold tracking-tight text-indigo-600" style={{letterSpacing: '-0.03em'}}>
                  Finanças<span className="text-slate-800">Pro</span>
                </div>
                <nav className="flex flex-col gap-3">
                  <Link href="/" className="text-lg font-medium text-slate-800 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-blue-500 hover:text-white px-4 py-3 rounded-xl transition-all duration-150">
                    Dashboard
                  </Link>
                  <Link href="/accounts" className="text-lg font-medium text-slate-800 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-blue-500 hover:text-white px-4 py-3 rounded-xl transition-all duration-150">
                    Contas
                  </Link>
                  <Link href="/perfil" className="text-lg font-medium text-slate-800 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-blue-500 hover:text-white px-4 py-3 rounded-xl transition-all duration-150">
                    Perfil
                  </Link>
                </nav>
              </aside>
              
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
