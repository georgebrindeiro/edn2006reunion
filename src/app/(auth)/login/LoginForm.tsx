"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email,      setEmail]      = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      passphrase,
      redirect: false,
    });

    if (result?.error) {
      setError("Senha incorreta ou e-mail não reconhecido. Tente novamente.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl">
      <h2 className="font-display text-white text-xl font-semibold mb-1">
        Entrar
      </h2>
      <p className="text-edn-mist/70 text-sm font-body mb-6">
        Use o e-mail e a senha compartilhada pelo organizador.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-edn-mist text-xs font-body uppercase tracking-wider mb-1.5">
            Seu e-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="voce@email.com"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/30 text-sm font-body focus:outline-none focus:border-edn-steel-lt focus:bg-white/15 transition-all"
          />
        </div>

        {/* Passphrase */}
        <div>
          <label className="block text-edn-mist text-xs font-body uppercase tracking-wider mb-1.5">
            Senha da turma
          </label>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              required
              placeholder="••••••••••••"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 pr-11 text-white placeholder:text-white/30 text-sm font-body focus:outline-none focus:border-edn-steel-lt focus:bg-white/15 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-300 text-xs font-body bg-red-500/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-edn-navy font-body font-semibold text-sm rounded-lg py-3 hover:bg-edn-mist transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
