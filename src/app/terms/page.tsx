import Link from "next/link";

export const metadata = {
  title: "Termos de Serviço — KRAV Coach",
  description: "Termos e condições de utilização da plataforma KRAV Coach.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-5 py-16 space-y-10">
        {/* Header */}
        <div className="space-y-3">
          <Link href="/" className="text-2xl font-black tracking-tighter block">
            KRAV<span style={{ color: "#C9A84C" }}>.</span>
          </Link>
          <h1 className="text-3xl font-black tracking-tight">Termos de Serviço</h1>
          <p className="text-zinc-500 text-sm">Última atualização: julho de 2026</p>
        </div>

        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">

          <section className="space-y-2">
            <h2 className="text-white font-bold text-base">1. Quem somos</h2>
            <p>
              A plataforma KRAV Coach é operada por André Kravchuk, personal trainer certificado, com sede em Portugal (NIF disponível mediante pedido).
              Contacto:{" "}
              <a href="mailto:kravdoesntlift@gmail.com" className="text-brand-gold underline">
                kravdoesntlift@gmail.com
              </a>
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-white font-bold text-base">2. O serviço</h2>
            <p>
              O KRAV Coach é uma plataforma de coaching personalizado online que inclui:
            </p>
            <ul className="space-y-1 pl-4 list-disc list-outside marker:text-zinc-600">
              <li>Planos de treino semanais criados e ajustados pelo coach</li>
              <li>Acompanhamento de progresso (peso, medidas, fotografias)</li>
              <li>Check-ins semanais com feedback do coach</li>
              <li>Chat com assistente de IA e acesso direto ao coach</li>
              <li>Relatórios semanais de progresso</li>
              <li>Leaderboard mensal e sistema de conquistas</li>
              <li>Sincronização de dados de saúde (passos e atividade)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-white font-bold text-base">3. Trial gratuito</h2>
            <p>
              Novos clientes têm acesso a um período de prova gratuito de <strong className="text-white">7 dias</strong>, sem necessidade de cartão de crédito. O trial começa no momento do registo e termina automaticamente ao fim de 7 dias.
            </p>
            <p>
              Após o fim do trial, o acesso à plataforma fica suspenso até à ativação de uma subscrição paga. Não é efetuado qualquer débito automático no final do trial.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-white font-bold text-base">4. Subscrição e pagamento</h2>
            <p>
              A subscrição é mensal, renovada automaticamente na data de aniversário do pagamento. O valor e a periodicidade são apresentados no momento da compra. Os pagamentos são processados pela <strong className="text-white">Stripe</strong> com segurança PCI DSS nível 1 — não armazenamos dados de cartão.
            </p>
            <p>
              Em caso de falha no pagamento, a renovação é tentada automaticamente. Após falha definitiva, o acesso é suspenso. O cliente é notificado por e-mail em todos os casos.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-white font-bold text-base">5. Cancelamento e reembolso</h2>
            <p>
              Podes cancelar a subscrição a qualquer momento contactando{" "}
              <a href="mailto:kravdoesntlift@gmail.com" className="text-brand-gold underline">
                kravdoesntlift@gmail.com
              </a>. O cancelamento tem efeito no fim do período já pago — o acesso mantém-se ativo até essa data.
            </p>
            <p>
              Ao abrigo do direito europeu (Diretiva 2011/83/UE), tens direito a desistir do contrato no prazo de <strong className="text-white">14 dias</strong> a partir da primeira compra, com reembolso integral, desde que não tenhas utilizado o serviço de forma significativa nesse período.
            </p>
            <p>
              Fora deste prazo, não são efetuados reembolsos parciais por meses já pagos, exceto em casos devidamente justificados a avaliar pelo coach.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-white font-bold text-base">6. Responsabilidades do coach</h2>
            <p>O coach compromete-se a:</p>
            <ul className="space-y-1 pl-4 list-disc list-outside marker:text-zinc-600">
              <li>Criar planos de treino adaptados ao perfil e objetivos do cliente</li>
              <li>Fornecer feedback aos check-ins semanais num prazo razoável</li>
              <li>Manter a confidencialidade dos dados do cliente</li>
              <li>Atualizar os planos de acordo com a evolução e feedback recebido</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-white font-bold text-base">7. Responsabilidades do cliente</h2>
            <p>O cliente compromete-se a:</p>
            <ul className="space-y-1 pl-4 list-disc list-outside marker:text-zinc-600">
              <li>Fornecer informações verdadeiras sobre o seu estado de saúde, lesões e limitações físicas</li>
              <li>Utilizar a plataforma apenas para uso pessoal e não partilhar o acesso com terceiros</li>
              <li>Não reproduzir, distribuir ou revender os planos de treino fornecidos</li>
              <li>Manter as credenciais de acesso em segurança</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-white font-bold text-base">8. Aviso de saúde</h2>
            <div
              className="p-4 rounded-xl"
              style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}
            >
              <p className="text-zinc-300">
                O coaching online não substitui aconselhamento médico. Antes de iniciar qualquer programa de treino, consulta um médico se tiveres condições de saúde pré-existentes, lesões ou dúvidas sobre a tua capacidade física. O coach e a plataforma KRAV não são responsáveis por lesões resultantes da prática desportiva.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-white font-bold text-base">9. Propriedade intelectual</h2>
            <p>
              Todos os planos de treino, conteúdos e materiais disponibilizados na plataforma são propriedade de André Kravchuk e estão protegidos por direitos de autor. A sua utilização é exclusivamente pessoal — qualquer reprodução ou distribuição não autorizada é proibida.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-white font-bold text-base">10. Limitação de responsabilidade</h2>
            <p>
              Na máxima extensão permitida por lei, a responsabilidade total da plataforma KRAV Coach perante o cliente está limitada ao valor pago nos últimos 30 dias. Não somos responsáveis por danos indiretos, perda de dados ou interrupções de serviço causadas por terceiros (fornecedores de infraestrutura, falhas de rede, etc.).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-white font-bold text-base">11. Alterações ao serviço e aos termos</h2>
            <p>
              Reservamo-nos o direito de alterar estes termos ou o serviço. Alterações relevantes são comunicadas por e-mail com pelo menos <strong className="text-white">14 dias de antecedência</strong>. A utilização contínua da plataforma após essa data constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-white font-bold text-base">12. Lei aplicável e foro</h2>
            <p>
              Estes termos são regidos pela legislação portuguesa e da União Europeia. Em caso de litígio, as partes comprometem-se a tentar uma resolução amigável. Na impossibilidade, é competente o tribunal da comarca de Lisboa, sem prejuízo do recurso a mecanismos de resolução alternativa de litígios (RAL) disponíveis em{" "}
              <a href="https://www.consumidor.gov.pt" target="_blank" rel="noopener noreferrer" className="text-brand-gold underline">
                consumidor.gov.pt
              </a>.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div
          className="p-5 rounded-2xl text-center space-y-2"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p className="text-zinc-400 text-sm">Dúvidas sobre estes termos?</p>
          <a
            href="mailto:kravdoesntlift@gmail.com"
            className="font-semibold text-sm"
            style={{ color: "#C9A84C" }}
          >
            kravdoesntlift@gmail.com
          </a>
        </div>

        <div className="flex justify-center gap-6 text-xs text-zinc-600">
          <Link href="/privacy" className="hover:text-zinc-400 transition-colors">
            Política de Privacidade
          </Link>
          <Link href="/" className="hover:text-zinc-400 transition-colors">
            ← Página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
