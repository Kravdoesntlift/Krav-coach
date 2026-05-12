export type AchievementCategory =
  | "primeiros_passos"
  | "consistencia"
  | "recordes"
  | "volume_kg"
  | "total_treinos";

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number;       // 0-100
  progressLabel: string;
  category: AchievementCategory;
}

export const CATEGORY_META: Record<AchievementCategory, { label: string; icon: string; description: string }> = {
  primeiros_passos: { label: "Primeiros Passos",    icon: "🌱", description: "O início de cada grande jornada" },
  consistencia:     { label: "Consistência",        icon: "🔥", description: "Semanas seguidas e treinos perfeitos" },
  recordes:         { label: "Recordes Pessoais",   icon: "🏆", description: "Supera os teus limites" },
  volume_kg:        { label: "Volume Levantado",    icon: "⚡", description: "Total de toneladas movidas" },
  total_treinos:    { label: "Total de Treinos",    icon: "🎯", description: "Sessões completas acumuladas" },
};

interface AchievementData {
  totalWeeksWithCompletion: number;
  streak: number;
  totalCheckins: number;
  totalPRs: number;
  hasPerfectWeek: boolean;
  totalWorkouts: number;
  totalVolumeKg?: number;
  perfectWeeks?: number;
  totalPhotos?: number;
}

function pct(current: number, target: number): number {
  return Math.min(100, Math.round((current / target) * 100));
}

export function computeAchievements(data: AchievementData): Achievement[] {
  const {
    totalWeeksWithCompletion, streak, totalCheckins, totalPRs,
    hasPerfectWeek, totalWorkouts,
    totalVolumeKg = 0, perfectWeeks = 0, totalPhotos = 0,
  } = data;

  const volLabel = (kg: number) =>
    kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${Math.round(kg)} kg`;

  return [
    // ── Primeiros passos ─────────────────────────────────────────
    {
      id: "first_workout",  icon: "🏋",  category: "primeiros_passos",
      title: "Primeiro treino",
      description: "Completaste o teu primeiro treino",
      unlocked: totalWorkouts >= 1,
      progress: pct(totalWorkouts, 1),  progressLabel: "",
    },
    {
      id: "first_checkin",  icon: "📋",  category: "primeiros_passos",
      title: "Primeiro check-in",
      description: "Fizeste o teu primeiro check-in semanal",
      unlocked: totalCheckins >= 1,
      progress: pct(totalCheckins, 1),  progressLabel: "",
    },
    {
      id: "first_pr",  icon: "🏆",  category: "primeiros_passos",
      title: "Primeiro recorde",
      description: "Registaste o teu primeiro recorde pessoal",
      unlocked: totalPRs >= 1,
      progress: pct(totalPRs, 1),  progressLabel: "",
    },
    {
      id: "first_photo",  icon: "📸",  category: "primeiros_passos",
      title: "Primeira foto",
      description: "Registaste a tua primeira foto de progresso",
      unlocked: totalPhotos >= 1,
      progress: pct(totalPhotos, 1),  progressLabel: "",
    },

    // ── Consistência ─────────────────────────────────────────────
    {
      id: "perfect_week",  icon: "⭐",  category: "consistencia",
      title: "Semana perfeita",
      description: "Completaste todos os treinos numa semana",
      unlocked: hasPerfectWeek,
      progress: hasPerfectWeek ? 100 : 0,  progressLabel: "",
    },
    {
      id: "perfect_3",  icon: "✨",  category: "consistencia",
      title: "3 semanas perfeitas",
      description: "Três semanas sem falhar um único treino",
      unlocked: perfectWeeks >= 3,
      progress: pct(perfectWeeks, 3),  progressLabel: `${perfectWeeks} / 3`,
    },
    {
      id: "week_3",  icon: "🔥",  category: "consistencia",
      title: "3 semanas seguidas",
      description: "Mantiveste consistência durante 3 semanas",
      unlocked: streak >= 3,
      progress: pct(streak, 3),  progressLabel: `${streak} / 3 semanas`,
    },
    {
      id: "week_5",  icon: "💪",  category: "consistencia",
      title: "5 semanas seguidas",
      description: "Dedicação de elite — 5 semanas consecutivas",
      unlocked: streak >= 5,
      progress: pct(streak, 5),  progressLabel: `${streak} / 5 semanas`,
    },
    {
      id: "week_10",  icon: "🥇",  category: "consistencia",
      title: "10 semanas",
      description: "Dois meses e meio de trabalho consistente",
      unlocked: totalWeeksWithCompletion >= 10,
      progress: pct(totalWeeksWithCompletion, 10),  progressLabel: `${totalWeeksWithCompletion} / 10`,
    },
    {
      id: "week_20",  icon: "👑",  category: "consistencia",
      title: "20 semanas",
      description: "Lendário — quase meio ano de treino",
      unlocked: totalWeeksWithCompletion >= 20,
      progress: pct(totalWeeksWithCompletion, 20),  progressLabel: `${totalWeeksWithCompletion} / 20`,
    },
    {
      id: "checkins_10",  icon: "✅",  category: "consistencia",
      title: "10 check-ins",
      description: "Dez semanas a reportar ao teu coach",
      unlocked: totalCheckins >= 10,
      progress: pct(totalCheckins, 10),  progressLabel: `${totalCheckins} / 10`,
    },

    // ── Recordes pessoais ────────────────────────────────────────
    {
      id: "pr_5",  icon: "📈",  category: "recordes",
      title: "5 recordes",
      description: "Registaste 5 recordes pessoais diferentes",
      unlocked: totalPRs >= 5,
      progress: pct(totalPRs, 5),  progressLabel: `${totalPRs} / 5`,
    },
    {
      id: "pr_10",  icon: "🎯",  category: "recordes",
      title: "10 recordes",
      description: "10 recordes pessoais — és imparável",
      unlocked: totalPRs >= 10,
      progress: pct(totalPRs, 10),  progressLabel: `${totalPRs} / 10`,
    },

    // ── Volume levantado ─────────────────────────────────────────
    {
      id: "vol_1t",  icon: "🧱",  category: "volume_kg",
      title: "1 tonelada",
      description: "Levantaste mais de 1 000 kg no total",
      unlocked: totalVolumeKg >= 1_000,
      progress: pct(totalVolumeKg, 1_000),  progressLabel: `${volLabel(totalVolumeKg)} / 1t`,
    },
    {
      id: "vol_10t",  icon: "🚛",  category: "volume_kg",
      title: "10 toneladas",
      description: "10 000 kg levantados — nível caminhão",
      unlocked: totalVolumeKg >= 10_000,
      progress: pct(totalVolumeKg, 10_000),  progressLabel: `${volLabel(totalVolumeKg)} / 10t`,
    },
    {
      id: "vol_50t",  icon: "🚢",  category: "volume_kg",
      title: "50 toneladas",
      description: "Levantaste o equivalente a um autocarro",
      unlocked: totalVolumeKg >= 50_000,
      progress: pct(totalVolumeKg, 50_000),  progressLabel: `${volLabel(totalVolumeKg)} / 50t`,
    },
    {
      id: "vol_100t",  icon: "🏗️",  category: "volume_kg",
      title: "100 toneladas",
      description: "100 000 kg — és uma máquina",
      unlocked: totalVolumeKg >= 100_000,
      progress: pct(totalVolumeKg, 100_000),  progressLabel: `${volLabel(totalVolumeKg)} / 100t`,
    },

    // ── Total de treinos ─────────────────────────────────────────
    {
      id: "workouts_25",  icon: "🎖️",  category: "total_treinos",
      title: "25 treinos",
      description: "Vinte e cinco sessões completas",
      unlocked: totalWorkouts >= 25,
      progress: pct(totalWorkouts, 25),  progressLabel: `${totalWorkouts} / 25`,
    },
    {
      id: "workouts_50",  icon: "🔰",  category: "total_treinos",
      title: "50 treinos",
      description: "Cinquenta treinos — dedicação real",
      unlocked: totalWorkouts >= 50,
      progress: pct(totalWorkouts, 50),  progressLabel: `${totalWorkouts} / 50`,
    },
    {
      id: "workouts_100",  icon: "💯",  category: "total_treinos",
      title: "100 treinos",
      description: "Centena de treinos — lendário",
      unlocked: totalWorkouts >= 100,
      progress: pct(totalWorkouts, 100),  progressLabel: `${totalWorkouts} / 100`,
    },
  ];
}
