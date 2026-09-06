"use client";

import { useState, useRef, useEffect } from "react";
import { useLang } from "@/lib/i18n/useLang";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const extra = {
  powered_by:   { pt: "Powered by KRAV · disponível 24/7", en: "Powered by KRAV · available 24/7" },
  online:       { pt: "online", en: "online" },
  error_reply:  { pt: "Erro ao responder.", en: "Error replying." },
  error_conn:   { pt: "Erro de ligação. Tenta novamente.", en: "Connection error. Please try again." },
  suggestions: {
    pt: [
      "Posso substituir o supino por outro exercício?",
      "O que devo comer antes do treino?",
      "Quantas horas de descanso preciso?",
      "Como melhorar a recuperação muscular?",
      "Estou com dor nas costas, o que faço?",
    ],
    en: [
      "Can I replace the bench press with another exercise?",
      "What should I eat before training?",
      "How many hours of rest do I need?",
      "How can I improve muscle recovery?",
      "I have back pain, what should I do?",
    ],
  },
  greeting: {
    pt: "Olá! 👋 Sou o teu assistente de coaching KRAV. Estou aqui para responder às tuas dúvidas sobre treino, nutrição e recuperação, sempre com base no teu plano e histórico. Em que posso ajudar?",
    en: "Hi! 👋 I'm your KRAV coaching assistant. I'm here to answer your questions about training, nutrition, and recovery, always based on your plan and history. How can I help?",
  },
} as const;

export default function AICoachPage() {
  const { t, lang } = useLang();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: extra.greeting[lang],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setLoading(true);

    const history = messages.filter((m) => m.role !== "assistant" || messages.indexOf(m) > 0);

    try {
      const res = await fetch("/api/ai/coach-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply ?? data.error ?? extra.error_reply[lang] },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: extra.error_conn[lang] }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const suggestions = extra.suggestions[lang];

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)] md:h-[calc(100dvh-6rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-black text-black"
            style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
          >
            K
          </div>
          <div>
            <h1 className="text-white font-black text-lg">{t("ai_coach")}</h1>
            <p className="text-zinc-500 text-xs">{extra.powered_by[lang]}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-zinc-500">{extra.online[lang]}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-2 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div
                className="w-7 h-7 rounded-xl shrink-0 mr-2 mt-0.5 flex items-center justify-center text-xs font-black text-black"
                style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
              >
                K
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "text-black font-medium rounded-br-sm"
                  : "text-zinc-200 rounded-bl-sm"
              }`}
              style={
                m.role === "user"
                  ? { background: "linear-gradient(135deg,#E8C96B,#A8893A)" }
                  : { background: "rgba(39,39,42,0.8)", border: "1px solid rgba(63,63,70,0.5)" }
              }
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div
              className="w-7 h-7 rounded-xl shrink-0 mr-2 mt-0.5 flex items-center justify-center text-xs font-black text-black"
              style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
            >
              K
            </div>
            <div
              className="px-4 py-3 rounded-2xl rounded-bl-sm"
              style={{ background: "rgba(39,39,42,0.8)", border: "1px solid rgba(63,63,70,0.5)" }}
            >
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions (only on first interaction) */}
      {messages.length === 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="shrink-0 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white transition-colors whitespace-nowrap"
              style={{ background: "rgba(39,39,42,0.8)", border: "1px solid rgba(63,63,70,0.5)" }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        className="flex items-end gap-2 p-3 rounded-2xl mt-2"
        style={{ background: "rgba(24,24,27,0.9)", border: "1px solid rgba(63,63,70,0.5)" }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 112)}px`;
          }}
          onKeyDown={handleKey}
          placeholder={t("ai_placeholder")}
          rows={1}
          maxLength={500}
          className="flex-1 bg-transparent text-white text-sm placeholder-zinc-600 resize-none focus:outline-none"
          style={{ lineHeight: "1.5", minHeight: "24px", maxHeight: "112px", overflowY: "auto" }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
          style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
