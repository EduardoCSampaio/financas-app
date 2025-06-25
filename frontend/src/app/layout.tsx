import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Financeiro Premium",
  description: "Seu sistema financeiro completo",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="pt-br">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex flex-col items-center justify-center pt-8">
            <div className="flex items-center gap-3 mb-4">
              <Image src="/logo.svg" alt="Logo" width={40} height={40} />
              <span className="text-2xl font-extrabold text-amber-400 tracking-tight drop-shadow-lg select-none" style={{letterSpacing: '-1px'}}>Finanças Premium</span>
            </div>
          </div>
          {children}
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
        </AuthProvider>
      </body>
    </html>
  );
}
