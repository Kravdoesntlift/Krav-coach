import { buildBasePlan, type Equipment, type Lang } from "@/lib/training/base-plan";

/**
 * The free guide, in two versions and two languages.
 *
 * The training block is not written here: it comes out of the same generator
 * that writes the plan inside the app. Someone who reads the guide and then
 * starts a trial has to meet the same method, not two documents that drifted
 * apart the first time either was edited.
 *
 * Two versions, because the gym guide is useless to someone training in a
 * living room. "Do push-ups instead" is not an adaptation, it is a shrug.
 */

export type GuideVariant = "gym" | "home";

export const GUIDE_VARIANTS: GuideVariant[] = ["gym", "home"];

/** What the generator is asked for, per version of the guide. */
const EQUIPMENT_FOR: Record<GuideVariant, Equipment> = {
  gym: "gym_full",
  home: "home_weights",
};

/** The five day week the guide is built around. Monday first. */
const GUIDE_DAYS = [1, 2, 4, 5, 6];

export function guidePlan(variant: GuideVariant, lang: Lang) {
  return buildBasePlan({
    level: "intermediate",
    equipment: EQUIPMENT_FOR[variant],
    goal: "gain_muscle",
    trainingDays: GUIDE_DAYS,
    sessionMinutes: 60,
    lang,
  });
}

interface Block {
  title: string;
  body: string;
}

export interface GuideCopy {
  kicker: string;
  title: string;
  subtitle: string;
  intro: string;
  contents: string[];
  principlesTitle: string;
  principles: Block[];
  truth: Block;
  planTitle: string;
  planIntro: string;
  planNote: string;
  references: { value: string; label: string }[];
  nutritionTitle: string;
  nutritionDisclaimer: string;
  nutrition: Block[];
  mistakesTitle: string;
  mistakes: Block[];
  upgradeTitle: string;
  upgradeIntro: string;
  upgradeFree: { title: string; items: string[] };
  upgradePaid: { title: string; items: string[] };
  upgradeCta: string;
  upgradeUrl: string;
  footer: string;
  supplementLabel: string;
  supplementValue: string;
}

const SHARED_PT: Omit<GuideCopy, "kicker" | "title" | "subtitle" | "intro" | "contents" | "planTitle" | "planIntro" | "planNote" | "mistakes"> = {
  principlesTitle: "Os 3 princípios que constroem músculo",
  principles: [
    {
      title: "Tensão mecânica, o único motor que importa",
      body: "O músculo cresce quando é forçado a gerar força contra resistência. Não é o cansaço nem a dor no dia seguinte, é a tensão aplicada à fibra. A fase excêntrica, a descida controlada de 2 a 3 segundos, é onde essa tensão é máxima. Nunca a desperdices.",
    },
    {
      title: "Sobrecarga progressiva, bater o recorde da semana passada",
      body: "Se fizeste 8 repetições, o objetivo na próxima semana são 9, ou as mesmas 8 com mais peso. Sem progressão não há crescimento. Regista os treinos: quem não mede, não melhora.",
    },
    {
      title: "Recuperação, onde o músculo realmente cresce",
      body: "O treino é o estímulo, o crescimento acontece no descanso. Dormir 7 a 8 horas é o anabolismo mais barato que existe. Uma semana mais leve de 4 em 4 semanas não é fraqueza, é inteligência.",
    },
  ],
  truth: {
    title: "A verdade que a maioria ignora",
    body: "Falhas não por falta de vontade, mas por mudares de programa de 3 em 3 semanas. Escolhe um método, segue 90 dias, avalia depois. Consistência bate perfeição, sempre.",
  },
  references: [
    { value: "3-4", label: "séries por exercício" },
    { value: "6-12", label: "reps nos compostos" },
    { value: "10-20", label: "reps nos isolamentos" },
    { value: "2-3min", label: "descanso nas séries pesadas" },
  ],
  nutritionTitle: "Alimentação, princípios gerais",
  nutritionDisclaimer:
    "As informações seguintes são de carácter geral e educativo e não substituem acompanhamento nutricional profissional. Para um plano alimentar personalizado, consulta um nutricionista certificado.",
  nutrition: [
    { title: "Superavit calórico moderado", body: "Para crescer, come ligeiramente acima do teu gasto diário, cerca de 200 a 300 kcal. Um ganho de 0,5 a 1 kg por mês indica que estás no caminho certo." },
    { title: "Proteína, o pilar fundamental", body: "A investigação aponta para 1,6 a 2 g por kg de peso corporal por dia. Para 70 kg são 112 a 140 g por dia." },
    { title: "Hidratos, o teu combustível", body: "São a principal fonte de energia para treino intenso. Arroz, batata, aveia, massa. Não os elimines se queres crescer." },
    { title: "Consistência acima de tudo", body: "Não existe dieta perfeita, existe uma boa dieta feita de forma consistente. Uma refeição fora do plano não desfaz uma semana de trabalho." },
  ],
  mistakesTitle: "Os erros que te travam",
  supplementLabel: "Suplementação oficial",
  supplementValue: "myprotein.pt · código MPKRAV",
  footer: "@kravdoesntlift · zerando máquinas medíocres",
  upgradeTitle: "O que muda se assinares",
  upgradeIntro:
    "Este guia é o método. Dá para fazer sozinho e funciona, se fores consistente. O que a mensalidade acrescenta é a parte que quase ninguém consegue fazer a si próprio.",
  upgradeFree: {
    title: "Grátis, este guia e o trial",
    items: [
      "Este plano, o mesmo para toda a gente com o teu tipo de treino",
      "Na app, ajustado aos dias que escolheres, ao teu nível e ao teu material",
      "Registo de séries e comparação com a semana anterior",
      "7 dias de acesso completo, sem cartão",
    ],
  },
  upgradePaid: {
    title: "Com a mensalidade",
    items: [
      "Plano escrito pelo André a partir do que registaste, não gerado",
      "Ajustes todas as semanas com base na tua evolução real",
      "Exercícios trocados quando algo te dói ou o ginásio está cheio",
      "Acompanhamento nutricional adaptado ao teu objetivo",
      "Chat direto com o coach, com resposta no mesmo dia",
    ],
  },
  upgradeCta: "Começar o trial de 7 dias",
  upgradeUrl: "https://www.kravcoaching.com/start",
};

const SHARED_EN: Omit<GuideCopy, "kicker" | "title" | "subtitle" | "intro" | "contents" | "planTitle" | "planIntro" | "planNote" | "mistakes"> = {
  principlesTitle: "The 3 principles that build muscle",
  principles: [
    {
      title: "Mechanical tension, the only engine that matters",
      body: "Muscle grows when it is forced to produce force against resistance. Not soreness, not exhaustion, tension on the fibre. The eccentric, a controlled 2 to 3 second descent, is where that tension peaks. Never waste it.",
    },
    {
      title: "Progressive overload, beating last week",
      body: "If you did 8 reps, next week the target is 9, or the same 8 with more load. No progression, no growth. Log your sessions: what is not measured does not improve.",
    },
    {
      title: "Recovery, where muscle is actually built",
      body: "Training is the stimulus, growth happens in the rest. Seven to eight hours of sleep is the cheapest anabolic there is. A lighter week every fourth week is not weakness, it is planning.",
    },
  ],
  truth: {
    title: "The part most people ignore",
    body: "You do not fail for lack of effort, you fail by changing programme every three weeks. Pick a method, run it for 90 days, judge it after. Consistency beats perfection, every time.",
  },
  references: [
    { value: "3-4", label: "sets per exercise" },
    { value: "6-12", label: "reps on compounds" },
    { value: "10-20", label: "reps on isolation" },
    { value: "2-3min", label: "rest on heavy sets" },
  ],
  nutritionTitle: "Nutrition, general principles",
  nutritionDisclaimer:
    "The following is general educational information and does not replace professional nutrition advice. For a personalised meal plan, speak to a registered nutritionist.",
  nutrition: [
    { title: "A moderate calorie surplus", body: "To grow, eat slightly above your daily expenditure, around 200 to 300 kcal. Gaining 0.5 to 1 kg a month means you are on track." },
    { title: "Protein, the foundation", body: "The research points to 1.6 to 2 g per kg of bodyweight per day. At 70 kg that is 112 to 140 g a day." },
    { title: "Carbohydrates, your fuel", body: "They are the main energy source for hard training. Rice, potato, oats, pasta. Do not cut them if you want to grow." },
    { title: "Consistency above all", body: "There is no perfect diet, there is a good diet done consistently. One meal off plan does not undo a week of work." },
  ],
  mistakesTitle: "The mistakes holding you back",
  supplementLabel: "Official supplements",
  supplementValue: "myprotein.pt · code MPKRAV",
  footer: "@kravdoesntlift · zeroing out mediocre machines",
  upgradeTitle: "What changes if you subscribe",
  upgradeIntro:
    "This guide is the method. You can run it alone and it works, if you stay consistent. What the subscription adds is the part almost nobody manages to do for themselves.",
  upgradeFree: {
    title: "Free: this guide and the trial",
    items: [
      "This plan, the same one for everyone who trains where you train",
      "In the app, fitted to the days you pick, your level and your equipment",
      "Set logging, compared with the week before",
      "7 days of full access, no card",
    ],
  },
  upgradePaid: {
    title: "With the subscription",
    items: [
      "A plan written by André from what you logged, not generated",
      "Adjusted every week against your actual progress",
      "Exercises swapped when something hurts or the gym is packed",
      "Nutrition guidance fitted to your goal",
      "Direct chat with your coach, answered the same day",
    ],
  },
  upgradeCta: "Start the 7 day trial",
  upgradeUrl: "https://www.kravcoaching.com/start?lang=en",
};

const COPY: Record<GuideVariant, Record<Lang, GuideCopy>> = {
  gym: {
    pt: {
      ...SHARED_PT,
      kicker: "@kravdoesntlift · guia gratuito",
      title: "De magro a estético em 90 dias",
      subtitle: "O método que usei para transformar o meu corpo, e que nenhum PT te dá de graça.",
      intro:
        "Fui o miúdo magro durante anos. Treinava, comia, tentava, e não via nada. Até perceber que o problema não era o esforço, era o método. Este guia é o que eu queria ter tido no início. Sem suplementos mágicos, sem 2 horas de ginásio, sem tretas.",
      contents: [
        "Os 3 princípios que realmente constroem músculo",
        "O plano de treino de 5 dias, exercício a exercício",
        "Orientações nutricionais para crescer",
        "Os erros que estão a travar-te agora",
      ],
      planTitle: "O plano de treino, 5 dias no ginásio",
      planIntro:
        "Split de 5 dias, compostos primeiro, com progressão semanal. É o mesmo plano que a app te monta, já ajustado aos dias que escolheres.",
      planNote:
        "Se só podes treinar 3 dias, junta Upper e Pull num dia, Lower e Legs noutro, e mantém Push. Na app isso é automático.",
      mistakes: [
        { title: "Mudar de programa constantemente", body: "O músculo adapta-se em 6 a 8 semanas. Avalia só depois desse tempo." },
        { title: "Treinar sem registar", body: "Se não sabes quanto levantaste na semana passada, não consegues progredir." },
        { title: "Subestimar o sono", body: "Dormir 6 horas e querer crescer é como regar uma planta uma vez por mês." },
        { title: "Cardio a mais em fase de ganho", body: "Demasiado cardio em superavit come o músculo que trabalhaste para ter." },
      ],
    },
    en: {
      ...SHARED_EN,
      kicker: "@kravdoesntlift · free guide",
      title: "From skinny to lean in 90 days",
      subtitle: "The method I used to change my body, and that no trainer hands you for free.",
      intro:
        "I was the skinny kid for years. I trained, I ate, I tried, and nothing happened. Until I understood the problem was never the effort, it was the method. This guide is what I wish I had at the start. No magic supplements, no two hour sessions, no nonsense.",
      contents: [
        "The 3 principles that actually build muscle",
        "The 5 day training plan, exercise by exercise",
        "Nutrition guidance for growing",
        "The mistakes holding you back right now",
      ],
      planTitle: "The training plan, 5 days in the gym",
      planIntro:
        "A five day split, compounds first, progressed weekly. It is the same plan the app builds for you, already fitted to the days you choose.",
      planNote:
        "If you can only train 3 days, merge Upper with Pull, Lower with Legs, and keep Push. In the app that happens automatically.",
      mistakes: [
        { title: "Changing programme constantly", body: "Muscle adapts over 6 to 8 weeks. Judge the plan only after that." },
        { title: "Training without logging", body: "If you do not know what you lifted last week, you cannot progress." },
        { title: "Underrating sleep", body: "Sleeping 6 hours and expecting growth is like watering a plant once a month." },
        { title: "Too much cardio while gaining", body: "Excess cardio in a surplus eats the muscle you worked for." },
      ],
    },
  },
  home: {
    pt: {
      ...SHARED_PT,
      kicker: "@kravdoesntlift · guia gratuito",
      title: "Construir músculo em casa, em 90 dias",
      subtitle: "Sem máquinas, sem desculpas. O mesmo método, com o que tens à mão.",
      intro:
        "Treinar em casa não é a versão pobre de treinar no ginásio, é a versão que exige mais cabeça. Sem máquinas a escolher o caminho por ti, a técnica, o tempo debaixo de tensão e a progressão passam a ser tudo. Este guia mostra como aplicar o mesmo método com o teu peso corporal e, se tiveres, um par de halteres ou uma banda.",
      contents: [
        "Os 3 princípios que realmente constroem músculo",
        "O plano de 5 dias em casa, exercício a exercício",
        "Como progredir sem poder somar discos",
        "Orientações nutricionais e os erros a evitar",
      ],
      planTitle: "O plano de treino, 5 dias em casa",
      planIntro:
        "Os mesmos padrões de movimento do ginásio, com o que existe numa sala. É o mesmo plano que a app te monta, já ajustado aos teus dias e ao teu material.",
      planNote:
        "Sem halteres, usa uma mochila com livros ou garrafas de água. Se tiveres uma banda elástica, ela resolve puxadas e face pulls.",
      mistakes: [
        { title: "Achar que sem máquinas não dá", body: "Dá, desde que a série termine perto da falha. A carga é só uma das formas de criar tensão." },
        { title: "Fazer sempre as mesmas repetições", body: "Quando não podes somar peso, progride noutra coisa: mais reps, mais lento, menos apoio, mais amplitude." },
        { title: "Treinar sem registar", body: "Em casa é ainda mais fácil andar às voltas. Escreve o que fizeste, nem que seja no telemóvel." },
        { title: "Subestimar o sono e a comida", body: "O estímulo em casa pode ser suficiente. Se não dormes nem comes, não cresces, e a culpa não é do material." },
      ],
    },
    en: {
      ...SHARED_EN,
      kicker: "@kravdoesntlift · free guide",
      title: "Building muscle at home, in 90 days",
      subtitle: "No machines, no excuses. The same method, with what you already have.",
      intro:
        "Training at home is not the poor version of a gym, it is the version that asks more of your head. With no machines choosing the path for you, technique, time under tension and progression become everything. This guide shows how to run the same method with your bodyweight and, if you have them, a pair of dumbbells or a band.",
      contents: [
        "The 3 principles that actually build muscle",
        "The 5 day home plan, exercise by exercise",
        "How to progress when you cannot add plates",
        "Nutrition guidance and the mistakes to avoid",
      ],
      planTitle: "The training plan, 5 days at home",
      planIntro:
        "The same movement patterns as the gym, with what exists in a living room. It is the same plan the app builds for you, fitted to your days and your equipment.",
      planNote:
        "With no dumbbells, use a backpack with books or water bottles. A resistance band covers pulldowns and face pulls on its own.",
      mistakes: [
        { title: "Thinking it cannot work without machines", body: "It works, as long as the set ends close to failure. Load is only one way to create tension." },
        { title: "Doing the same reps forever", body: "When you cannot add weight, progress something else: more reps, slower tempo, less support, more range." },
        { title: "Training without logging", body: "At home it is even easier to drift. Write down what you did, even if it is in your phone." },
        { title: "Underrating sleep and food", body: "The stimulus at home can be enough. If you do not sleep or eat, you do not grow, and the equipment is not to blame." },
      ],
    },
  },
};

export function guideCopy(variant: GuideVariant, lang: Lang): GuideCopy {
  return COPY[variant][lang];
}

/** The file a lead is sent to, per version and language. */
export function guidePdfPath(variant: GuideVariant, lang: Lang): string {
  return `/guias/krav-guia-${variant === "home" ? "casa" : "ginasio"}-${lang}.pdf`;
}
