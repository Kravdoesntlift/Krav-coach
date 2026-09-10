"use client";

import { useState, useTransition } from "react";
import {
  requestTestimonial,
  addGoogleReview,
  toggleTestimonialPublic,
  deleteTestimonial,
} from "./actions";
import { GOOGLE_REVIEW_URL } from "@/lib/seo";

interface Testimonial {
  id: string;
  client_id: string | null;
  display_name: string;
  content: string | null;
  result_highlight: string | null;
  duration_weeks: number | null;
  is_public: boolean;
  requested_at: string | null;
  submitted_at: string | null;
  rating: number | null;
  source: string | null;
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

const EMPTY_GOOGLE = {
  display_name: "",
  rating: 5,
  content: "",
  date: "",
};

const INPUT =
  "w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-brand-gold";

export default function TestimonialsClient({ testimonials, clients }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [showGoogleForm, setShowGoogleForm] = useState(false);
  const [gForm, setGForm] = useState(EMPTY_GOOGLE);
  const [gError, setGError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

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

  function openGoogleForm() {
    // Today's date is set on open rather than at first render, so the server
    // and the browser never disagree about it.
    setGForm({ ...EMPTY_GOOGLE, date: new Date().toISOString().slice(0, 10) });
    setGError(null);
    setShowGoogleForm(true);
  }

  function handleGoogleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGError(null);
    if (!gForm.display_name.trim()) {
      setGError("Escreve o nome tal como aparece no Google.");
      return;
    }
    startTransition(async () => {
      const result = await addGoogleReview(gForm);
      if (result.error) {
        setGError(result.error);
      } else {
        setGForm(EMPTY_GOOGLE);
        setShowGoogleForm(false);
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

  function deleteControl(id: string) {
    return confirmDelete === id ? (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleDelete(id)}
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
        onClick={() => setConfirmDelete(id)}
        className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
      >
        Eliminar
      </button>
    );
  }

  function publicToggle(t: Testimonial) {
    return (
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
    );
  }

  // Google reviews are copies of something that already happened in public.
  // They never pass through the request flow, so they get their own list.
  const google = testimonials
    .filter((t) => t.source === "google")
    .sort((a, b) => (b.submitted_at ?? "").localeCompare(a.submitted_at ?? ""));
  const own = testimonials.filter((t) => t.source !== "google");
  const pending = own.filter((t) => !t.submitted_at);
  const submitted = own.filter((t) => t.submitted_at);

  function copiarLink() {
    navigator.clipboard.writeText(GOOGLE_REVIEW_URL).then(
      () => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); },
      () => setError("Não foi possível copiar. Selecciona o link à mão."),
    );
  }

  return (
    <div className="space-y-8">
      {/* A testimonial lands in the app; a Google review lands in public. The
          app already asks for the second right after the first, but that only
          reaches clients who fill the form. This is for asking by message. */}
      {GOOGLE_REVIEW_URL && (
        <div className="card-gold p-5 space-y-3">
          <div>
            <p className="text-white font-bold text-sm">Link de avaliação no Google</p>
            <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
              Envia por mensagem para o cliente avaliar do telemóvel dele. Reviews deixadas na
              tua rede ou no teu telemóvel são frequentemente filtradas pelo Google.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 min-w-0 truncate text-xs text-zinc-400 bg-black/40 rounded-lg px-3 py-2 border border-zinc-800">
              {GOOGLE_REVIEW_URL}
            </code>
            <button
              onClick={copiarLink}
              className="shrink-0 px-3 py-2 rounded-lg text-xs font-bold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              {copiado ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>
      )}

      {!showForm && !showGoogleForm && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-xl font-bold text-sm text-black transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
          >
            + Pedir Testemunho
          </button>
          <button
            onClick={openGoogleForm}
            className="px-4 py-2 rounded-xl font-bold text-sm text-zinc-200 bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            + Avaliação do Google
          </button>
        </div>
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
                className={INPUT}
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
                className={INPUT}
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
                className={INPUT}
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

      {/* Copy a Google review onto the site */}
      {showGoogleForm && (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-white font-bold text-base">Adicionar avaliação do Google</h2>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Copia tal e qual como está no Google, sem corrigir nada. O site liga cada avaliação ao
              teu perfil, por isso quem for confirmar tem de encontrar as mesmas palavras. Todas
              contam para a nota, as más incluídas; só as de 4 e 5 estrelas com texto entram no
              carrossel. Avaliações de familiares não se adicionam: o Google remove-as.
            </p>
          </div>

          {gError && (
            <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{gError}</p>
          )}

          <form onSubmit={handleGoogleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="space-y-1">
                <label htmlFor="g-name" className="text-zinc-400 text-xs font-medium">
                  Nome no Google
                </label>
                <input
                  id="g-name"
                  type="text"
                  value={gForm.display_name}
                  onChange={(e) => setGForm((p) => ({ ...p, display_name: e.target.value }))}
                  placeholder="Ex: Pedro Araújo"
                  className={INPUT}
                />
              </div>
              <div className="space-y-1">
                <span id="g-stars" className="block text-zinc-400 text-xs font-medium">Estrelas</span>
                <div className="flex" role="radiogroup" aria-labelledby="g-stars">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={gForm.rating === n}
                      aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
                      onClick={() => setGForm((p) => ({ ...p, rating: n }))}
                      className={`w-9 h-[42px] text-xl transition-colors ${
                        n <= gForm.rating ? "text-brand-gold" : "text-zinc-700 hover:text-zinc-500"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="g-text" className="text-zinc-400 text-xs font-medium">
                Comentário{" "}
                <span className="text-zinc-600">(deixa vazio se só deu estrelas)</span>
              </label>
              <textarea
                id="g-text"
                rows={4}
                value={gForm.content}
                onChange={(e) => setGForm((p) => ({ ...p, content: e.target.value }))}
                className={`${INPUT} resize-y leading-relaxed`}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="g-date" className="text-zinc-400 text-xs font-medium">
                Data da avaliação
              </label>
              <input
                id="g-date"
                type="date"
                value={gForm.date}
                onChange={(e) => setGForm((p) => ({ ...p, date: e.target.value }))}
                className={`${INPUT} sm:max-w-[200px]`}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 rounded-xl font-bold text-sm text-black disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
              >
                {isPending ? "A guardar..." : "Adicionar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowGoogleForm(false);
                  setGForm(EMPTY_GOOGLE);
                  setGError(null);
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
                      : "-"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-1 rounded-full">
                    Pendente
                  </span>
                  {deleteControl(t.id)}
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
                    {publicToggle(t)}
                    {deleteControl(t.id)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Google reviews copied onto the site */}
      {google.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs font-bold tracking-[0.14em] uppercase text-zinc-500">
            Avaliações do Google{" "}
            <span className="text-zinc-600">({google.length})</span>
          </p>
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 divide-y divide-zinc-800">
            {google.map((t) => (
              <div key={t.id} className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-semibold truncate">{t.display_name}</p>
                    <span className="text-brand-gold text-xs shrink-0" aria-label={`${t.rating ?? 0} em 5`}>
                      {"★".repeat(t.rating ?? 0)}
                    </span>
                  </div>
                  {t.content ? (
                    <p className="text-zinc-400 text-xs mt-1 leading-relaxed line-clamp-2">{t.content}</p>
                  ) : (
                    <p className="text-zinc-600 text-xs mt-1">Só estrelas, sem comentário</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {publicToggle(t)}
                  {deleteControl(t.id)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {testimonials.length === 0 && !showForm && !showGoogleForm && (
        <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800 p-10 text-center">
          <p className="text-zinc-500 text-sm">
            Ainda não tens testemunhos. Pede aos teus clientes que partilhem a sua experiência.
          </p>
        </div>
      )}
    </div>
  );
}
