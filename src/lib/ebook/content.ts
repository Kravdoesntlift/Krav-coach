import { buildBasePlan, type Equipment, type Lang } from "@/lib/training/base-plan";

/**
 * "90 Dias", the first paid book.
 *
 * The free guide is the method in four pages and exists to be given away. This
 * is the programme: thirteen weeks, three blocks, written progression rules,
 * and the training weeks coming out of the same generator the app uses, so
 * somebody who buys the book and later subscribes meets one method and not
 * two documents that drifted.
 *
 * Everything claimed here has to survive a refund request from somebody who
 * read it carefully. No promised kilos, no before and after that is not ours,
 * no medical claims.
 */

export const EBOOK = {
  id: "90-dias",
  priceCents: 1290,
  /** What shows up on the Stripe receipt and in the catalogue. */
  productName: "KRAV 90 Dias",
  pages: 22,
} as const;

export type EbookVariant = "gym" | "home";
export type PhaseNumber = 1 | 2 | 3;

const EQUIPMENT_FOR: Record<EbookVariant, Equipment> = {
  gym: "gym_full",
  home: "home_weights",
};

/** Four training days in the first two blocks, five in the last one. */
const DAYS_4 = [1, 2, 4, 5];
const DAYS_5 = [1, 2, 4, 5, 6];

/**
 * The week for a block. Each block asks the generator for something different,
 * which is what makes the ninety days a programme instead of the same week
 * repeated thirteen times.
 */
export function phasePlan(phase: PhaseNumber, variant: EbookVariant, lang: Lang) {
  const equipment = EQUIPMENT_FOR[variant];
  if (phase === 1) {
    return buildBasePlan({
      level: "beginner", equipment, goal: "gain_muscle",
      trainingDays: DAYS_4, sessionMinutes: 60, lang,
    });
  }
  if (phase === 2) {
    return buildBasePlan({
      level: "intermediate", equipment, goal: "gain_muscle",
      trainingDays: DAYS_4, sessionMinutes: 75, lang,
    });
  }
  return buildBasePlan({
    level: "intermediate", equipment, goal: "gain_muscle",
    trainingDays: DAYS_5, sessionMinutes: 75, lang,
  });
}

export interface Block {
  title: string;
  body: string;
}

export interface Phase {
  n: PhaseNumber;
  weeks: string;
  name: string;
  aim: string;
  /** How to progress inside this block, week by week. */
  rules: string[];
  /** What the fourth week of the block looks like. */
  deload: string;
}

export interface EbookCopy {
  // Cover
  kicker: string;
  title: string;
  subtitle: string;
  author: string;
  // Front matter
  contentsTitle: string;
  contents: string[];
  forWhoTitle: string;
  forWho: Block[];
  honestyTitle: string;
  honesty: string;
  // How it works
  howTitle: string;
  howIntro: string;
  how: Block[];
  rirTitle: string;
  rirIntro: string;
  rirRows: { value: string; label: string }[];
  // Phases
  phasesTitle: string;
  phases: Phase[];
  phasePlanLabel: string;
  phaseRulesLabel: string;
  phaseDeloadLabel: string;
  // Warm up
  warmupTitle: string;
  warmupIntro: string;
  warmup: Block[];
  // Technique
  techniqueTitle: string;
  techniqueIntro: string;
  technique: { name: string; cues: string[] }[];
  // Log sheet
  logTitle: string;
  logIntro: string;
  logHeaders: string[];
  logNote: string;
  // Test week
  testTitle: string;
  testIntro: string;
  test: Block[];
  // Home
  homeTitle: string;
  homeIntro: string;
  homeSwaps: { from: string; to: string }[];
  // Nutrition
  nutritionTitle: string;
  nutritionDisclaimer: string;
  nutrition: Block[];
  mealsTitle: string;
  meals: { when: string; what: string }[];
  // Recovery
  recoveryTitle: string;
  recovery: Block[];
  // Measuring
  measureTitle: string;
  measureIntro: string;
  measure: Block[];
  // Mistakes
  mistakesTitle: string;
  mistakes: Block[];
  // FAQ
  faqTitle: string;
  faq: { q: string; a: string }[];
  // Day 91
  endTitle: string;
  endIntro: string;
  end: Block[];
  endCta: string;
  endUrl: string;
  // Chrome
  footer: string;
  dayLabel: string;
  restLabel: string;
  setsLabel: string;
  repsLabel: string;
}

const PT: EbookCopy = {
  kicker: "KRAV · Programa completo",
  title: "90 Dias",
  subtitle: "O programa completo para construíres o teu primeiro físico estético, semana a semana.",
  author: "André Kravchuk · Técnico Especialista em Exercício Físico",

  contentsTitle: "O que está aqui dentro",
  contents: [
    "Para quem é isto, e para quem não é",
    "Como o programa funciona",
    "Aquecer em cinco minutos",
    "Os seis movimentos, ponto por ponto",
    "A folha de registo",
    "Fase 1, Fundação (semanas 1 a 4)",
    "Fase 2, Volume (semanas 5 a 8)",
    "Fase 3, Intensidade (semanas 9 a 12)",
    "Semana 13, a semana de teste",
    "Se treinas em casa",
    "Comer para crescer",
    "Dormir, descansar, crescer",
    "Medir o progresso sem te enganares",
    "Os erros que te vão travar",
    "Perguntas que toda a gente faz",
    "O dia 91",
  ],

  forWhoTitle: "Para quem é isto, e para quem não é",
  forWho: [
    {
      title: "É para ti se",
      body: "Treinas há menos de dois anos, ou treinas há mais tempo mas nunca seguiste um programa até ao fim. Consegues quatro dias por semana, uma hora de cada vez. Queres deixar de improvisar e passar a saber exatamente o que fazer quando entras no ginásio.",
    },
    {
      title: "Não é para ti se",
      body: "Procuras um atalho de seis semanas, um plano sem esforço, ou um programa de competição. Também não é para quem tem uma lesão por tratar: nesse caso o primeiro passo é um fisioterapeuta, não um livro.",
    },
    {
      title: "O que noventa dias mudam de verdade",
      body: "Treze semanas chegam para mudar a forma como o corpo se move e se vê, para subir cargas de forma clara em todos os exercícios principais, e para criar o hábito que faz o resto. Não chegam para te transformares noutra pessoa. Quem te prometer isso está a vender-te outra coisa.",
    },
  ],

  honestyTitle: "Uma nota antes de começares",
  honesty:
    "Não vais encontrar aqui números inventados nem promessas de quilos. Este programa é o mesmo método que uso com os meus clientes, escrito para poderes segui-lo sozinho. Se fizeres as treze semanas como está, com registo e sem saltar semanas, vais ver progresso. Se mudares de programa ao fim de três semanas, como quase toda a gente faz, não vais ver nada, e o problema não terá sido o programa.",

  howTitle: "Como o programa funciona",
  howIntro:
    "Três blocos de quatro semanas e uma semana final de teste. Cada bloco tem um trabalho diferente para fazer, e a quarta semana de cada bloco é mais leve de propósito.",
  how: [
    {
      title: "Três blocos, não treze semanas iguais",
      body: "A Fundação ensina os padrões e constrói a base. O Volume aumenta o trabalho total, que é o que mais faz crescer. A Intensidade sobe as cargas com menos repetições. Um bloco prepara o seguinte: por isso não se salta nem se troca a ordem.",
    },
    {
      title: "A quarta semana é mais leve, sempre",
      body: "Na última semana de cada bloco tiras uma série a todos os exercícios e usas o mesmo peso. Não é descanso, é o que permite entrar no bloco seguinte a subir em vez de estagnar. É a parte que quase toda a gente ignora e é a parte que separa quem progride durante meses de quem progride durante três semanas.",
    },
    {
      title: "Sobrecarga progressiva, em concreto",
      body: "Cada exercício tem um intervalo de repetições. Quando conseguires o número de cima do intervalo em todas as séries, com técnica, sobes o peso na semana seguinte e voltas ao número de baixo. Isto é o programa inteiro numa frase. Tudo o resto são detalhes.",
    },
    {
      title: "Regista tudo, ou não sabes nada",
      body: "Séries, repetições e peso, em todos os treinos. Sem registo estás a adivinhar se progrediste, e a memória mente sempre a teu favor. Um caderno chega. A app faz isto sozinha e compara com a semana anterior, mas o caderno também serve.",
    },
    {
      title: "Quanto tempo demora um treino",
      body: "Entre 50 e 75 minutos, consoante o bloco. Se estiveres a demorar duas horas, o problema é o telemóvel entre séries, não o programa.",
    },
  ],

  rirTitle: "Quão perto da falha deves treinar",
  rirIntro:
    "RIR quer dizer repetições em reserva: quantas ainda conseguirias fazer quando paras a série. É a forma mais simples de controlar o esforço sem precisares de percentagens nem de testes de força máxima.",
  rirRows: [
    { value: "3 RIR", label: "Semana 1 de cada bloco, a aprender o peso" },
    { value: "2 RIR", label: "Semana 2, o trabalho principal" },
    { value: "1 RIR", label: "Semana 3, a semana mais dura" },
    { value: "3 RIR", label: "Semana 4, a semana leve" },
  ],

  phasesTitle: "Os três blocos",
  phases: [
    {
      n: 1,
      weeks: "Semanas 1 a 4",
      name: "Fundação",
      aim: "Aprender os padrões, construir base e chegar ao fim de cada treino a saber o que fizeste.",
      rules: [
        "Semana 1: escolhe pesos com que fazes o topo do intervalo deixando três repetições na reserva. Vais achar leve. É suposto.",
        "Semana 2: mesmo peso, tenta uma ou duas repetições a mais em cada série.",
        "Semana 3: sobe o peso nos compostos assim que fizeres o topo do intervalo em todas as séries.",
        "Semana 4: semana leve, uma série a menos em cada exercício, mesmo peso.",
      ],
      deload: "Uma série a menos em todos os exercícios, com o peso da semana 3.",
    },
    {
      n: 2,
      weeks: "Semanas 5 a 8",
      name: "Volume",
      aim: "Aumentar o trabalho total por grupo muscular, que é o principal motor de crescimento.",
      rules: [
        "Os treinos ficam mais longos e com mais exercícios de isolamento. Isto é de propósito.",
        "Semana 5: repete os pesos com que acabaste a Fase 1 e acrescenta o volume novo.",
        "Semanas 6 e 7: sobe repetições primeiro, peso depois, sempre por essa ordem.",
        "Semana 8: semana leve. Se chegares aqui com vontade de falhar treinos, é sinal de que a fizeste bem.",
      ],
      deload: "Uma série a menos em todos os exercícios, com o peso da semana 7.",
    },
    {
      n: 3,
      weeks: "Semanas 9 a 12",
      name: "Intensidade",
      aim: "Transformar a base e o volume em força visível, com cargas mais altas e repetições mais baixas nos compostos.",
      rules: [
        "Passas a cinco dias. Se só conseguires quatro, junta o quinto treino ao que tiver menos exercícios e mantém o resto.",
        "Nos compostos trabalha na parte de baixo do intervalo de repetições, com mais peso.",
        "Nos isolamentos mantém as repetições altas: é aí que se acumula o trabalho sem esmagar as articulações.",
        "Semana 12: semana leve, e prepara-te para a semana de teste.",
      ],
      deload: "Uma série a menos em todos os exercícios, com o peso da semana 11.",
    },
  ],
  phasePlanLabel: "A semana deste bloco",
  phaseRulesLabel: "Como progredir dentro do bloco",
  phaseDeloadLabel: "A semana leve",

  warmupTitle: "Aquecer em cinco minutos",
  warmupIntro:
    "Aquecer não é passar dez minutos na passadeira. É preparar o movimento que vais fazer a seguir, e chega isto antes de cada treino.",
  warmup: [
    { title: "Dois minutos a subir a temperatura", body: "Passadeira, bicicleta ou corda, num ritmo em que ainda consegues falar. O objetivo é sentir calor, não cansaço." },
    { title: "Mobilidade do que vais treinar", body: "Dia de pernas: dez agachamentos sem peso e dez rotações de anca por lado. Dia de peito e ombro: dez rotações de ombro com um elástico e dez flexões. Trinta segundos cada coisa, sem alongamentos longos antes de treinar." },
    { title: "Séries de aproximação no primeiro exercício", body: "Uma série com a barra vazia, uma com metade do peso de trabalho e uma com setenta por cento, todas com poucas repetições. Só depois começa a contar as séries do plano." },
    { title: "Nos exercícios seguintes não repitas tudo", body: "Uma série leve chega. O corpo já está quente, e aquecer cada exercício do zero é como se passa uma hora e meia no ginásio a fazer o trabalho de uma hora." },
  ],

  techniqueTitle: "Os seis movimentos, ponto por ponto",
  techniqueIntro:
    "O programa inteiro assenta em seis padrões. Se estes seis estiverem bem executados, o resto é detalhe. Lê isto antes da semana 1 e volta cá quando subires cargas, que é quando a técnica costuma fugir.",
  technique: [
    {
      name: "Agachamento",
      cues: [
        "Pés à largura dos ombros, pontas ligeiramente viradas para fora.",
        "Desce a controlar em dois a três segundos, até à profundidade em que consegues manter as costas direitas.",
        "Joelhos alinhados com as pontas dos pés, sem cair para dentro.",
        "Empurra o chão com o pé todo, não com as pontas.",
      ],
    },
    {
      name: "Supino",
      cues: [
        "Omoplatas juntas e para baixo, encostadas ao banco, do início ao fim.",
        "Desce a barra até ao peito com os cotovelos a cerca de 45 graus do tronco, não abertos a 90.",
        "Pés bem assentes no chão e rabo no banco.",
        "Sobe a empurrar com força, sem bloquear os cotovelos com pancada.",
      ],
    },
    {
      name: "Remada",
      cues: [
        "Tronco inclinado à frente, costas direitas, olhar para o chão a um metro à frente.",
        "Puxa com os cotovelos em direção à anca, não com as mãos.",
        "Aperta as omoplatas uma contra a outra no fim do movimento e mantém meio segundo.",
        "Desce a controlar. Deixar cair o peso é metade do exercício perdida.",
      ],
    },
    {
      name: "Puxada ou elevações",
      cues: [
        "Pega um pouco mais aberta que os ombros.",
        "Começa por baixar as omoplatas, só depois dobra os cotovelos.",
        "Puxa até ao peito, sem balançar o corpo para ganhar embalo.",
        "Em cima da elevação, fica meio segundo antes de descer devagar.",
      ],
    },
    {
      name: "Desenvolvimento de ombros",
      cues: [
        "Barra ou halteres à altura do queixo, cotovelos ligeiramente à frente do corpo.",
        "Aperta os glúteos e o abdominal para não arqueares as costas.",
        "Sobe até os braços ficarem esticados por cima da cabeça, não à frente.",
        "Se doer o ombro à frente, passa para halteres com as palmas viradas uma para a outra.",
      ],
    },
    {
      name: "Peso morto romeno",
      cues: [
        "Joelhos ligeiramente dobrados e fixos: o movimento é da anca, não do joelho.",
        "Empurra o rabo para trás e desce a barra colada às pernas.",
        "Para quando sentires o femoral esticado ao máximo com as costas ainda direitas.",
        "Sobe a apertar os glúteos. Não é um agachamento com barra à frente.",
      ],
    },
  ],

  logTitle: "A folha de registo",
  logIntro:
    "Imprime esta folha, ou copia-a para um caderno, uma por treino. Sem isto não sabes se progrediste, e o programa deixa de funcionar na terceira semana, que é quando a memória começa a mentir.",
  logHeaders: ["Exercício", "Séries x reps", "Peso", "Reps feitas", "Notas"],
  logNote:
    "Na coluna das notas escreve só o que interessa para a semana seguinte: se sobrou, se falhou uma repetição, se doeu alguma coisa. Se usares a app, isto é feito sozinho e comparado com a semana anterior.",

  testTitle: "Semana 13, a semana de teste",
  testIntro:
    "A última semana não é para treinar mais, é para medires o que mudou. Treinas três dias, com pouco volume, e em cada um deles testas um exercício.",
  test: [
    { title: "Dia 1, empurrar", body: "Aquece bem e faz uma série de supino até deixares uma repetição na reserva. Anota peso e repetições. Depois faz o resto do treino a metade do volume normal." },
    { title: "Dia 2, pernas", body: "O mesmo com o agachamento. Uma série a sério, registada, e o resto leve." },
    { title: "Dia 3, puxar", body: "O mesmo com remada ou elevações. Uma série a sério, registada, e o resto leve." },
    { title: "Depois", body: "Compara com o que registaste na semana 1. Tira as mesmas fotos, com a mesma luz e a mesma hora do dia. Mede a cintura em jejum. São estes três números, e não a balança, que te dizem o que aconteceu." },
  ],

  homeTitle: "Se treinas em casa",
  homeIntro:
    "O programa funciona com halteres e uma barra de elevações. Os princípios não mudam: o que muda é o exercício que ocupa cada lugar. Usa esta tabela e mantém tudo o resto igual, incluindo as séries, as repetições e a progressão.",
  homeSwaps: [
    { from: "Supino com barra", to: "Supino com halteres no chão ou em banco improvisado" },
    { from: "Agachamento com barra", to: "Agachamento búlgaro com halteres, uma perna de cada vez" },
    { from: "Remada com barra", to: "Remada com halteres apoiado numa cadeira" },
    { from: "Puxada alta", to: "Elevações assistidas com elástico, ou remada invertida numa mesa" },
    { from: "Prensa de pernas", to: "Afundos com halteres, passo longo" },
    { from: "Extensão de pernas", to: "Agachamento sissy ou cadeira búlgara com pausa em baixo" },
    { from: "Elevação lateral na máquina", to: "Elevação lateral com halteres ou elásticos" },
  ],

  nutritionTitle: "Comer para crescer",
  nutritionDisclaimer:
    "Este capítulo é geral e educativo e não substitui acompanhamento nutricional profissional. Se tens uma condição clínica, alergias, ou queres um plano alimentar à medida, fala com um nutricionista certificado.",
  nutrition: [
    {
      title: "Primeiro a proteína, o resto vem a seguir",
      body: "A investigação aponta para 1,6 a 2 gramas de proteína por quilo de peso corporal por dia. Para 70 quilos são 112 a 140 gramas. Se só mudares uma coisa na alimentação durante estes noventa dias, muda esta, e distribui por três ou quatro refeições em vez de tentares tudo ao jantar.",
    },
    {
      title: "Superavit moderado, não é licença para tudo",
      body: "Para construir músculo precisas de comer ligeiramente acima do que gastas, à volta de 200 a 300 calorias por dia. Isso costuma dar entre 0,25 e 0,5 quilos por semana na balança. Mais rápido do que isso é gordura a acompanhar, e depois é preciso tirá-la.",
    },
    {
      title: "Hidratos são o combustível, não o inimigo",
      body: "Arroz, batata, massa, aveia, pão. São eles que fazem a diferença entre um treino em que sobes cargas e um treino em que te arrastas. Concentra-os à volta do treino se te souber melhor, mas o total do dia importa muito mais do que o horário.",
    },
    {
      title: "Gordura, o suficiente e não menos",
      body: "Cerca de 0,8 gramas por quilo de peso corporal. Azeite, ovos inteiros, frutos secos, peixe gordo. Cortar gordura a sério mexe com o sono e com os hormónios, e nota-se no treino duas semanas depois.",
    },
    {
      title: "Água e sal",
      body: "Dois a três litros por dia, mais se treinares com calor. A maioria das quebras de energia a meio do treino que as pessoas atribuem à falta de força é simplesmente desidratação.",
    },
    {
      title: "O que fazer quando comeste mal",
      body: "Nada. Não compenses no dia seguinte, não saltes refeições, não acrescentes cardio de castigo. Uma refeição fora do plano não desfaz uma semana de trabalho. Compensar é que costuma desfazer.",
    },
  ],
  mealsTitle: "Um dia tipo, com comida portuguesa",
  meals: [
    { when: "Pequeno-almoço", what: "Três ovos mexidos, duas fatias de pão de mistura, um iogurte natural e fruta." },
    { when: "Almoço", what: "Peito de frango ou pescada, arroz ou batata a gosto, legumes, azeite por cima." },
    { when: "Lanche", what: "Iogurte grego com aveia e mel, ou atum com bolachas de arroz." },
    { when: "Depois do treino", what: "A refeição que se seguir, com proteína e hidratos. Não precisas de batido se conseguires comer." },
    { when: "Jantar", what: "Carne ou peixe, massa ou batata, salada. Repete o almoço se te simplificar a vida." },
  ],

  recoveryTitle: "Dormir, descansar, crescer",
  recovery: [
    { title: "Sete a oito horas, todas as noites", body: "É o único suplemento que nunca falha e não custa dinheiro. Uma semana de noites de cinco horas apaga o progresso de duas semanas de treino bem feito, e vais achar que o programa é que não presta." },
    { title: "Dois a três minutos entre séries pesadas", body: "Descansar pouco não é treinar mais intensamente, é levantar menos peso. Nos isolamentos chega um minuto." },
    { title: "Dores, e a diferença que importa", body: "Músculo dorido dois dias depois é normal e não é medida de nada. Dor numa articulação, dor aguda, ou dor que aparece durante o movimento, não é normal: para o exercício, troca-o, e se persistir vai a um profissional." },
    { title: "Andar", body: "Oito mil passos por dia fazem mais pela tua composição corporal do que qualquer sessão extra de cardio ao domingo." },
  ],

  measureTitle: "Medir o progresso sem te enganares",
  measureIntro:
    "A balança sozinha é a pior forma de avaliar noventa dias de trabalho, porque sobe e desce com água, sal e sono. Mede estas quatro coisas, sempre da mesma maneira.",
  measure: [
    { title: "As cargas", body: "O número que mais importa. Se o supino subiu de 40 para 50 quilos em treze semanas, aconteceu alguma coisa, independentemente do que diga a balança." },
    { title: "A cintura", body: "Uma vez por semana, de manhã, em jejum, ao nível do umbigo. A subir ao mesmo tempo que as cargas sobem devagar, come um pouco menos." },
    { title: "As fotos", body: "De frente, de lado e de costas, no mesmo sítio, com a mesma luz, no mesmo dia da semana. De quatro em quatro semanas. São elas que mostram o que os números escondem." },
    { title: "O peso", body: "Todas as manhãs, e usa a média da semana, nunca o valor de um dia. Entre 0,25 e 0,5 quilos por semana está bem." },
  ],

  mistakesTitle: "Os erros que te vão travar",
  mistakes: [
    { title: "Mudar de programa a meio", body: "O erro número um, e o mais caro. Três semanas não chegam para nada dar resultado. Segue os noventa dias até ao fim e avalia depois, com dados." },
    { title: "Treinar sempre até à falha", body: "Custa mais e rende menos. Deixa uma a três repetições na reserva na maioria das séries e guarda a falha para a última série dos isolamentos." },
    { title: "Fugir dos compostos", body: "Meia hora de máquinas confortáveis não substitui agachamento, supino e remada. São eles que sustentam tudo o resto." },
    { title: "Comer a menos e treinar a mais", body: "É a combinação que garante estagnação. Se não estás a crescer e treinas quatro vezes por semana, o problema está no prato em nove casos de dez." },
    { title: "Comparar-te com quem está há dez anos nisto", body: "E, pior, com quem usa ajuda farmacológica e não o diz. Compara-te com o teu registo da semana passada. É o único ponto de comparação honesto." },
  ],

  faqTitle: "Perguntas que toda a gente faz",
  faq: [
    { q: "Posso fazer cardio?", a: "Podes e deves. Duas a três sessões de vinte a trinta minutos por semana, em dias sem pernas, ou caminhar todos os dias. Não faças corrida longa no dia anterior ao treino de pernas." },
    { q: "E se falhar um treino?", a: "Fazes no dia seguinte e empurras o resto da semana. Se falhaste a semana toda, retomas na semana em que estavas, não voltas ao início." },
    { q: "Preciso de suplementos?", a: "Não precisas de nenhum. Creatina, cinco gramas por dia, é o único com provas fortes e custa pouco. Proteína em pó é comida prática, não magia." },
    { q: "Quantas vezes treino cada músculo?", a: "Duas vezes por semana, em todos os blocos. É o que a investigação suporta e é como o programa está montado." },
    { q: "Posso trocar exercícios?", a: "Podes, por um exercício do mesmo padrão. Troca supino inclinado por supino com halteres, não por elevações laterais." },
    { q: "Sou mulher, isto serve?", a: "Serve, sem alterações. Os princípios de treino não mudam com o sexo. O que muda é o objetivo estético de cada pessoa, e isso resolve-se com a escolha dos isolamentos." },
    { q: "E depois dos noventa dias?", a: "Repetes o ciclo com mais peso, ou passas a um plano feito para ti. O último capítulo explica as duas opções." },
  ],

  endTitle: "O dia 91",
  endIntro:
    "Se chegaste aqui com as treze semanas feitas e registadas, já fizeste mais do que a maioria das pessoas que entram num ginásio. Há duas formas de continuar, e nenhuma delas é começar outro programa aleatório da internet.",
  end: [
    {
      title: "Repetir o ciclo",
      body: "Volta à Fase 1 com os pesos com que acabaste, e faz tudo outra vez. Um programa bem feito serve para ser repetido: é assim que se progride durante anos. Continua a registar.",
    },
    {
      title: "Deixar de decidir sozinho",
      body: "A app monta-te a semana a partir das tuas respostas e compara cada treino com o anterior, por 35 euros por mês. Com coaching 1:1, por 127, sou eu a escrever o teu plano a partir do que registaste e a ajustá-lo todas as semanas. Sete dias grátis nos dois casos, sem cartão.",
    },
    {
      title: "Uma coisa que te peço",
      body: "Se este programa te serviu, diz-me. Escreve-me no Instagram com o teu registo da semana 1 e o da semana 13. É com isso que melhoro a próxima versão deste livro, e é a única prova social que publico.",
    },
  ],
  endCta: "Experimentar a app, 7 dias grátis",
  endUrl: "https://www.kravcoaching.com/start",

  footer: "@kravdoesntlift · kravcoaching.com",
  dayLabel: "Dia",
  restLabel: "Descanso",
  setsLabel: "séries",
  repsLabel: "reps",
};

const EN: EbookCopy = {
  kicker: "KRAV · Full programme",
  title: "90 Days",
  subtitle: "The complete programme for building your first aesthetic physique, week by week.",
  author: "André Kravchuk · Exercise Specialist",

  contentsTitle: "What is inside",
  contents: [
    "Who this is for, and who it is not for",
    "How the programme works",
    "Warming up in five minutes",
    "The six movements, point by point",
    "The log sheet",
    "Block 1, Foundation (weeks 1 to 4)",
    "Block 2, Volume (weeks 5 to 8)",
    "Block 3, Intensity (weeks 9 to 12)",
    "Week 13, the test week",
    "If you train at home",
    "Eating to grow",
    "Sleep, recover, grow",
    "Measuring progress without fooling yourself",
    "The mistakes that will stall you",
    "The questions everybody asks",
    "Day 91",
  ],

  forWhoTitle: "Who this is for, and who it is not for",
  forWho: [
    {
      title: "It is for you if",
      body: "You have been training for less than two years, or longer than that but never followed a programme to the end. You can manage four days a week, an hour at a time. You want to stop improvising and know exactly what to do when you walk into the gym.",
    },
    {
      title: "It is not for you if",
      body: "You are after a six week shortcut, a plan without effort, or a competition programme. It is also not for anybody carrying an untreated injury: there the first step is a physiotherapist, not a book.",
    },
    {
      title: "What ninety days actually change",
      body: "Thirteen weeks are enough to change how your body moves and looks, to clearly raise the load on every main lift, and to build the habit that carries the rest. They are not enough to turn you into somebody else. Anyone promising that is selling you something different.",
    },
  ],

  honestyTitle: "One note before you start",
  honesty:
    "You will not find invented numbers or promised kilos here. This programme is the same method I use with my clients, written so you can follow it on your own. Do the thirteen weeks as written, log them, skip nothing, and you will see progress. Change programme after three weeks, as almost everybody does, and you will see nothing, and the programme will not have been the problem.",

  howTitle: "How the programme works",
  howIntro:
    "Three blocks of four weeks and a final test week. Each block has a different job to do, and the fourth week of every block is lighter on purpose.",
  how: [
    {
      title: "Three blocks, not thirteen identical weeks",
      body: "Foundation teaches the patterns and builds the base. Volume raises total work, which is what drives growth. Intensity turns that into load with fewer repetitions. Each block prepares the next one, which is why you do not skip them or reorder them.",
    },
    {
      title: "The fourth week is lighter, always",
      body: "In the last week of every block you drop one set from every exercise and keep the same weight. It is not rest, it is what lets you start the next block climbing instead of stalling. Almost everybody ignores this part, and it is the part that separates months of progress from three weeks of it.",
    },
    {
      title: "Progressive overload, concretely",
      body: "Every exercise has a repetition range. When you hit the top of the range on every set, with clean technique, you add weight next week and go back to the bottom of the range. That is the entire programme in one sentence. Everything else is detail.",
    },
    {
      title: "Log everything, or you know nothing",
      body: "Sets, repetitions and weight, every session. Without a log you are guessing whether you progressed, and memory always lies in your favour. A notebook is enough. The app does it for you and compares each week with the last, but a notebook works too.",
    },
    {
      title: "How long a session takes",
      body: "Between 50 and 75 minutes depending on the block. If it is taking two hours, the problem is the phone between sets, not the programme.",
    },
  ],

  rirTitle: "How close to failure you should train",
  rirIntro:
    "RIR means repetitions in reserve: how many you could still do when you end the set. It is the simplest way to control effort without percentages or maximal strength tests.",
  rirRows: [
    { value: "3 RIR", label: "Week 1 of each block, learning the weight" },
    { value: "2 RIR", label: "Week 2, the main work" },
    { value: "1 RIR", label: "Week 3, the hardest week" },
    { value: "3 RIR", label: "Week 4, the light week" },
  ],

  phasesTitle: "The three blocks",
  phases: [
    {
      n: 1,
      weeks: "Weeks 1 to 4",
      name: "Foundation",
      aim: "Learn the patterns, build the base, and finish every session knowing what you did.",
      rules: [
        "Week 1: pick weights where you hit the top of the range leaving three repetitions in reserve. It will feel light. That is the point.",
        "Week 2: same weight, add one or two repetitions per set.",
        "Week 3: add weight to the compound lifts as soon as you hit the top of the range on every set.",
        "Week 4: light week, one set fewer on everything, same weight.",
      ],
      deload: "One set fewer on every exercise, using week 3 weights.",
    },
    {
      n: 2,
      weeks: "Weeks 5 to 8",
      name: "Volume",
      aim: "Raise total work per muscle group, which is the main driver of growth.",
      rules: [
        "Sessions get longer and carry more isolation work. That is deliberate.",
        "Week 5: repeat the weights you finished block 1 with and add the new volume on top.",
        "Weeks 6 and 7: add repetitions first, weight second, always in that order.",
        "Week 8: light week. Arriving here wanting to skip sessions means you did it right.",
      ],
      deload: "One set fewer on every exercise, using week 7 weights.",
    },
    {
      n: 3,
      weeks: "Weeks 9 to 12",
      name: "Intensity",
      aim: "Turn base and volume into visible strength, with heavier loads and lower repetitions on the compounds.",
      rules: [
        "You move to five days. If you can only manage four, fold the fifth session into the one with fewest exercises and keep everything else.",
        "On compounds work at the bottom of the repetition range, with more weight.",
        "On isolations keep the repetitions high: that is where work accumulates without crushing your joints.",
        "Week 12: light week, and get ready for the test week.",
      ],
      deload: "One set fewer on every exercise, using week 11 weights.",
    },
  ],
  phasePlanLabel: "This block's week",
  phaseRulesLabel: "How to progress inside the block",
  phaseDeloadLabel: "The light week",

  warmupTitle: "Warming up in five minutes",
  warmupIntro:
    "Warming up is not ten minutes on a treadmill. It is preparing the movement you are about to do, and this is enough before every session.",
  warmup: [
    { title: "Two minutes raising your temperature", body: "Treadmill, bike or rope, at a pace where you could still talk. The aim is to feel warm, not tired." },
    { title: "Mobility for what you are training", body: "Leg day: ten bodyweight squats and ten hip rotations per side. Chest and shoulder day: ten band shoulder rotations and ten push-ups. Thirty seconds each, and no long static stretching before training." },
    { title: "Ramp-up sets on the first exercise", body: "One set with the empty bar, one with half your working weight and one at seventy per cent, all for a few repetitions. Only then start counting the sets in the plan." },
    { title: "Do not repeat all of it on later exercises", body: "One light set is enough. You are already warm, and warming every exercise from scratch is how an hour of work takes an hour and a half." },
  ],

  techniqueTitle: "The six movements, point by point",
  techniqueIntro:
    "The whole programme rests on six patterns. Get these six right and the rest is detail. Read this before week 1 and come back when the loads go up, which is when technique tends to slip.",
  technique: [
    {
      name: "Squat",
      cues: [
        "Feet shoulder width apart, toes turned slightly out.",
        "Lower under control over two to three seconds, to the depth where you can keep your back flat.",
        "Knees tracking over your toes, never collapsing inwards.",
        "Push the floor away through the whole foot, not the toes.",
      ],
    },
    {
      name: "Bench press",
      cues: [
        "Shoulder blades pulled together and down into the bench, start to finish.",
        "Lower the bar to your chest with elbows around 45 degrees from your torso, not flared to 90.",
        "Feet planted on the floor and hips on the bench.",
        "Press hard on the way up, without slamming the elbows into lockout.",
      ],
    },
    {
      name: "Row",
      cues: [
        "Torso hinged forward, back flat, eyes on the floor a metre ahead.",
        "Pull with your elbows towards your hips, not with your hands.",
        "Squeeze the shoulder blades together at the end and hold for half a second.",
        "Lower under control. Dropping the weight throws away half the exercise.",
      ],
    },
    {
      name: "Pulldown or pull-up",
      cues: [
        "Grip slightly wider than your shoulders.",
        "Start by pulling the shoulder blades down, then bend the elbows.",
        "Pull to your chest without swinging for momentum.",
        "At the top of a pull-up, pause for half a second before lowering slowly.",
      ],
    },
    {
      name: "Overhead press",
      cues: [
        "Bar or dumbbells at chin height, elbows slightly in front of the body.",
        "Squeeze glutes and abs so your lower back does not arch.",
        "Press until your arms are straight overhead, not out in front.",
        "If the front of the shoulder hurts, switch to dumbbells with palms facing each other.",
      ],
    },
    {
      name: "Romanian deadlift",
      cues: [
        "Knees slightly bent and fixed there: the movement comes from the hips, not the knees.",
        "Push your hips back and lower the bar close to your legs.",
        "Stop when your hamstrings are fully stretched with your back still flat.",
        "Stand up by squeezing your glutes. It is not a squat with the bar in front.",
      ],
    },
  ],

  logTitle: "The log sheet",
  logIntro:
    "Print this sheet, or copy it into a notebook, one per session. Without it you do not know whether you progressed, and the programme stops working in week three, which is when memory starts to lie.",
  logHeaders: ["Exercise", "Sets x reps", "Weight", "Reps done", "Notes"],
  logNote:
    "In the notes column write only what matters for next week: whether you had more in the tank, whether you missed a repetition, whether something hurt. If you use the app, this is done for you and compared with last week.",

  testTitle: "Week 13, the test week",
  testIntro:
    "The last week is not for training more, it is for measuring what changed. You train three days, with little volume, and test one lift on each of them.",
  test: [
    { title: "Day 1, push", body: "Warm up properly and do one bench press set stopping with one repetition in reserve. Write down the weight and the repetitions. Then do the rest of the session at half your normal volume." },
    { title: "Day 2, legs", body: "The same with the squat. One real set, logged, and the rest light." },
    { title: "Day 3, pull", body: "The same with rows or pull-ups. One real set, logged, and the rest light." },
    { title: "Afterwards", body: "Compare it with what you logged in week 1. Take the same photos, same light, same time of day. Measure your waist fasted. It is those three numbers, not the scale, that tell you what happened." },
  ],

  homeTitle: "If you train at home",
  homeIntro:
    "The programme works with dumbbells and a pull-up bar. The principles do not change: what changes is the exercise filling each slot. Use this table and keep everything else the same, including sets, repetitions and progression.",
  homeSwaps: [
    { from: "Barbell bench press", to: "Dumbbell press on the floor or an improvised bench" },
    { from: "Barbell squat", to: "Bulgarian split squat with dumbbells, one leg at a time" },
    { from: "Barbell row", to: "Dumbbell row braced on a chair" },
    { from: "Lat pulldown", to: "Band assisted pull-ups, or inverted rows under a table" },
    { from: "Leg press", to: "Walking lunges with dumbbells, long stride" },
    { from: "Leg extension", to: "Sissy squat or split squat with a pause at the bottom" },
    { from: "Machine lateral raise", to: "Dumbbell or band lateral raise" },
  ],

  nutritionTitle: "Eating to grow",
  nutritionDisclaimer:
    "This chapter is general and educational and does not replace professional nutrition support. If you have a medical condition, allergies, or want a tailored meal plan, speak to a registered dietitian.",
  nutrition: [
    {
      title: "Protein first, the rest after",
      body: "Research points to 1.6 to 2 grams of protein per kilo of body weight per day. At 70 kilos that is 112 to 140 grams. If you change one thing about your eating over these ninety days, change this one, and spread it across three or four meals instead of trying to fix it at dinner.",
    },
    {
      title: "A moderate surplus, not a licence",
      body: "To build muscle you need to eat slightly above what you burn, around 200 to 300 calories a day. That usually shows up as 0.25 to 0.5 kilos a week on the scale. Faster than that is fat coming along for the ride, and it has to come off later.",
    },
    {
      title: "Carbohydrates are fuel, not the enemy",
      body: "Rice, potatoes, pasta, oats, bread. They are the difference between a session where the load goes up and a session you drag yourself through. Put them around training if that suits you, but the daily total matters far more than the timing.",
    },
    {
      title: "Fat, enough and no less",
      body: "Around 0.8 grams per kilo of body weight. Olive oil, whole eggs, nuts, oily fish. Cutting fat hard affects sleep and hormones, and you notice it in training about two weeks later.",
    },
    {
      title: "Water and salt",
      body: "Two to three litres a day, more if you train in the heat. Most of the mid session energy drops people blame on weakness are simply dehydration.",
    },
    {
      title: "What to do when you ate badly",
      body: "Nothing. Do not compensate the next day, do not skip meals, do not add punishment cardio. One meal off plan does not undo a week of work. Compensating usually does.",
    },
  ],
  mealsTitle: "A typical day",
  meals: [
    { when: "Breakfast", what: "Three scrambled eggs, two slices of wholegrain bread, plain yoghurt and fruit." },
    { when: "Lunch", what: "Chicken breast or white fish, rice or potato to appetite, vegetables, olive oil on top." },
    { when: "Snack", what: "Greek yoghurt with oats and honey, or tuna with rice cakes." },
    { when: "After training", what: "Whatever meal comes next, with protein and carbohydrates. You do not need a shake if you can eat." },
    { when: "Dinner", what: "Meat or fish, pasta or potato, salad. Repeat lunch if that makes your life simpler." },
  ],

  recoveryTitle: "Sleep, recover, grow",
  recovery: [
    { title: "Seven to eight hours, every night", body: "The only supplement that never fails and costs nothing. A week of five hour nights wipes out two weeks of good training, and you will blame the programme." },
    { title: "Two to three minutes between heavy sets", body: "Short rests are not harder training, they are lighter lifting. A minute is enough on isolation work." },
    { title: "Soreness, and the difference that matters", body: "A muscle sore two days later is normal and measures nothing. Joint pain, sharp pain, or pain that shows up during the movement is not normal: stop the exercise, swap it, and see a professional if it persists." },
    { title: "Walking", body: "Eight thousand steps a day do more for your body composition than any extra Sunday cardio session." },
  ],

  measureTitle: "Measuring progress without fooling yourself",
  measureIntro:
    "The scale on its own is the worst way to judge ninety days of work, because it moves with water, salt and sleep. Measure these four things, always the same way.",
  measure: [
    { title: "The loads", body: "The number that matters most. If your bench went from 40 to 50 kilos in thirteen weeks, something happened, whatever the scale says." },
    { title: "Your waist", body: "Once a week, in the morning, fasted, at navel level. Rising while the loads barely move means eat slightly less." },
    { title: "The photos", body: "Front, side and back, same place, same light, same day of the week. Every four weeks. They show what the numbers hide." },
    { title: "Body weight", body: "Every morning, and use the weekly average, never a single day. Between 0.25 and 0.5 kilos a week is right." },
  ],

  mistakesTitle: "The mistakes that will stall you",
  mistakes: [
    { title: "Switching programmes halfway", body: "Mistake number one, and the most expensive. Three weeks are not enough for anything to work. Follow the ninety days to the end and judge afterwards, with data." },
    { title: "Training to failure on everything", body: "It costs more and returns less. Leave one to three repetitions in reserve on most sets and save failure for the last set of isolation work." },
    { title: "Avoiding the compounds", body: "Half an hour of comfortable machines does not replace squats, presses and rows. They hold up everything else." },
    { title: "Eating less and training more", body: "The combination that guarantees a plateau. If you are not growing and you train four times a week, nine times out of ten the problem is on the plate." },
    { title: "Comparing yourself to somebody ten years in", body: "And, worse, to somebody using pharmacological help who does not say so. Compare yourself to your own log from last week. It is the only honest comparison." },
  ],

  faqTitle: "The questions everybody asks",
  faq: [
    { q: "Can I do cardio?", a: "You can and you should. Two or three sessions of twenty to thirty minutes a week, on non leg days, or walk every day. Do not run long the day before leg day." },
    { q: "What if I miss a session?", a: "Do it the next day and push the rest of the week back. If you missed a whole week, restart at the week you were on, do not go back to the beginning." },
    { q: "Do I need supplements?", a: "You need none of them. Creatine, five grams a day, is the only one with strong evidence and it is cheap. Protein powder is convenient food, not magic." },
    { q: "How often do I train each muscle?", a: "Twice a week, in every block. That is what the research supports and how the programme is built." },
    { q: "Can I swap exercises?", a: "Yes, for an exercise in the same pattern. Swap incline press for dumbbell press, not for lateral raises." },
    { q: "I am a woman, does this work?", a: "It works, unchanged. Training principles do not change with sex. What changes is the aesthetic goal, and that is handled by which isolation work you pick." },
    { q: "And after the ninety days?", a: "Repeat the cycle with heavier weights, or move to a plan written for you. The last chapter covers both." },
  ],

  endTitle: "Day 91",
  endIntro:
    "If you got here with thirteen weeks done and logged, you have already done more than most people who walk into a gym. There are two ways to carry on, and neither of them is starting another random programme off the internet.",
  end: [
    {
      title: "Repeat the cycle",
      body: "Go back to block 1 with the weights you finished on and run it all again. A good programme is meant to be repeated: that is how people progress for years. Keep logging.",
    },
    {
      title: "Stop deciding on your own",
      body: "The app builds your week from your answers and compares every session with the last one, for 35 euros a month. On 1:1 coaching, at 127, I write your plan from what you logged and adjust it every week. Seven days free either way, no card.",
    },
    {
      title: "One thing I ask of you",
      body: "If this programme worked for you, tell me. Message me on Instagram with your week 1 log and your week 13 log. That is what improves the next version of this book, and it is the only social proof I publish.",
    },
  ],
  endCta: "Try the app, 7 days free",
  endUrl: "https://www.kravcoaching.com/start?lang=en",

  footer: "@kravdoesntlift · kravcoaching.com",
  dayLabel: "Day",
  restLabel: "Rest",
  setsLabel: "sets",
  repsLabel: "reps",
};

export function ebookCopy(lang: Lang): EbookCopy {
  return lang === "en" ? EN : PT;
}
