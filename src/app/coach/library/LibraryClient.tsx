"use client";

import { useState, useTransition, useOptimistic } from "react";
import { addExercise, updateExercise, deleteExercise, seedDefaultLibrary } from "./actions";

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

const CATEGORY_ORDER = [
  "Peito", "Costas", "Ombros", "Bíceps", "Tríceps",
  "Quadríceps", "Glúteos & Posteriores", "Gémeos", "Core & Abdómen", "Outros",
];

// Strip accents so Portuguese characters never fail includes() due to NFC/NFD encoding mismatches
function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function getCategory(name: string, muscleGroups: string[]): string {
  const f = norm(muscleGroups[0] ?? "");
  const n = norm(name);

  // ── by first muscle group ──────────────────────────────────────────────────
  if (f.includes("peito")) return "Peito";
  if (f.includes("dorsal") || f.includes("costas") || f.includes("trapezio") || f.includes("romboide") || f.includes("romboi")) return "Costas";
  if (f.includes("deltoide") || f.includes("ombro")) return "Ombros";
  if (f.includes("biceps") || f.includes("braquial")) return "Bíceps";
  if (f.includes("triceps")) return "Tríceps";
  if (f.includes("quadriceps")) return "Quadríceps";
  if (f.includes("gluteo") || f.includes("isquiotibiais") || f.includes("lombar") || f.includes("adutor")) return "Glúteos & Posteriores";
  if (f.includes("gastrocnemio") || f.includes("soleo") || f.includes("gemeo")) return "Gémeos";
  if (f.includes("core") || f.includes("abdominal") || f.includes("obliquo") || f.includes("reto")) return "Core & Abdómen";

  // ── fallback by exercise name ──────────────────────────────────────────────
  if (n.includes("supino") || n.includes("crucifixo") || n.includes("pec deck") || n.includes("chest press") || n.includes("flexoes") || n.includes("flexao")) return "Peito";
  if (n.includes("remada") || n.includes("pulldown") || n.includes("puxada") || n.includes("dominada") || n.includes("chin-up") || n.includes("peso morto") || n.includes("deadlift") || n.includes("pullover") || n.includes("straight arm")) return "Costas";
  if (n.includes("press militar") || n.includes("arnold") || n.includes("elevacoes") || n.includes("passaro") || n.includes("face pull") || n.includes("upright") || n.includes("shrug") || n.includes("encolher") || n.includes("pike push")) return "Ombros";
  if (n.includes("rosca") || n.includes("curl") || n.includes("hammer")) return "Bíceps";
  if (n.includes("triceps") || n.includes("skull") || n.includes("pushdown") || n.includes("mergulhos") || n.includes("kickback") || n.includes("extensao acima")) return "Tríceps";
  if (n.includes("agachamento") || n.includes("squat") || n.includes("leg press") || n.includes("leg extension") || n.includes("extensao de pernas") || n.includes("afundo") || n.includes("hack") || n.includes("step up") || n.includes("lunges")) return "Quadríceps";
  if (n.includes("hip thrust") || n.includes("glute bridge") || n.includes("romanian") || n.includes("leg curl") || n.includes("good morning") || n.includes("abducao") || n.includes("aducao") || n.includes("kick back") || n.includes("superman")) return "Glúteos & Posteriores";
  if (n.includes("calcanhar") || n.includes("calf raise")) return "Gémeos";
  if (n.includes("prancha") || n.includes("plank") || n.includes("crunch") || n.includes("elevacao de pernas") || n.includes("russian") || n.includes("ab wheel") || n.includes("mountain climber") || n.includes("dead bug")) return "Core & Abdómen";

  return "Outros";
}

const EMPTY_FORM = { name: "", muscle_groups: "", description: "", video_url: "" };

function EditModal({
  item,
  onClose,
  onSaved,
}: {
  item: ExerciseLibraryItem;
  onClose: () => void;
  onSaved: (updated: ExerciseLibraryItem) => void;
}) {
  const [form, setForm] = useState({
    name: item.name,
    muscle_groups: item.muscle_groups.join(", "),
    description: item.description ?? "",
    video_url: item.video_url ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    if (!form.name.trim()) { setError("O nome é obrigatório."); return; }
    setError(null);
    const groups = form.muscle_groups.split(",").map((s) => s.trim()).filter(Boolean);
    startTransition(async () => {
      const res = await updateExercise(item.id, {
        name: form.name.trim(),
        muscle_groups: groups,
        description: form.description.trim() || null,
        video_url: form.video_url.trim() || null,
      });
      if (res.error) { setError(res.error); return; }
      onSaved({ ...item, name: form.name.trim(), muscle_groups: groups, description: form.description.trim() || null, video_url: form.video_url.trim() || null });
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-lg rounded-2xl p-6 space-y-4 animate-fade-in" style={{ background: "#111114", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-lg">Editar exercício</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">✕</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label">Nome *</label>
            <input type="text" className="input w-full" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Grupos musculares (separados por vírgula)</label>
            <input type="text" className="input w-full" placeholder="Ex: Peito, Tríceps" value={form.muscle_groups} onChange={(e) => setForm((f) => ({ ...f, muscle_groups: e.target.value }))} />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea className="input w-full min-h-[80px] resize-none text-sm" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">URL do vídeo</label>
            <input type="url" className="input w-full" placeholder="https://youtube.com/..." value={form.video_url} onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))} />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-white transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={pending} className="btn-primary text-sm">{pending ? "A guardar..." : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}

function ExerciseCard({
  item,
  onDelete,
  onEdit,
}: {
  item: ExerciseLibraryItem;
  onDelete: (id: string) => void;
  onEdit: (item: ExerciseLibraryItem) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    startTransition(async () => {
      onDelete(item.id);
      await deleteExercise(item.id);
    });
  }

  return (
    <div className="card p-4 flex flex-col gap-3 relative group">
      {/* Action buttons */}
      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(item)}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:bg-brand-gold/20 hover:text-brand-gold transition-colors"
          title="Editar"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current">
            <path d="M12.854 1.146a.5.5 0 0 0-.707 0L10.5 2.793 13.207 5.5l1.647-1.647a.5.5 0 0 0 0-.707zm-2.354 3.061L3 11.707V14h2.293l7.5-7.5z"/>
          </svg>
        </button>
        <button
          onClick={handleDelete}
          disabled={pending}
          className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-colors ${confirmDelete ? "bg-red-500 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-red-500/20 hover:text-red-400"}`}
          title={confirmDelete ? "Confirmar eliminação" : "Eliminar"}
          onBlur={() => setConfirmDelete(false)}
        >
          {confirmDelete ? "!" : "×"}
        </button>
      </div>

      <div className="min-w-0 pr-16">
        <h3 className="font-bold text-white leading-tight text-sm">{item.name}</h3>
        {item.muscle_groups.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.muscle_groups.slice(0, 3).map((mg) => (
              <span key={mg} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.22)", color: "#C9A84C" }}>
                {mg}
              </span>
            ))}
          </div>
        )}
      </div>

      {item.description && (
        <p className="text-xs text-zinc-500 leading-relaxed">{item.description}</p>
      )}

      {item.video_url ? (
        <a href={item.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-brand-gold hover:underline w-fit mt-auto">
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current"><path d="M2 2.5A1.5 1.5 0 0 1 3.5 1h9A1.5 1.5 0 0 1 14 2.5v11a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5zm5.5 2.31v6.38L11 8z" /></svg>
          Ver vídeo
        </a>
      ) : (
        <button onClick={() => onEdit(item)} className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-400 transition-colors w-fit mt-auto">
          <svg viewBox="0 0 16 16" className="w-3 h-3 fill-current"><path d="M8 1a.5.5 0 0 1 .5.5v6h6a.5.5 0 0 1 0 1h-6v6a.5.5 0 0 1-1 0v-6h-6a.5.5 0 0 1 0-1h6v-6A.5.5 0 0 1 8 1"/></svg>
          Adicionar vídeo
        </button>
      )}
    </div>
  );
}

export default function LibraryClient({ items, coachId }: Props) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ExerciseLibraryItem | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const [optimisticItems, updateOptimisticItems] = useOptimistic(
    items,
    (state: ExerciseLibraryItem[], action: { type: "add"; item: ExerciseLibraryItem } | { type: "delete"; id: string } | { type: "update"; item: ExerciseLibraryItem }) => {
      if (action.type === "add") return [action.item, ...state];
      if (action.type === "delete") return state.filter((i) => i.id !== action.id);
      if (action.type === "update") return state.map((i) => i.id === action.item.id ? action.item : i);
      return state;
    }
  );

  const filtered = optimisticItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.muscle_groups.some((mg) => mg.toLowerCase().includes(search.toLowerCase()))
  );

  // Group by category
  const grouped = CATEGORY_ORDER.reduce<Record<string, ExerciseLibraryItem[]>>((acc, cat) => {
    const inCat = filtered.filter((item) => getCategory(item.name, item.muscle_groups) === cat);
    if (inCat.length > 0) acc[cat] = inCat;
    return acc;
  }, {});

  function toggleGroup(cat: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  function handleAdd() {
    if (!form.name.trim()) { setFormError("O nome é obrigatório."); return; }
    setFormError(null);
    const muscleGroups = form.muscle_groups.split(",").map((s) => s.trim()).filter(Boolean);
    const optimisticItem: ExerciseLibraryItem = {
      id: `temp-${Date.now()}`, coach_id: coachId, name: form.name.trim(),
      muscle_groups: muscleGroups, description: form.description.trim() || null,
      video_url: form.video_url.trim() || null, created_at: new Date().toISOString(),
    };
    startTransition(async () => {
      updateOptimisticItems({ type: "add", item: optimisticItem });
      const res = await addExercise({ name: form.name.trim(), muscle_groups: muscleGroups, description: form.description.trim() || null, video_url: form.video_url.trim() || null });
      if (res.error) { setFormError(res.error); } else { setForm(EMPTY_FORM); setShowForm(false); }
    });
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg viewBox="0 0 20 20" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 fill-zinc-500 pointer-events-none">
            <path fillRule="evenodd" d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM2 8a6 6 0 1 1 10.89 3.476l4.817 4.817a1 1 0 0 1-1.414 1.414l-4.816-4.816A6 6 0 0 1 2 8z" clipRule="evenodd" />
          </svg>
          <input type="text" placeholder="Pesquisar exercícios ou grupo muscular..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9 w-full" />
        </div>
        <button onClick={() => { setShowForm((v) => !v); setFormError(null); }} className="btn-primary whitespace-nowrap">
          {showForm ? "Cancelar" : "+ Novo exercício"}
        </button>
        {items.length === 0 && (
          <button
            onClick={() => { setSeedMsg(null); startTransition(async () => { const res = await seedDefaultLibrary(); setSeedMsg(res.error ? res.error : `✅ ${res.count} exercícios importados!`); }); }}
            disabled={pending}
            className="whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
            style={{ borderColor: "rgba(201,168,76,0.28)", color: "#C9A84C", background: "rgba(201,168,76,0.05)" }}
          >
            {pending ? "A importar..." : "⬇ Importar biblioteca padrão"}
          </button>
        )}
      </div>

      {seedMsg && <p className="text-sm font-medium" style={{ color: seedMsg.startsWith("✅") ? "#C9A84C" : "#f87171" }}>{seedMsg}</p>}

      {/* Add form */}
      {showForm && (
        <div className="card p-5 space-y-4 animate-fade-in">
          <h3 className="font-semibold text-white">Novo exercício</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nome *</label>
              <input type="text" className="input w-full" placeholder="Ex: Agachamento" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Grupos musculares (separados por vírgula)</label>
              <input type="text" className="input w-full" placeholder="Ex: Quadríceps, Glúteos" value={form.muscle_groups} onChange={(e) => setForm((f) => ({ ...f, muscle_groups: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Descrição (opcional)</label>
            <textarea className="input w-full min-h-[80px] resize-none" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">URL do vídeo (opcional)</label>
            <input type="url" className="input w-full" placeholder="https://youtube.com/..." value={form.video_url} onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))} />
          </div>
          {formError && <p className="text-red-400 text-sm">{formError}</p>}
          <div className="flex justify-end gap-3">
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(null); }} className="px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-white transition-colors">Cancelar</button>
            <button onClick={handleAdd} disabled={pending} className="btn-primary text-sm">{pending ? "A guardar..." : "Guardar exercício"}</button>
          </div>
        </div>
      )}

      {/* Grouped list */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center space-y-4">
          <div className="text-5xl">🏋️</div>
          <p className="text-zinc-400 text-sm">{search ? `Nenhum resultado para "${search}".` : "Biblioteca vazia."}</p>
          {!search && <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Adicionar primeiro exercício</button>}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, exs]) => {
            const isCollapsed = collapsedGroups.has(cat);
            const withVideo = exs.filter((e) => e.video_url).length;
            return (
              <div key={cat} className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(cat)}
                  className="w-full flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-white/[0.03]"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white">{cat}</span>
                    <span className="text-xs text-zinc-500">{exs.length} exercício{exs.length !== 1 ? "s" : ""}</span>
                    {withVideo > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(201,168,76,0.1)", color: "#C9A84C" }}>
                        {withVideo} vídeo{withVideo !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <svg viewBox="0 0 20 20" className={`w-4 h-4 fill-zinc-500 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}>
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 0 1 1.414 0L10 10.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Exercises grid */}
                {!isCollapsed && (
                  <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    {exs.map((item) => (
                      <ExerciseCard
                        key={item.id}
                        item={item}
                        onDelete={(id) => updateOptimisticItems({ type: "delete", id })}
                        onEdit={setEditingItem}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit modal */}
      {editingItem && (
        <EditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={(updated) => {
            updateOptimisticItems({ type: "update", item: updated });
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}
