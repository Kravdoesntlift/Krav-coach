import type { Metadata } from "next";
import Link from "next/link";
import { EBOOK } from "@/lib/ebook/content";
import { ebookToken } from "@/lib/ebook/access";

/**
 * After the payment.
 *
 * The book opens from here, without waiting for any email: the webhook sends
 * one too, but an inbox can be slow, can filter us, or can be a typo, and
 * somebody who has just paid should never be left looking at a page that says
 * "check your email".
 */

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const GOLD = "#C9A84C";

async function paidSession(sessionId: string | undefined): Promise<boolean> {
  if (!sessionId || !process.env.STRIPE_SECRET_KEY) return false;
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia" as "2026-04-22.dahlia",
    });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session.payment_status === "paid" && session.metadata?.product === EBOOK.id;
  } catch (e) {
    console.error("[ebook] could not verify checkout session:", e);
    return false;
  }
}

export default async function EbookThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; lang?: string }>;
}) {
  const { session_id, lang: langParam } = await searchParams;
  const isEN = langParam === "en";
  const paid = await paidSession(session_id);
  const href = `/ebook/ler?t=${ebookToken()}${isEN ? "&lang=en" : ""}`;

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-16 bg-black text-white">
      <div className="w-full max-w-lg text-center space-y-5">
        <p className="text-xl font-black tracking-tighter">KRAV<span style={{ color: GOLD }}>.</span></p>

        {paid ? (
          <>
            <div className="text-4xl">✅</div>
            <h1 className="text-2xl font-black">
              {isEN ? "It is yours. Here is the book." : "Está feito. O livro é teu."}
            </h1>
            <p className="text-sm leading-relaxed text-zinc-400">
              {isEN
                ? "Open it from the button below and keep the link: it does not expire. A copy is on its way to your inbox as well, so you can find it later."
                : "Abre pelo botão aqui em baixo e guarda o link: não expira. Vai também uma cópia para o teu email, para o encontrares mais tarde."}
            </p>
            <Link
              href={href}
              className="block w-full rounded-2xl px-6 py-4 text-base font-bold text-black transition-all active:scale-95 hover:brightness-110"
              style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
            >
              {isEN ? "Read 90 Days →" : "Ler os 90 Dias →"}
            </Link>
            <p className="text-xs leading-relaxed text-zinc-600">
              {isEN
                ? "To keep it as a PDF: open it and use your browser's print option, then \"Save as PDF\"."
                : "Para guardares em PDF: abre o livro e usa a opção de imprimir do browser, depois \"Guardar como PDF\"."}
            </p>
            <div className="pt-4">
              <p className="text-xs text-zinc-600">
                {isEN ? "Any problem, write to " : "Qualquer problema, escreve para "}
                <a href="mailto:kravdoesntlift@gmail.com" className="underline hover:text-zinc-400">kravdoesntlift@gmail.com</a>
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="text-4xl">⏳</div>
            <h1 className="text-2xl font-black">
              {isEN ? "We could not confirm this payment" : "Não conseguimos confirmar este pagamento"}
            </h1>
            <p className="text-sm leading-relaxed text-zinc-400">
              {isEN
                ? "If you have just paid, the confirmation email with your link is on its way. If nothing arrives in a few minutes, write to me and I will sort it out by hand."
                : "Se acabaste de pagar, o email com o teu link está a caminho. Se não chegar nos próximos minutos, escreve-me e resolvo à mão."}
            </p>
            <a
              href="mailto:kravdoesntlift@gmail.com"
              className="inline-block rounded-2xl px-6 py-3 text-sm font-bold text-black"
              style={{ background: "linear-gradient(135deg,#E8C96B,#A8893A)" }}
            >
              kravdoesntlift@gmail.com
            </a>
            <div>
              <Link href={isEN ? "/ebook?lang=en" : "/ebook"} className="text-xs text-zinc-600 underline hover:text-zinc-400">
                {isEN ? "Back to the book" : "Voltar ao livro"}
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
