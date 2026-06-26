"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const DEFAULT_EXERCISES: { name: string; muscle_groups: string[]; description: string }[] = [
  // PEITO
  { name: "Supino com Barra", muscle_groups: ["Peito", "Deltóide anterior", "Tríceps"], description: "Deita no banco horizontal. Segura a barra com as mãos um pouco mais largas que os ombros. Baixa a barra ao peito de forma controlada e empurra até extensão completa." },
  { name: "Supino com Halteres", muscle_groups: ["Peito", "Deltóide anterior", "Tríceps"], description: "Igual ao supino com barra mas com um halter em cada mão. Permite maior amplitude de movimento e trabalha a estabilidade de forma independente em cada lado." },
  { name: "Supino Inclinado com Barra", muscle_groups: ["Peito superior", "Deltóide anterior", "Tríceps"], description: "Banco inclinado a 30-45°. Trabalha a parte superior do peito com maior intensidade." },
  { name: "Supino Inclinado com Halteres", muscle_groups: ["Peito superior", "Deltóide anterior", "Tríceps"], description: "Igual ao inclinado com barra mas com halteres. Maior amplitude e controlo individual de cada braço." },
  { name: "Supino Declinado com Barra", muscle_groups: ["Peito inferior", "Tríceps"], description: "Banco declinado. Trabalha a parte inferior do peito. Pés fixos nos suportes." },
  { name: "Crucifixo com Halteres", muscle_groups: ["Peito", "Deltóide anterior"], description: "Deita no banco, braços abertos em arco com ligeira flexão no cotovelo. Junta os halteres no topo como se abraçasses uma árvore." },
  { name: "Crucifixo nas Polias", muscle_groups: ["Peito", "Deltóide anterior"], description: "Em pé entre as duas polias altas. Puxa os cabos para a frente e para baixo cruzando ao centro. Mantém os cotovelos ligeiramente fletidos." },
  { name: "Pec Deck (Máquina Borboleta)", muscle_groups: ["Peito", "Deltóide anterior"], description: "Sentado na máquina com os antebraços apoiados nos suportes. Une os braços à frente do peito de forma controlada." },
  { name: "Chest Press (Máquina)", muscle_groups: ["Peito", "Deltóide anterior", "Tríceps"], description: "Sentado na máquina. Empurra os manípulos para a frente até extensão e regressa de forma controlada." },
  { name: "Flexões", muscle_groups: ["Peito", "Deltóide anterior", "Tríceps"], description: "Mãos no chão à largura dos ombros, corpo em linha reta. Desce o peito ao chão e empurra até extensão dos braços." },
  { name: "Flexões com Pés Elevados", muscle_groups: ["Peito superior", "Deltóide anterior", "Tríceps"], description: "Igual às flexões normais mas com os pés em cima de uma cadeira ou sofá. Aumenta a ênfase no peito superior." },
  { name: "Flexões com Diamante", muscle_groups: ["Tríceps", "Peito"], description: "Mãos juntas em forma de diamante no chão. Maior ênfase nos tríceps." },
  { name: "Mergulhos em Paralelas — Peito", muscle_groups: ["Peito inferior", "Tríceps", "Deltóide anterior"], description: "Nas paralelas, inclina o corpo ligeiramente para a frente ao descer. Desce até os ombros ficarem abaixo dos cotovelos." },
  // COSTAS
  { name: "Peso Morto (Deadlift)", muscle_groups: ["Costas", "Glúteos", "Isquiotibiais", "Trapézio", "Core"], description: "Barra no chão, pés à largura dos ombros. Agarra a barra com as mãos fora dos joelhos. Levanta empurrando o chão com os pés, não puxando com as costas. Corpo em linha reta ao topo." },
  { name: "Remada com Barra", muscle_groups: ["Dorsais", "Rombóides", "Trapézio médio", "Bíceps"], description: "Corpo inclinado a 45°, barra nas mãos. Puxa a barra em direção ao abdómen baixo mantendo os cotovelos perto do corpo." },
  { name: "Remada com Halter (1 braço)", muscle_groups: ["Dorsais", "Rombóides", "Trapézio médio", "Bíceps"], description: "Joelho e mão apoiados no banco. Puxa o halter até à anca, cotovelo para trás. Costas paralelas ao chão." },
  { name: "Remada na Polia Baixa", muscle_groups: ["Dorsais", "Rombóides", "Trapézio médio", "Bíceps"], description: "Sentado na máquina de cabo. Puxa o manípulo em direção ao abdómen mantendo o peito levantado e os cotovelos atrás do corpo." },
  { name: "Remada em T (T-Bar Row)", muscle_groups: ["Dorsais", "Rombóides", "Trapézio", "Bíceps"], description: "Corpo inclinado sobre a barra em T. Puxa em direção ao peito com as mãos a agarrar os manípulos." },
  { name: "Pulldown (Puxada)", muscle_groups: ["Dorsais", "Bíceps", "Trapézio inferior"], description: "Sentado na máquina. Puxa a barra ao peito abrindo os cotovelos para baixo e para fora. Mantém o peito levantado." },
  { name: "Pulldown Neutro (Pega Fechada)", muscle_groups: ["Dorsais", "Bíceps"], description: "Igual ao pulldown mas com pega neutra (palmas viradas uma para a outra). Maior amplitude e menos stress nos ombros." },
  { name: "Straight Arm Pulldown", muscle_groups: ["Dorsais"], description: "Em pé na polia alta. Braços quase estendidos, puxa o cabo de cima para baixo até às coxas." },
  { name: "Remada na Máquina", muscle_groups: ["Dorsais", "Rombóides", "Bíceps"], description: "Peito apoiado no suporte da máquina. Puxa os manípulos para trás apertando as omoplatas." },
  { name: "Face Pull", muscle_groups: ["Deltóide posterior", "Trapézio", "Rombóides"], description: "Polia alta com corda. Puxa em direção à cara, separando as mãos no final do movimento. Cotovelos ao nível dos ombros ou acima." },
  { name: "Pullover com Halter", muscle_groups: ["Dorsais", "Peito", "Tríceps"], description: "Deitado no banco, um halter segurado com as duas mãos acima do peito. Baixa o halter para trás da cabeça com os braços semi-estendidos." },
  { name: "Dominadas — Pega Pronada (Pullup)", muscle_groups: ["Dorsais", "Bíceps", "Trapézio"], description: "Agarrar a barra com as palmas viradas para fora, mãos largas. Puxa o corpo até o queixo ultrapassar a barra. Descer de forma controlada." },
  { name: "Chin-Up — Pega Supinada", muscle_groups: ["Dorsais", "Bíceps"], description: "Igual às dominadas mas com as palmas viradas para dentro. Maior ativação do bíceps." },
  { name: "Dominadas com Pega Neutra", muscle_groups: ["Dorsais", "Bíceps"], description: "Palmas viradas uma para a outra. Versão mais suave nos ombros." },
  // OMBROS
  { name: "Press Militar com Barra", muscle_groups: ["Deltóide anterior", "Deltóide médio", "Trapézio", "Tríceps"], description: "Em pé, barra ao nível das clavículas. Empurra acima da cabeça até extensão completa. Não bloquear os joelhos." },
  { name: "Press com Halteres (sentado)", muscle_groups: ["Deltóide anterior", "Deltóide médio", "Trapézio", "Tríceps"], description: "Sentado no banco inclinado. Empurra os halteres acima da cabeça sem arquear a lombar." },
  { name: "Arnold Press", muscle_groups: ["Deltóide anterior", "Deltóide médio", "Deltóide posterior", "Tríceps"], description: "Começa com as palmas viradas para ti ao nível do queixo. Ao empurrar para cima, roda os pulsos até as palmas ficarem viradas para a frente." },
  { name: "Elevações Laterais com Halteres", muscle_groups: ["Deltóide médio"], description: "Em pé, halteres nos lados. Eleva os braços lateralmente até ao nível dos ombros com ligeira flexão no cotovelo. Não trapacear com o corpo." },
  { name: "Elevações Laterais na Polia", muscle_groups: ["Deltóide médio"], description: "Polia baixa ao lado do corpo. Puxa o cabo lateralmente até ao nível do ombro. Mais tensão constante que os halteres." },
  { name: "Elevações Frontais com Halteres", muscle_groups: ["Deltóide anterior"], description: "Em pé, halteres à frente das coxas. Eleva um braço de cada vez até ao nível dos ombros, braço quase estendido." },
  { name: "Pássaro com Halteres (Rear Delt)", muscle_groups: ["Deltóide posterior", "Rombóides", "Trapézio médio"], description: "Corpo inclinado a 90°, halteres a pender. Eleva os braços lateralmente como asas até ao nível dos ombros." },
  { name: "Pássaro na Máquina (Rear Delt Fly)", muscle_groups: ["Deltóide posterior", "Rombóides"], description: "Sentado na máquina pec deck virado para a frente. Empurra os manípulos para trás com os braços semi-estendidos." },
  { name: "Remada Vertical (Upright Row)", muscle_groups: ["Deltóide médio", "Trapézio", "Bíceps"], description: "Em pé, barra ou halteres nas mãos. Puxa em direção ao queixo com os cotovelos a subir acima dos ombros." },
  { name: "Press na Máquina de Ombros", muscle_groups: ["Deltóide anterior", "Deltóide médio", "Tríceps"], description: "Sentado na máquina. Empurra os manípulos acima da cabeça de forma controlada." },
  { name: "Encolher de Ombros com Barra (Shrugs)", muscle_groups: ["Trapézio superior"], description: "Em pé com a barra à frente. Encolhe os ombros verticalmente tão alto quanto possível. Sem rodar." },
  // BÍCEPS
  { name: "Rosca Direta com Barra", muscle_groups: ["Bíceps", "Braquial"], description: "Em pé, barra nas mãos com pega supinada. Sobe a barra até ao peito mantendo os cotovelos fixos ao lado do corpo." },
  { name: "Rosca Direta com Halteres (alternada)", muscle_groups: ["Bíceps", "Braquial"], description: "Igual mas com halteres, alternando um braço de cada vez. Permite supinação completa do pulso." },
  { name: "Rosca Martelo (Hammer Curl)", muscle_groups: ["Bíceps", "Braquial", "Braquiorradial"], description: "Halteres com pega neutra (palmas viradas uma para a outra). Sobe sem rodar o pulso." },
  { name: "Rosca Inclinada com Halteres", muscle_groups: ["Bíceps (cabeça longa)"], description: "Sentado no banco inclinado a 45-60°. Os braços ficam atrás do corpo, dando maior amplitude e estiramento ao bíceps." },
  { name: "Rosca Scott (Preacher Curl)", muscle_groups: ["Bíceps (cabeça curta)", "Braquial"], description: "Antebraços apoiados no suporte inclinado. Sobe e desce de forma completa e controlada." },
  { name: "Rosca na Polia Baixa", muscle_groups: ["Bíceps"], description: "Em pé na polia baixa com barra ou corda. Sobe mantendo os cotovelos fixos." },
  { name: "Rosca Concentrada", muscle_groups: ["Bíceps"], description: "Sentado, cotovelo apoiado na parte interior da coxa. Sobe o halter de forma isolada." },
  { name: "Rosca na Máquina", muscle_groups: ["Bíceps", "Braquial"], description: "Sentado na máquina. Movimento guiado, ideal para trabalhar até à fadiga com segurança." },
  // TRÍCEPS
  { name: "Extensão de Tríceps na Polia (Pushdown)", muscle_groups: ["Tríceps"], description: "Em pé na polia alta com barra ou corda. Estende os braços para baixo mantendo os cotovelos fixos ao lado do corpo." },
  { name: "Extensão de Tríceps com Corda", muscle_groups: ["Tríceps (cabeça lateral)"], description: "Igual ao pushdown mas com corda. No final do movimento separa as mãos para maior ativação." },
  { name: "Extensão Acima da Cabeça com Halter", muscle_groups: ["Tríceps (cabeça longa)"], description: "Sentado ou em pé. Halter com as duas mãos atrás da cabeça. Estende os braços para cima mantendo os cotovelos apontados para a frente." },
  { name: "Skull Crusher (Extensão Francesa)", muscle_groups: ["Tríceps"], description: "Deitado no banco, barra ou halteres. Desce o peso em direção à testa dobrando apenas os cotovelos. Extensão completa no topo." },
  { name: "Supino Fechado (Close Grip Bench)", muscle_groups: ["Tríceps", "Peito", "Deltóide anterior"], description: "Supino com pega estreita (mãos à largura dos ombros). Cotovelos perto do corpo ao descer." },
  { name: "Mergulhos em Paralelas — Tríceps", muscle_groups: ["Tríceps", "Peito", "Deltóide anterior"], description: "Nas paralelas com o corpo vertical (não inclinado). Desce até 90° nos cotovelos e empurra até extensão." },
  { name: "Kickback com Halter", muscle_groups: ["Tríceps"], description: "Corpo inclinado, cotovelo junto ao corpo fixo a 90°. Estende o braço para trás até ficar paralelo ao chão." },
  { name: "Mergulhos na Cadeira", muscle_groups: ["Tríceps"], description: "Mãos apoiadas na borda de uma cadeira, pés no chão ou elevados. Desce e sobe dobrando os cotovelos." },
  // QUADRÍCEPS
  { name: "Agachamento com Barra (Squat)", muscle_groups: ["Quadríceps", "Glúteos", "Isquiotibiais", "Core"], description: "Barra nos trapézios. Pés à largura dos ombros. Desce até as coxas ficarem paralelas ao chão mantendo as costas retas. Joelhos na direção dos pés." },
  { name: "Front Squat", muscle_groups: ["Quadríceps", "Glúteos", "Core"], description: "Barra apoiada nos deltóides frontais. Postura mais vertical que o squat normal. Exige maior mobilidade no tornozelo." },
  { name: "Agachamento na Smith Machine", muscle_groups: ["Quadríceps", "Glúteos"], description: "Igual ao squat mas na máquina guiada. Mais seguro para iniciantes ou para treinar sozinho." },
  { name: "Leg Press 45°", muscle_groups: ["Quadríceps", "Glúteos", "Isquiotibiais"], description: "Sentado na máquina inclinada. Pés na plataforma à largura dos ombros. Desce até 90° nos joelhos e empurra sem bloquear as articulações." },
  { name: "Extensão de Pernas (Leg Extension)", muscle_groups: ["Quadríceps"], description: "Sentado na máquina. Estende as pernas até quase horizontal e desce de forma controlada. Isolamento total do quadríceps." },
  { name: "Afundo com Halteres (Lunges)", muscle_groups: ["Quadríceps", "Glúteos", "Isquiotibiais"], description: "Em pé com halteres nas mãos. Dá um passo à frente e desce o joelho traseiro até quase tocar o chão. Alterna as pernas." },
  { name: "Afundo Búlgaro (Bulgarian Split Squat)", muscle_groups: ["Quadríceps", "Glúteos", "Isquiotibiais"], description: "Pé traseiro apoiado num banco. Desce o joelho traseiro ao chão. Excelente para desequilíbrios entre pernas." },
  { name: "Hack Squat", muscle_groups: ["Quadríceps"], description: "Na máquina hack squat. Posição dos pés baixa na plataforma para maior ênfase no quadríceps." },
  { name: "Step Up com Halteres", muscle_groups: ["Quadríceps", "Glúteos"], description: "Sobe e desce de um step ou banco segurando halteres. Alternativo e funcional." },
  { name: "Agachamento Bodyweight", muscle_groups: ["Quadríceps", "Glúteos"], description: "Pés à largura dos ombros, braços à frente para equilíbrio. Desce até as coxas ficarem paralelas ao chão." },
  { name: "Agachamento com Salto", muscle_groups: ["Quadríceps", "Glúteos", "Gémeos"], description: "Igual ao agachamento bodyweight mas com salto explosivo ao subir." },
  // GLÚTEOS E ISQUIOTIBIAIS
  { name: "Hip Thrust com Barra", muscle_groups: ["Glúteos", "Isquiotibiais"], description: "Costas apoiadas num banco, barra sobre as ancas. Empurra as ancas para cima até o corpo ficar paralelo ao chão. Aperta os glúteos no topo." },
  { name: "Glute Bridge", muscle_groups: ["Glúteos", "Isquiotibiais"], description: "Deitado no chão, joelhos dobrados. Empurra as ancas para cima espremendo os glúteos. Versão mais acessível do hip thrust." },
  { name: "Romanian Deadlift com Barra", muscle_groups: ["Isquiotibiais", "Glúteos", "Lombar"], description: "Em pé com a barra. Inclina o corpo para a frente mantendo a barra perto das pernas e as costas retas. Desce até sentir estiramento nos isquiotibiais." },
  { name: "Romanian Deadlift com Halteres", muscle_groups: ["Isquiotibiais", "Glúteos", "Lombar"], description: "Igual mas com halteres. Mais fácil de controlar a posição." },
  { name: "Leg Curl Deitado", muscle_groups: ["Isquiotibiais"], description: "Deitado de barriga para baixo na máquina. Dobra os joelhos puxando os calcanhares em direção ao glúteo." },
  { name: "Leg Curl Sentado", muscle_groups: ["Isquiotibiais"], description: "Sentado na máquina. Puxa os calcanhares para baixo e para trás contra a resistência." },
  { name: "Good Morning com Barra", muscle_groups: ["Isquiotibiais", "Lombar", "Glúteos"], description: "Barra nos trapézios. Inclina o tronco para a frente dobrando ligeiramente os joelhos. Mantém as costas neutras." },
  { name: "Abdução de Anca (Máquina)", muscle_groups: ["Glúteo médio", "Glúteo mínimo"], description: "Sentado na máquina de abdução. Abre as pernas contra a resistência até ao máximo. Excelente para o glúteo médio." },
  { name: "Adução de Anca (Máquina)", muscle_groups: ["Adutores"], description: "Sentado na máquina de adução. Fecha as pernas contra a resistência." },
  { name: "Kick Back na Polia (Glúteo)", muscle_groups: ["Glúteos"], description: "Em pé na polia baixa com a pulseira no tornozelo. Lança a perna para trás e para cima mantendo o core firme." },
  { name: "Glute Bridge com Pé Elevado", muscle_groups: ["Glúteos", "Isquiotibiais"], description: "Deitado com um pé num banco ou sofá. Empurra as ancas com uma perna só. Mais intenso que o glute bridge normal." },
  { name: "Hip Thrust com Pé no Sofá", muscle_groups: ["Glúteos"], description: "Costas no sofá, pés no chão. Mesmo movimento do hip thrust com barra mas sem carga. Adiciona mochila com peso para dificultar." },
  // GÉMEOS
  { name: "Elevação de Calcanhar em Pé", muscle_groups: ["Gastrocnémio", "Sóleo"], description: "Na máquina ou no degrau. Sobe na ponta dos pés o mais alto possível e desce até o calcanhar ficar abaixo do nível do degrau para amplitude total." },
  { name: "Elevação de Calcanhar Sentado", muscle_groups: ["Sóleo"], description: "Sentado na máquina com joelhos dobrados. O sóleo trabalha mais nesta posição. Movimento completo e controlado." },
  { name: "Elevação de Calcanhar no Leg Press", muscle_groups: ["Gastrocnémio"], description: "No leg press, coloca só a ponta dos pés na borda inferior da plataforma. Faz elevações com as pernas quase estendidas." },
  // CORE
  { name: "Prancha (Plank)", muscle_groups: ["Core", "Deltóides", "Glúteos"], description: "Apoiado nos antebraços e pontas dos pés, corpo em linha reta. Mantém sem deixar as ancas subir ou descer." },
  { name: "Prancha Lateral", muscle_groups: ["Oblíquos", "Core"], description: "Apoiado num antebraço e no pé lateral. Corpo em linha reta de lado. Pode dobrar o joelho inferior para facilitar." },
  { name: "Crunch", muscle_groups: ["Reto abdominal"], description: "Deitado, joelhos dobrados, mãos atrás da cabeça. Eleva apenas as omoplatas do chão contraindo o abdómen. Não puxar o pescoço." },
  { name: "Crunch na Polia (Cable Crunch)", muscle_groups: ["Reto abdominal"], description: "Ajoelhado na polia alta com corda. Dobra o tronco para baixo em direção aos joelhos contraindo o abdómen." },
  { name: "Elevação de Pernas Deitado", muscle_groups: ["Reto abdominal inferior", "Flexores da anca"], description: "Deitado no chão, pernas estendidas. Eleva ambas as pernas até 90° e desce sem deixar tocar no chão." },
  { name: "Elevação de Pernas na Barra", muscle_groups: ["Reto abdominal", "Flexores da anca"], description: "Suspenso na barra. Eleva as pernas até ficarem paralelas ao chão ou mais. Versão avançada: pernas estendidas." },
  { name: "Russian Twist", muscle_groups: ["Oblíquos", "Reto abdominal"], description: "Sentado com tronco inclinado a 45°, joelhos dobrados. Roda o tronco de lado a lado com ou sem peso." },
  { name: "Ab Wheel (Roda Abdominal)", muscle_groups: ["Core", "Dorsais", "Ombros"], description: "Ajoelhado com a roda nas mãos. Rola para a frente estendendo o corpo e regressa contraindo o core. Exercício avançado." },
  { name: "Mountain Climber", muscle_groups: ["Core", "Deltóides", "Quadríceps"], description: "Em posição de flexão. Alterna trazendo os joelhos ao peito rapidamente. Combina core com cardio." },
  { name: "Dead Bug", muscle_groups: ["Core", "Lombar"], description: "Deitado no chão, braços para cima, joelhos a 90°. Estende o braço direito e a perna esquerda simultaneamente mantendo a lombar colada ao chão. Alterna." },
  // FULL BODY / CASA
  { name: "Burpee", muscle_groups: ["Core", "Quadríceps", "Glúteos", "Peito", "Deltóides"], description: "De pé, desce as mãos ao chão, salta para a posição de flexão, faz uma flexão, salta os pés para as mãos e salta para cima com os braços acima da cabeça. Exercício full body de alta intensidade." },
  { name: "Afundo Alternado", muscle_groups: ["Quadríceps", "Glúteos"], description: "Sem pesos. Afundo alternado no mesmo lugar ou em deslocamento." },
  { name: "Pike Push-Up", muscle_groups: ["Deltóide anterior", "Tríceps"], description: "Mãos e pés no chão em forma de V invertido. Dobra os cotovelos baixando a cabeça ao chão. Simula o press de ombros." },
  { name: "Superman", muscle_groups: ["Lombar", "Glúteos", "Trapézio"], description: "Deitado de barriga para baixo. Eleva simultaneamente os braços e as pernas do chão contraindo a lombar e os glúteos." },
];

async function getCoach() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "coach") return { supabase, user: null };
  return { supabase, user };
}

export async function seedDefaultLibrary(): Promise<{ error?: string; count?: number }> {
  const { supabase, user } = await getCoach();
  if (!user) return { error: "Não autenticado." };

  // Check if already seeded
  const { count: existing } = await supabase
    .from("exercise_library")
    .select("id", { count: "exact", head: true })
    .eq("coach_id", user.id);

  if ((existing ?? 0) > 0) {
    return { error: "A biblioteca já tem exercícios. Adiciona manualmente para não duplicar." };
  }

  const rows = DEFAULT_EXERCISES.map((ex) => ({
    coach_id: user.id,
    name: ex.name,
    muscle_groups: ex.muscle_groups,
    description: ex.description,
    video_url: null,
  }));

  const { error } = await supabase.from("exercise_library").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/coach/library");
  return { count: rows.length };
}

export async function addExercise(data: {
  name: string;
  muscle_groups: string[];
  description?: string | null;
  video_url?: string | null;
}): Promise<{ error?: string; id?: string }> {
  const { supabase, user } = await getCoach();
  if (!user) return { error: "Não autenticado." };

  const { data: row, error } = await supabase
    .from("exercise_library")
    .insert({
      coach_id: user.id,
      name: data.name,
      muscle_groups: data.muscle_groups,
      description: data.description ?? null,
      video_url: data.video_url ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/coach/library");
  return { id: row.id };
}

export async function updateExercise(id: string, data: {
  name: string;
  muscle_groups: string[];
  description?: string | null;
  video_url?: string | null;
}): Promise<{ error?: string }> {
  const { supabase, user } = await getCoach();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("exercise_library")
    .update({
      name: data.name,
      muscle_groups: data.muscle_groups,
      description: data.description ?? null,
      video_url: data.video_url ?? null,
    })
    .eq("id", id)
    .eq("coach_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/coach/library");
  return {};
}

export async function deleteExercise(id: string): Promise<{ error?: string }> {
  const { supabase, user } = await getCoach();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("exercise_library")
    .delete()
    .eq("id", id)
    .eq("coach_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/coach/library");
  return {};
}
