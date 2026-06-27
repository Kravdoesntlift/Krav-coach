import Link from "next/link";

export const metadata = {
  title: "Política de Privacidade — KRAV Coach",
  description: "Como recolhemos, usamos e protegemos os seus dados pessoais.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-5 py-16 space-y-10">
        {/* Header */}
        <div className="space-y-3">
          <Link href="/" className="text-2xl font-black tracking-tighter block">
            KRAV<span style={{ color: "#C9A84C" }}>.</span>
          </Link>
          <h1 className="text-3xl font-black tracking-tight">Política de Privacidade</h1>
          <p className="text-zinc-500 text-sm">Última atualização: Junho de 2026</p>
        </div>

        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">

          {/* Responsável */}
          <section className="space-y-2">
            <h2 className="text-white font-bold text-base">1. Responsável pelo tratamento</h2>
            <p>
              A plataforma KRAV Coach é operada por André Kravchuk, com sede em Portugal.
              Para questões relacionadas com privacidade, contacta:{" "}
              <a href="mailto:kravdoesntlift@gmail.com" className="text-brand-gold underline">
                kravdoesntlift@gmail.com
              </a>
            </p>
          </section>

          {/* Dados recolhidos */}
          <section className="space-y-2">
            <h2 className="text-white font-bold text-base">2. Dados pessoais recolhidos</h2>
            <p>Recolhemos apenas os dados necessários para prestar o serviço de coaching personalizado:</p>
            <ul className="space-y-1 pl-4 list-disc list-outside marker:text-zinc-600">
              <li><strong className="text-white">Conta:</strong> nome, endereço de e-mail e password (armazenada em formato cifrado)</li>
              <li><strong className="text-white">Saúde e progresso:</strong> peso corporal, medidas (cintura, peito, braço), fotografias de progresso e registos pessoais de exercício</li>
              <li><strong className="text-white">Treino:</strong> planos de treino, conclusões de sessões e histórico de exercícios</li>
              <li><strong className="text-white">Check-ins semanais:</strong> notas, nível de energia e peso reportado</li>
              <li><strong className="text-white">Pagamento:</strong> processado integralmente pela Stripe — não armazenamos dados de cartão</li>
              <li><strong className="text-white">Notificações:</strong> subscrição push (endpoint do dispositivo), armazenada para envio de alertas de treino</li>
            </ul>
          </section>

          {/* Finalidade */}
          <section className="space-y-2">
            <h2 className="text-white font-bold text-base">3. Finalidade e base legal</h2>
            <div className="space-y-3">
              <div
                className="p-4 rounded-xl space-y-1"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <p className="text-white font-semibold text-xs">Execução do contrato (Art. 6.º, n.º 1, al. b) RGPD)</p>
                <p className="text-zinc-400 text-xs">Prestação do serviço de coaching — planos de treino, acompanhamento, check-ins e notificações.</p>
              </div>
              <div
                className="p-4 rounded-xl space-y-1"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <p className="text-white font-semibold text-xs">Interesse legítimo (Art. 6.º, n.º 1, al. f) RGPD)</p>
                <p className="text-zinc-400 text-xs">Melhoria da plataforma, segurança e prevenção de fraude.</p>
              </div>
              <div
                className="p-4 rounded-xl space-y-1"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <p className="text-white font-semibold text-xs">Consentimento (Art. 6.º, n.º 1, al. a) RGPD)</p>
                <p className="text-zinc-400 text-xs">Envio de notificações push — revogável a qualquer momento nas definições do perfil.</p>
              </div>
            </div>
          </section>

          {/* Partilha */}
          <section className="space-y-2">
            <h2 className="text-white font-bold text-base">4. Subprocessadores e partilha de dados</h2>
            <p>Não vendemos nem partilhamos os teus dados com terceiros para fins comerciais. Utilizamos os seguintes subprocessadores para operar a plataforma:</p>
            <ul className="space-y-1 pl-4 list-disc list-outside marker:text-zinc-600">
              <li><strong className="text-white">Supabase Inc.</strong> — base de dados e autenticação (servidores na UE)</li>
              <li><strong className="text-white">Stripe Inc.</strong> — processamento de pagamentos (certificação PCI DSS nível 1)</li>
              <li><strong className="text-white">Resend Inc.</strong> — envio de e-mails transacionais</li>
              <li><strong className="text-white">Vercel Inc.</strong> — alojamento da plataforma</li>
            </ul>
            <p className="text-zinc-500 text-xs mt-2">
              Todos os subprocessadores estão sujeitos a acordos de tratamento de dados compatíveis com o RGPD.
            </p>
          </section>

          {/* Retenção */}
          <section className="space-y-2">
            <h2 className="text-white font-bold text-base">5. Conservação dos dados</h2>
            <p>
              Os dados são conservados enquanto a tua conta estiver ativa. Após cancelamento, os dados pessoais são eliminados no prazo de <strong className="text-white">30 dias</strong>, exceto registos de faturação que são conservados por <strong className="text-white">10 anos</strong> por obrigação legal.
            </p>
          </section>

          {/* Direitos */}
          <section className="space-y-2">
            <h2 className="text-white font-bold text-base">6. Os teus direitos (RGPD)</h2>
            <p>Tens direito a:</p>
            <ul className="space-y-1 pl-4 list-disc list-outside marker:text-zinc-600">
              <li><strong className="text-white">Acesso</strong> — receber uma cópia dos dados que tratamos sobre ti</li>
              <li><strong className="text-white">Retificação</strong> — corrigir dados inexatos</li>
              <li><strong className="text-white">Apagamento</strong> — solicitar a eliminação da tua conta e dados (&ldquo;direito a ser esquecido&rdquo;)</li>
              <li><strong className="text-white">Portabilidade</strong> — exportar os teus dados em formato estruturado</li>
              <li><strong className="text-white">Oposição</strong> — opor-te ao tratamento baseado em interesse legítimo</li>
              <li><strong className="text-white">Limitação</strong> — solicitar a suspensão do tratamento em determinadas circunstâncias</li>
            </ul>
            <p className="mt-2">
              Para exercer qualquer direito, contacta{" "}
              <a href="mailto:kravdoesntlift@gmail.com" className="text-brand-gold underline">
                kravdoesntlift@gmail.com
              </a>. Respondemos em até 30 dias. Tens também o direito de apresentar reclamação à{" "}
              <strong className="text-white">CNPD</strong> (Comissão Nacional de Proteção de Dados).
            </p>
          </section>

          {/* Cookies */}
          <section className="space-y-2">
            <h2 className="text-white font-bold text-base">7. Cookies e rastreamento</h2>
            <p>
              Utilizamos apenas cookies estritamente necessários para autenticação e segurança da sessão. <strong className="text-white">Não utilizamos cookies de rastreamento, publicidade ou analytics de terceiros.</strong>
            </p>
          </section>

          {/* Segurança */}
          <section className="space-y-2">
            <h2 className="text-white font-bold text-base">8. Segurança</h2>
            <p>
              Os dados são transmitidos por HTTPS e armazenados com Row-Level Security (RLS) — cada utilizador só acede aos seus próprios dados. As passwords são armazenadas com hashing seguro pelo Supabase Auth.
            </p>
          </section>

          {/* Alterações */}
          <section className="space-y-2">
            <h2 className="text-white font-bold text-base">9. Alterações a esta política</h2>
            <p>
              Podemos atualizar esta política ocasionalmente. Alterações significativas serão comunicadas por e-mail com antecedência mínima de 14 dias. A data de atualização no topo desta página indica a versão em vigor.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div
          className="p-5 rounded-2xl text-center space-y-2"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p className="text-zinc-400 text-sm">Dúvidas sobre privacidade?</p>
          <a
            href="mailto:kravdoesntlift@gmail.com"
            className="font-semibold text-sm"
            style={{ color: "#C9A84C" }}
          >
            kravdoesntlift@gmail.com
          </a>
        </div>

        <div className="text-center">
          <Link href="/" className="text-zinc-600 text-xs hover:text-zinc-400 transition-colors">
            ← Voltar à página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
