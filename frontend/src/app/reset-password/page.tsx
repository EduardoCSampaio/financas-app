"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { toast } from "react-toastify";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: newPassword });
      toast.success("Senha redefinida com sucesso!");
      router.push("/login");
    } catch (err) {
      toast.error("Erro ao redefinir senha. O link pode estar expirado ou inválido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-black via-zinc-900 to-zinc-800">
      <div className="w-full max-w-md p-8 space-y-8 backdrop-blur-lg bg-white/10 border border-zinc-700 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-center text-white drop-shadow-lg">
          Redefinir senha
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="newPassword" className="text-sm font-medium text-zinc-400">
              Nova senha
            </label>
            <input
              id="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-white bg-white/5 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-400">
              Confirmar nova senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-white bg-white/5 border border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 font-semibold text-black bg-amber-400 rounded-md hover:bg-amber-500 transition-colors"
            disabled={loading}
          >
            {loading ? "Redefinindo..." : "Redefinir senha"}
          </button>
        </form>
      </div>
    </div>
  );
} 