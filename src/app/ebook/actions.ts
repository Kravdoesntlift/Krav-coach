"use server";

import { redirect } from "next/navigation";
import { EBOOK } from "@/lib/ebook/content";

/**
 * Buying the book: one payment, no account, no trial.
 *
 * Deliberately the shortest path on the site. Somebody who came from a story
 * and decided to spend thirteen euros must not be asked to create a password
 * first: Stripe collects the email, the webhook sends the link, and the thank
 * you page shows it straight away in case the email is slow.
 */
export async function buyEbookAction(formData: FormData) {
  const lang = formData.get("lang") === "en" ? "en" : "pt";

  if (!process.env.STRIPE_SECRET_KEY) {
    redirect("https://instagram.com/kravdoesntlift");
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia" as "2026-04-22.dahlia",
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.kravcoaching.com";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    // Euros, everywhere. Stripe's adaptive pricing offers the local currency
    // to somebody browsing from abroad, and the conversion lands on us: the
    // coach travels, so this would have fired on his own tests first.
    adaptive_pricing: { enabled: false },
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "eur",
        product_data: {
          name: EBOOK.productName,
          description: lang === "en"
            ? "13 week training programme, PDF, delivered by email"
            : "Programa de treino de 13 semanas, PDF, entregue por email",
        },
        unit_amount: EBOOK.priceCents,
      },
      quantity: 1,
    }],
    // The webhook reads this to tell a book sale from a subscription, and to
    // know which language to write the delivery email in.
    metadata: { product: EBOOK.id, lang },
    payment_intent_data: { metadata: { product: EBOOK.id, lang } },
    // Stripe already asks for it, and it is where the book gets sent.
    customer_creation: "always",
    success_url: `${siteUrl}/ebook/obrigado?session_id={CHECKOUT_SESSION_ID}${lang === "en" ? "&lang=en" : ""}`,
    cancel_url: `${siteUrl}/ebook${lang === "en" ? "?lang=en" : ""}`,
  });

  redirect(session.url!);
}
