import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
      <body className={inter.className}>
        <AuthProvider>
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
