"use client";
import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') setDark(true);
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const html = document.documentElement;
      if (dark) {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  }, [dark]);
  return (
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
  );
} 