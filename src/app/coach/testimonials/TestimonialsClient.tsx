"use client";

import { useState, useTransition } from "react";
import {
  requestTestimonial,
  toggleTestimonialPublic,
  deleteTestimonial,
} from "./actions";

interface Testimonial {
  id: string;
  client_id: string;
  display_name: string;
  content: string | null;
  result_highlight: string | null;
  duration_weeks: number | null;
  is_public: boolean;
  requested_at: string | null;
  submitted_at: string | null;
}

interface ClientOption {
  id: string;
  full_name: string;
}

interface Props {
  testimonials: Testimonial[];
  clients: ClientOption[];
}

const EMPTY_FORM = {
  client_id: "",
  display_name: "",
  result_highlight: "",
  duration_weeks: "",
};

export default function TestimonialsClient({ testimonials, clients }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Auto-fill display_name from selected client if not yet typed
    if (name === "client_id") {
      const found = clients.find((c) => c.id === value);
      if (found) {
        setForm((prev) => ({
          ...prev,
          client_id: value,
          display_name: prev.display_name || found.full_name,
        }));
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.client_id) {
      setError("Seleciona um cliente.");
      return;
    }
    if (!form.display_name.trim()) {
      setError("O nome de exibição é obrigatório.");
      return;
    }
    startTransition(async () => {
      const result = await requestTestimonial({
        client_id: form.client_id,
        display_name: form.display_name.trim(),
        result_highlight: form.result_highlight.trim() || null,
        duration_weeks: form.duration_weeks ? Number(form.duration_weeks) : null,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setForm(EMPTY_FORM);
        setShowForm(false);
      }
    });
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      await toggleTestimonialPublic(id, !current);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteTestimonial(id);
      setConfirmDelete(null);
    });
  }

  const pending = testimonials.filter((t) => !t.submitted_at);
  const submitted = testimonials.filter((t) => t.submitted_at);

  return (
    <div className="space-y-8">
      {/* Request new testimonial button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-xl font-bold text-sm text-black transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
        >
          + Pedir Testemunho
        </button>
      )}

      {/* New request form */}
      {showForm && (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
          <h2 className="text-white font-bold text-base">Novo pedido de testemunho</h2>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-zinc-400 text-xs font-medium">Cliente</label>
              <select
                name="client_id"
                value={form.client_id}
                onChange={handleChange}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold"
              >
                <option value="">Selecionar cliente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-zinc-400 text-xs font-medium">
                Nome de exibição
              </label>
              <input
                type="text"
                name="display_name"
                value={form.display_name}
                onChange={handleChange}
                placeholder="Ex: Ana M."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-zinc-400 text-xs font-medium">
                Destaque do resultado{" "}
                <span className="text-zinc-600">(opcional)</span>
              </label>
              <input
                type="text"
                name="result_highlight"
                value={form.result_highlight}
                onChange={handleChange}
                placeholder="Ex: Perdeu 8kg em 3 meses"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-zinc-400 text-xs font-medium">
                Semanas de acompanhamento{" "}
                <span className="text-zinc-600">(opcional)</span>
              </label>
              <input
                type="number"
                name="duration_weeks"
                value={form.duration_weeks}
                onChange={handleChange}
                placeholder="12"
                min="1"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 rounded-xl font-bold text-sm text-black disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
              >
                {isPending ? "A guardar..." : "Criar pedido"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setForm(EMPTY_FORM);
                  setError(null);
                }}
                className="px-4 py-2 rounded-xl font-medium text-sm text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pending submissions */}
      {pending.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs font-bold tracking-[0.14em] uppercase text-zinc-500">
            Aguardando resposta{" "}
            <span className="text-zinc-600">({pending.length})</span>
          </p>
          <div className="space-y-3">
            {pending.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-white text-sm font-semibold">{t.display_name}</p>
                  {t.result_highlight && (
                    <p className="text-brand-gold text-xs mt-0.5">{t.result_highlight}</p>
                  )}
                  <p className="text-zinc-600 text-xs mt-1">
                    Pedido em{" "}
                    {t.requested_at
                      ? new Date(t.requested_at).toLocaleDateString("pt-PT", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-1 rounded-full">
                    Pendente
                  </span>
                  {confirmDelete === t.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={isPending}
                        className="text-xs text-red-400 font-semibold hover:text-red-300"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs text-zinc-500 hover:text-zinc-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(t.id)}
                      className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Submitted testimonials */}
      {submitted.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs font-bold tracking-[0.14em] uppercase text-zinc-500">
            Testemunhos recebidos{" "}
            <span className="text-zinc-600">({submitted.length})</span>
          </p>
          <div className="space-y-4">
            {submitted.map((t) => (
              <div
                key={t.id}
                className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
              >
                <div
                  className="text-brand-gold text-4xl font-black leading-none mb-3"
                  style={{ opacity: 0.3 }}
                >
                  &ldquo;
                </div>
                <p className="text-white text-sm leading-relaxed">{t.content}</p>
                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-white text-xs font-semibold">{t.display_name}</p>
                    {t.result_highlight && (
                      <p className="text-brand-gold text-xs">{t.result_highlight}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {t.duration_weeks && (
                      <p className="text-zinc-600 text-xs">{t.duration_weeks} sem.</p>
                    )}
                    <button
                      onClick={() => handleToggle(t.id, t.is_public)}
                      disabled={isPending}
                      className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
                        t.is_public
                          ? "bg-brand-gold/20 text-brand-gold hover:bg-brand-gold/30"
                          : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
                      }`}
                    >
                      {t.is_public ? "Público ✓" : "Privado"}
                    </button>
                    {confirmDelete === t.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(t.id)}
                          disabled={isPending}
                          className="text-xs text-red-400 font-semibold hover:text-red-300"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-xs text-zinc-500 hover:text-zinc-300"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(t.id)}
                        className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {testimonials.length === 0 && !showForm && (
        <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800 p-10 text-center">
          <p className="text-zinc-500 text-sm">
            Ainda não tens testemunhos. Pede aos teus clientes que partilhem a sua experiência.
          </p>
        </div>
      )}
    </div>
  );
}
