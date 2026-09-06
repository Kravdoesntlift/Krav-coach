"use client";

import { useState, useTransition } from "react";
import { addTransformation, deleteTransformation, togglePublic } from "./actions";

interface ClientTransformation {
  id: string;
  coach_id: string;
  display_name: string;
  before_url: string;
  after_url: string;
  duration_weeks: number | null;
  highlight: string | null;
  is_public: boolean;
  created_at: string;
}

interface Props {
  items: ClientTransformation[];
  coachId: string;
}

const EMPTY_FORM = {
  display_name: "",
  before_url: "",
  after_url: "",
  highlight: "",
  duration_weeks: "",
  is_public: true,
};

export default function ResultsClient({ items }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.display_name.trim() || !form.before_url.trim() || !form.after_url.trim()) {
      setError("Nome, URL do antes e URL do depois são obrigatórios.");
      return;
    }
    startTransition(async () => {
      const result = await addTransformation({
        display_name: form.display_name.trim(),
        before_url: form.before_url.trim(),
        after_url: form.after_url.trim(),
        highlight: form.highlight.trim() || null,
        duration_weeks: form.duration_weeks ? Number(form.duration_weeks) : null,
        is_public: form.is_public,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setForm(EMPTY_FORM);
        setShowForm(false);
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteTransformation(id);
    });
  }

  function handleToggle(id: string, currentValue: boolean) {
    startTransition(async () => {
      await togglePublic(id, !currentValue);
    });
  }

  return (
    <div className="space-y-6">
      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          + Adicionar transformação
        </button>
      )}

      {/* Inline form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="card space-y-4"
        >
          <h2 className="text-lg font-bold text-white">Nova transformação</h2>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <div>
            <label className="label">Nome a mostrar</label>
            <input
              className="input w-full"
              name="display_name"
              placeholder="Ex: João M."
              value={form.display_name}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">URL da foto, Antes</label>
              <input
                className="input w-full"
                name="before_url"
                placeholder="https://..."
                value={form.before_url}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label">URL da foto, Depois</label>
              <input
                className="input w-full"
                name="after_url"
                placeholder="https://..."
                value={form.after_url}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="label">Destaque</label>
            <input
              className="input w-full"
              name="highlight"
              placeholder="Ex: −15kg em 12 semanas"
              value={form.highlight}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="label">Duração (semanas)</label>
            <input
              className="input w-full"
              name="duration_weeks"
              type="number"
              min={1}
              placeholder="12"
              value={form.duration_weeks}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.is_public}
              onClick={() => setForm((prev) => ({ ...prev, is_public: !prev.is_public }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                form.is_public ? "bg-brand-gold" : "bg-zinc-700"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.is_public ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm text-zinc-300">
              {form.is_public ? "Público (visível no perfil)" : "Privado"}
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary"
            >
              {isPending ? "A guardar..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null); setForm(EMPTY_FORM); }}
              className="px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Grid */}
      {items.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-4xl mb-3">📸</p>
          <p className="font-semibold">Sem transformações ainda</p>
          <p className="text-sm mt-1">Adiciona o antes/depois de um cliente para mostrar no teu perfil público.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.id} className="card space-y-3">
              {/* Before / After photos */}
              <div className="grid grid-cols-2 gap-1">
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide">Antes</p>
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-zinc-800">
                    <img
                      src={item.before_url}
                      alt={`${item.display_name} antes`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#C9A84C" }}>Depois</p>
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-zinc-800">
                    <img
                      src={item.after_url}
                      alt={`${item.display_name} depois`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div>
                <p className="text-white font-semibold text-sm">{item.display_name}</p>
                {item.highlight && (
                  <span
                    className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full text-black"
                    style={{ background: "#C9A84C" }}
                  >
                    {item.highlight}
                  </span>
                )}
                {item.duration_weeks && (
                  <p className="text-zinc-500 text-xs mt-1">{item.duration_weeks} semanas</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                <button
                  onClick={() => handleToggle(item.id, item.is_public)}
                  disabled={isPending}
                  className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                    item.is_public
                      ? "bg-green-900/40 text-green-400 hover:bg-green-900/60"
                      : "bg-zinc-800 text-zinc-500 hover:text-white"
                  }`}
                >
                  {item.is_public ? "Público" : "Privado"}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={isPending}
                  className="text-xs text-red-500 hover:text-red-400 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
