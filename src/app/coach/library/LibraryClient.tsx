"use client";

import { useState, useTransition, useOptimistic } from "react";
import { addExercise, deleteExercise } from "./actions";

export interface ExerciseLibraryItem {
  id: string;
  coach_id: string;
  name: string;
  muscle_groups: string[];
  description: string | null;
  video_url: string | null;
  created_at: string;
}

interface Props {
  items: ExerciseLibraryItem[];
  coachId: string;
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
      style={{
        background: "linear-gradient(135deg,rgba(201,168,76,0.2),rgba(201,168,76,0.08))",
        border: "1px solid rgba(201,168,76,0.2)",
        color: "#C9A84C",
      }}
    >
      {initials}
    </div>
  );
}

function ExerciseCard({
  item,
  onDelete,
}: {
  item: ExerciseLibraryItem;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startTransition(async () => {
      onDelete(item.id);
      await deleteExercise(item.id);
    });
  }

  return (
    <div className="card p-4 flex flex-col gap-3 relative group">
      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={pending}
        className={`absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-colors
          ${confirmDelete
            ? "bg-red-500 text-white"
            : "bg-zinc-800 text-zinc-400 hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100"
          }`}
        title={confirmDelete ? "Confirmar eliminação" : "Eliminar"}
        onBlur={() => setConfirmDelete(false)}
      >
        {confirmDelete ? "!" : "×"}
      </button>

      <div className="flex items-start gap-3">
        <Avatar name={item.name} />
        <div className="min-w-0">
          <h3 className="font-bold text-white leading-tight truncate pr-8">{item.name}</h3>
          {item.muscle_groups.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {item.muscle_groups.map((mg) => (
                <span
                  key={mg}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(201,168,76,0.12)",
                    border: "1px solid rgba(201,168,76,0.25)",
                    color: "#C9A84C",
                  }}
                >
                  {mg}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {item.description && (
        <p className="text-sm text-zinc-400 line-clamp-2">{item.description}</p>
      )}

      {item.video_url && (
        <a
          href={item.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-brand-gold hover:underline w-fit"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current">
            <path d="M2 2.5A1.5 1.5 0 0 1 3.5 1h9A1.5 1.5 0 0 1 14 2.5v11a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5zm5.5 2.31v6.38L11 8z" />
          </svg>
          Ver vídeo
        </a>
      )}
    </div>
  );
}

const EMPTY_FORM = {
  name: "",
  muscle_groups: "",
  description: "",
  video_url: "",
};

export default function LibraryClient({ items, coachId }: Props) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [optimisticItems, updateOptimisticItems] = useOptimistic(
    items,
    (
      state: ExerciseLibraryItem[],
      action: { type: "add"; item: ExerciseLibraryItem } | { type: "delete"; id: string }
    ) => {
      if (action.type === "add") return [action.item, ...state];
      if (action.type === "delete") return state.filter((i) => i.id !== action.id);
      return state;
    }
  );

  const filtered = optimisticItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.muscle_groups.some((mg) => mg.toLowerCase().includes(search.toLowerCase()))
  );

  function handleAdd() {
    if (!form.name.trim()) {
      setFormError("O nome é obrigatório.");
      return;
    }
    setFormError(null);
    const muscleGroups = form.muscle_groups
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const optimisticItem: ExerciseLibraryItem = {
      id: `temp-${Date.now()}`,
      coach_id: coachId,
      name: form.name.trim(),
      muscle_groups: muscleGroups,
      description: form.description.trim() || null,
      video_url: form.video_url.trim() || null,
      created_at: new Date().toISOString(),
    };

    startTransition(async () => {
      updateOptimisticItems({ type: "add", item: optimisticItem });
      const res = await addExercise({
        name: form.name.trim(),
        muscle_groups: muscleGroups,
        description: form.description.trim() || null,
        video_url: form.video_url.trim() || null,
      });
      if (res.error) {
        setFormError(res.error);
      } else {
        setForm(EMPTY_FORM);
        setShowForm(false);
      }
    });
  }

  function handleDeleteOptimistic(id: string) {
    updateOptimisticItems({ type: "delete", id });
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 20 20"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 fill-zinc-500 pointer-events-none"
          >
            <path fillRule="evenodd" d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM2 8a6 6 0 1 1 10.89 3.476l4.817 4.817a1 1 0 0 1-1.414 1.414l-4.816-4.816A6 6 0 0 1 2 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Pesquisar exercícios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setFormError(null); }}
          className="btn-primary whitespace-nowrap"
        >
          {showForm ? "Cancelar" : "+ Adicionar exercício"}
        </button>
      </div>

      {/* Inline add form */}
      {showForm && (
        <div className="card p-5 space-y-4 animate-fade-in">
          <h3 className="font-semibold text-white">Novo exercício</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nome *</label>
              <input
                type="text"
                className="input w-full"
                placeholder="Ex: Agachamento"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Grupos musculares (separados por vírgula)</label>
              <input
                type="text"
                className="input w-full"
                placeholder="Ex: Quadriceps, Glúteos"
                value={form.muscle_groups}
                onChange={(e) => setForm((f) => ({ ...f, muscle_groups: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="label">Descrição (opcional)</label>
            <textarea
              className="input w-full min-h-[80px] resize-none"
              placeholder="Notas sobre execução, variações..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">URL do vídeo (opcional)</label>
            <input
              type="text"
              className="input w-full"
              placeholder="https://youtube.com/..."
              value={form.video_url}
              onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
            />
          </div>

          {formError && (
            <p className="text-red-400 text-sm">{formError}</p>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(null); }}
              className="px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={pending}
              className="btn-primary text-sm"
            >
              {pending ? "A guardar..." : "Guardar exercício"}
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center space-y-4">
          <div className="text-5xl">🏋️</div>
          <p className="text-zinc-400 text-sm">
            {search
              ? `Nenhum exercício encontrado para "${search}".`
              : "Ainda não adicionaste exercícios à biblioteca."}
          </p>
          {!search && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary text-sm"
            >
              + Adicionar primeiro exercício
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <ExerciseCard
              key={item.id}
              item={item}
              onDelete={handleDeleteOptimistic}
            />
          ))}
        </div>
      )}
    </div>
  );
}
