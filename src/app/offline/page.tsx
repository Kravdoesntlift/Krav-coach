"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
      {/* Logo */}
      <h1 className="text-4xl font-black tracking-tighter text-white mb-1">
        KRAV<span className="text-brand-gold">.</span>
      </h1>

      {/* Icon */}
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center my-8"
        style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.15),rgba(10,10,10,0.9))", border: "1px solid rgba(201,168,76,0.2)" }}
      >
        <span className="text-5xl">📡</span>
      </div>

      {/* Message */}
      <h2 className="text-white text-2xl font-black tracking-tight mb-3">
        Sem ligação
      </h2>
      <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
        Não há conexão à internet neste momento.{" "}
        <span className="text-zinc-400">Os teus treinos continuam quando voltares online.</span>
      </p>

      {/* Motivational */}
      <div
        className="mt-10 px-6 py-4 rounded-2xl max-w-xs"
        style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)" }}
      >
        <p className="text-brand-gold text-sm font-semibold italic">
          &ldquo;A disciplina não precisa de wi-fi.&rdquo;
        </p>
      </div>

      {/* Retry */}
      <button
        onClick={() => window.location.reload()}
        className="mt-10 px-8 py-3 rounded-2xl font-bold text-black text-sm transition-all active:scale-95"
        style={{ background: "linear-gradient(135deg,#E2C060,#A8893A)" }}
      >
        Tentar novamente
      </button>
    </div>
  );
}
