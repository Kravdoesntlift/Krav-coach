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

type Lang = "pt" | "en";

const CATEGORY_META_DATA: Record<AchievementCategory, { pt: { label: string; description: string }; en: { label: string; description: string }; icon: string }> = {
  primeiros_passos: {
    icon: "🌱",
    pt: { label: "Primeiros Passos",  description: "O início de cada grande jornada" },
    en: { label: "First Steps",       description: "The start of every great journey" },
  },
  consistencia: {
    icon: "🔥",
    pt: { label: "Consistência",      description: "Semanas seguidas e treinos perfeitos" },
    en: { label: "Consistency",       description: "Consecutive weeks and perfect workouts" },
  },
  recordes: {
    icon: "🏆",
    pt: { label: "Recordes Pessoais", description: "Supera os teus limites" },
    en: { label: "Personal Records",  description: "Push beyond your limits" },
  },
  volume_kg: {
    icon: "⚡",
    pt: { label: "Volume Levantado",  description: "Total de toneladas movidas" },
    en: { label: "Volume Lifted",     description: "Total tonnes moved" },
  },
  total_treinos: {
    icon: "🎯",
    pt: { label: "Total de Treinos",  description: "Sessões completas acumuladas" },
    en: { label: "Total Workouts",    description: "Accumulated completed sessions" },
  },
};

export function getCategoryMeta(lang: Lang = "pt"): Record<AchievementCategory, { label: string; icon: string; description: string }> {
  return Object.fromEntries(
    Object.entries(CATEGORY_META_DATA).map(([key, val]) => [
      key,
      { label: val[lang].label, icon: val.icon, description: val[lang].description },
    ])
  ) as Record<AchievementCategory, { label: string; icon: string; description: string }>;
}

// Keep for backward compatibility (PT default)
export const CATEGORY_META = getCategoryMeta("pt");

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

export function computeAchievements(data: AchievementData, lang: Lang = "pt"): Achievement[] {
  const {
    totalWeeksWithCompletion, streak, totalCheckins, totalPRs,
    hasPerfectWeek, totalWorkouts,
    totalVolumeKg = 0, perfectWeeks = 0, totalPhotos = 0,
  } = data;

  const isEN = lang === "en";

  const volLabel = (kg: number) =>
    kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${Math.round(kg)} kg`;

  const weeks = isEN ? "weeks" : "semanas";

  return [
    // ── First steps ─────────────────────────────────────────────
    {
      id: "first_workout", icon: "🏋", category: "primeiros_passos",
      title:       isEN ? "First workout"         : "Primeiro treino",
      description: isEN ? "You completed your first workout" : "Completaste o teu primeiro treino",
      unlocked: totalWorkouts >= 1,
      progress: pct(totalWorkouts, 1), progressLabel: "",
    },
    {
      id: "first_checkin", icon: "📋", category: "primeiros_passos",
      title:       isEN ? "First check-in"        : "Primeiro check-in",
      description: isEN ? "You did your first weekly check-in" : "Fizeste o teu primeiro check-in semanal",
      unlocked: totalCheckins >= 1,
      progress: pct(totalCheckins, 1), progressLabel: "",
    },
    {
      id: "first_pr", icon: "🏆", category: "primeiros_passos",
      title:       isEN ? "First record"          : "Primeiro recorde",
      description: isEN ? "You logged your first personal record" : "Registaste o teu primeiro recorde pessoal",
      unlocked: totalPRs >= 1,
      progress: pct(totalPRs, 1), progressLabel: "",
    },
    {
      id: "first_photo", icon: "📸", category: "primeiros_passos",
      title:       isEN ? "First photo"           : "Primeira foto",
      description: isEN ? "You logged your first progress photo" : "Registaste a tua primeira foto de progresso",
      unlocked: totalPhotos >= 1,
      progress: pct(totalPhotos, 1), progressLabel: "",
    },

    // ── Consistency ──────────────────────────────────────────────
    {
      id: "perfect_week", icon: "⭐", category: "consistencia",
      title:       isEN ? "Perfect week"          : "Semana perfeita",
      description: isEN ? "You completed every workout in a week" : "Completaste todos os treinos numa semana",
      unlocked: hasPerfectWeek,
      progress: hasPerfectWeek ? 100 : 0, progressLabel: "",
    },
    {
      id: "perfect_3", icon: "✨", category: "consistencia",
      title:       isEN ? "3 perfect weeks"       : "3 semanas perfeitas",
      description: isEN ? "Three weeks without missing a single workout" : "Três semanas sem falhar um único treino",
      unlocked: perfectWeeks >= 3,
      progress: pct(perfectWeeks, 3), progressLabel: `${perfectWeeks} / 3`,
    },
    {
      id: "week_3", icon: "🔥", category: "consistencia",
      title:       isEN ? "3 weeks in a row"      : "3 semanas seguidas",
      description: isEN ? "You stayed consistent for 3 weeks" : "Mantiveste consistência durante 3 semanas",
      unlocked: streak >= 3,
      progress: pct(streak, 3), progressLabel: `${streak} / 3 ${weeks}`,
    },
    {
      id: "week_5", icon: "💪", category: "consistencia",
      title:       isEN ? "5 weeks in a row"      : "5 semanas seguidas",
      description: isEN ? "Elite dedication — 5 consecutive weeks" : "Dedicação de elite — 5 semanas consecutivas",
      unlocked: streak >= 5,
      progress: pct(streak, 5), progressLabel: `${streak} / 5 ${weeks}`,
    },
    {
      id: "week_10", icon: "🥇", category: "consistencia",
      title:       isEN ? "10 weeks"              : "10 semanas",
      description: isEN ? "Two and a half months of consistent work" : "Dois meses e meio de trabalho consistente",
      unlocked: totalWeeksWithCompletion >= 10,
      progress: pct(totalWeeksWithCompletion, 10), progressLabel: `${totalWeeksWithCompletion} / 10`,
    },
    {
      id: "week_20", icon: "👑", category: "consistencia",
      title:       isEN ? "20 weeks"              : "20 semanas",
      description: isEN ? "Legendary — almost half a year of training" : "Lendário — quase meio ano de treino",
      unlocked: totalWeeksWithCompletion >= 20,
      progress: pct(totalWeeksWithCompletion, 20), progressLabel: `${totalWeeksWithCompletion} / 20`,
    },
    {
      id: "checkins_10", icon: "✅", category: "consistencia",
      title:       isEN ? "10 check-ins"          : "10 check-ins",
      description: isEN ? "Ten weeks reporting to your coach" : "Dez semanas a reportar ao teu coach",
      unlocked: totalCheckins >= 10,
      progress: pct(totalCheckins, 10), progressLabel: `${totalCheckins} / 10`,
    },

    // ── Personal records ─────────────────────────────────────────
    {
      id: "pr_5", icon: "📈", category: "recordes",
      title:       isEN ? "5 records"             : "5 recordes",
      description: isEN ? "You logged 5 different personal records" : "Registaste 5 recordes pessoais diferentes",
      unlocked: totalPRs >= 5,
      progress: pct(totalPRs, 5), progressLabel: `${totalPRs} / 5`,
    },
    {
      id: "pr_10", icon: "🎯", category: "recordes",
      title:       isEN ? "10 records"            : "10 recordes",
      description: isEN ? "10 personal records — you're unstoppable" : "10 recordes pessoais — és imparável",
      unlocked: totalPRs >= 10,
      progress: pct(totalPRs, 10), progressLabel: `${totalPRs} / 10`,
    },

    // ── Volume lifted ────────────────────────────────────────────
    {
      id: "vol_1t", icon: "🧱", category: "volume_kg",
      title:       isEN ? "1 tonne"               : "1 tonelada",
      description: isEN ? "You lifted over 1,000 kg total" : "Levantaste mais de 1 000 kg no total",
      unlocked: totalVolumeKg >= 1_000,
      progress: pct(totalVolumeKg, 1_000), progressLabel: `${volLabel(totalVolumeKg)} / 1t`,
    },
    {
      id: "vol_10t", icon: "🚛", category: "volume_kg",
      title:       isEN ? "10 tonnes"             : "10 toneladas",
      description: isEN ? "10,000 kg lifted — truck level" : "10 000 kg levantados — nível caminhão",
      unlocked: totalVolumeKg >= 10_000,
      progress: pct(totalVolumeKg, 10_000), progressLabel: `${volLabel(totalVolumeKg)} / 10t`,
    },
    {
      id: "vol_50t", icon: "🚢", category: "volume_kg",
      title:       isEN ? "50 tonnes"             : "50 toneladas",
      description: isEN ? "You lifted the equivalent of a bus" : "Levantaste o equivalente a um autocarro",
      unlocked: totalVolumeKg >= 50_000,
      progress: pct(totalVolumeKg, 50_000), progressLabel: `${volLabel(totalVolumeKg)} / 50t`,
    },
    {
      id: "vol_100t", icon: "🏗️", category: "volume_kg",
      title:       isEN ? "100 tonnes"            : "100 toneladas",
      description: isEN ? "100,000 kg — you're a machine" : "100 000 kg — és uma máquina",
      unlocked: totalVolumeKg >= 100_000,
      progress: pct(totalVolumeKg, 100_000), progressLabel: `${volLabel(totalVolumeKg)} / 100t`,
    },

    // ── Total workouts ───────────────────────────────────────────
    {
      id: "workouts_25", icon: "🎖️", category: "total_treinos",
      title:       isEN ? "25 workouts"           : "25 treinos",
      description: isEN ? "Twenty-five complete sessions" : "Vinte e cinco sessões completas",
      unlocked: totalWorkouts >= 25,
      progress: pct(totalWorkouts, 25), progressLabel: `${totalWorkouts} / 25`,
    },
    {
      id: "workouts_50", icon: "🔰", category: "total_treinos",
      title:       isEN ? "50 workouts"           : "50 treinos",
      description: isEN ? "Fifty workouts — real dedication" : "Cinquenta treinos — dedicação real",
      unlocked: totalWorkouts >= 50,
      progress: pct(totalWorkouts, 50), progressLabel: `${totalWorkouts} / 50`,
    },
    {
      id: "workouts_100", icon: "💯", category: "total_treinos",
      title:       isEN ? "100 workouts"          : "100 treinos",
      description: isEN ? "One hundred workouts — legendary" : "Centena de treinos — lendário",
      unlocked: totalWorkouts >= 100,
      progress: pct(totalWorkouts, 100), progressLabel: `${totalWorkouts} / 100`,
    },
  ];
}
