import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LibraryClient, { type ExerciseLibraryItem } from "./LibraryClient";

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: items } = await supabase
    .from("exercise_library")
    .select("*")
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 page-enter">
      {/* Header + breadcrumb */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
          <Link href="/coach/dashboard" className="hover:text-zinc-300 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-zinc-400">Biblioteca</span>
        </nav>
        <h1 className="text-2xl font-bold text-white">Biblioteca de Exercícios</h1>
        <p className="text-gray-400 text-sm mt-1">
          {(items ?? []).length} exercício{(items ?? []).length !== 1 ? "s" : ""} na tua biblioteca
        </p>
      </div>

      <LibraryClient items={(items ?? []) as ExerciseLibraryItem[]} coachId={user.id} />
    </div>
  );
}
