import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";
import { sendInvoiceEmail, sendPaymentFailedEmail, sendSubscriptionCancelledEmail } from "@/lib/email";
import { syncSubscription, getStripe as getStripeClient } from "@/lib/billing/sync";
import Stripe from "stripe";

export const runtime = "nodejs";
export const preferredRegion = "auto";
export const dynamic = "force-dynamic";

function getStripe(): Stripe {
  const stripe = getStripeClient();
  if (!stripe) throw new Error("STRIPE_SECRET_KEY not configured");
  return stripe;
}

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Resolve the KRAV client behind a Stripe object without trusting metadata.
 *
 * Metadata is only present on checkouts our own app created. Payments made from
 * a reused payment link, the Stripe dashboard, or an older checkout carry none -
 * and the old code bailed out entirely in that case, leaving the client
 * unprovisioned. Falls back to the customer mapping, then the customer's email.
 */
async function resolveClientId(
  admin: Admin,
  opts: { metadataClientId?: string | null; customerId?: string | null },
): Promise<string | null> {
  const { metadataClientId, customerId } = opts;

  if (metadataClientId) return metadataClientId;
  if (!customerId) return null;

  // 1. Customer already mapped to a profile
  const { data: byCustomer } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (byCustomer?.id) return byCustomer.id;

  // 2. Ask Stripe: the customer may carry our metadata, or match a user by email
  try {
    const stripe = getStripe();
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;

    const metaId = customer.metadata?.client_id;
    if (metaId) {
      await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", metaId);
      return metaId;
    }

    if (customer.email) {
      const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const match = users?.users.find(
        (u) => u.email?.toLowerCase() === customer.email!.toLowerCase(),
      );
      if (match) {
        await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", match.id);
        return match.id;
      }
    }
  } catch (e) {
    console.error("[webhook] resolveClientId lookup failed:", e);
  }

  return null;
}

/** Resolve the coach: metadata → existing assignment → the single coach on the platform. */
async function resolveCoachId(
  admin: Admin,
  opts: { metadataCoachId?: string | null; clientId: string },
): Promise<string | null> {
  if (opts.metadataCoachId) return opts.metadataCoachId;

  const { data: link } = await admin
    .from("coach_clients")
    .select("coach_id")
    .eq("client_id", opts.clientId)
    .maybeSingle();
  if (link?.coach_id) return link.coach_id;

  const { data: coach } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "coach")
    .limit(1)
    .maybeSingle();
  return coach?.id ?? null;
}

/**
 * Provision a paying client: subscription row, profile state, coach assignment.
 *
 * This is the critical path: it must always run to completion. Callers keep
 * notifications out of here so a push/email failure can never leave the client
 * unprovisioned. The write itself lives in @/lib/billing/sync so the webhook,
 * the nightly reconcile and the post-checkout page cannot drift apart.
 */
async function provisionSubscription(
  admin: Admin,
  args: {
    subscription: Stripe.Subscription;
    clientId: string;
    coachId: string | null;
  },
): Promise<void> {
  await syncSubscription(admin, args);
}

/** Welcome message + push. Never throws: notifications must not block provisioning. */
async function notifyNewSubscriber(
  admin: Admin,
  args: { clientId: string; coachId: string | null },
): Promise<void> {
  try {
    const { clientId, coachId } = args;

    const [{ data: coachProfileData }, { data: clientProfileData }] = await Promise.all([
      coachId
        ? admin.from("profiles").select("full_name").eq("id", coachId).maybeSingle()
        : Promise.resolve({ data: null }),
      admin.from("profiles").select("full_name, lang").eq("id", clientId).maybeSingle(),
    ]);

    const coachFirst = (coachProfileData?.full_name ?? "").split(" ")[0] || "Coach";
    const isEN = (clientProfileData as { lang?: string } | null)?.lang === "en";
    const clientFirst =
      (clientProfileData?.full_name ?? "").split(" ")[0] || (isEN ? "athlete" : "atleta");

    if (coachId) {
      const { data: existingMsg } = await admin
        .from("messages")
        .select("id")
        .eq("sender_id", coachId)
        .eq("receiver_id", clientId)
        .limit(1)
        .maybeSingle();

      if (!existingMsg) {
        await admin.from("messages").insert({
          sender_id: coachId,
          receiver_id: clientId,
          content: isEN
            ? `Hi ${clientFirst}! 👋 I'm ${coachFirst}, your KRAV coach. Your payment has been confirmed and you now have full access to the app. Let's start this journey together! 💪`
            : `Olá ${clientFirst}! 👋 Sou o ${coachFirst}, o teu coach na KRAV. O teu pagamento foi confirmado e já tens acesso total à app. Vamos começar esta jornada juntos! 💪`,
        });
      }

      await sendPushToUser(
        coachId,
        "💳 Novo pagamento recebido!",
        `${clientFirst} subscreveu o teu programa.`,
        `/coach/clients/${clientId}`,
      ).catch((e: unknown) => console.error("[webhook] coach push failed:", e));
    }

    await sendPushToUser(
      clientId,
      isEN ? "✅ Payment confirmed!" : "✅ Pagamento confirmado!",
      isEN
        ? "Welcome to KRAV! Your coach will reach out to you soon."
        : "Bem-vindo à KRAV! O teu coach vai contactar-te em breve.",
      "/client/dashboard",
    ).catch((e: unknown) => console.error("[webhook] client push failed:", e));
  } catch (e) {
    console.error("[webhook] notifyNewSubscriber failed:", e);
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe não configurado." }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  const admin = createAdminClient();

  // Idempotency: skip events already processed (invoice.paid can fire multiple times)
  const { data: alreadyProcessed } = await admin
    .from("stripe_processed_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();
  if (alreadyProcessed) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.subscription) break;

        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

        const clientId = await resolveClientId(admin, {
          metadataClientId: session.metadata?.client_id,
          customerId,
        });
        if (!clientId) {
          console.error("[webhook] checkout.session.completed: could not resolve client", {
            session: session.id,
            customerId,
          });
          break;
        }

        const coachId = await resolveCoachId(admin, {
          metadataCoachId: session.metadata?.coach_id,
          clientId,
        });

        const stripe = getStripe();
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

        await provisionSubscription(admin, { subscription, clientId, coachId });
        await notifyNewSubscriber(admin, { clientId, coachId });

        break;
      }

      // A subscription can appear without ever passing through our checkout
      // (dashboard-created, payment link, migrated). Treat both the same way.
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id ?? null;

        // Prefer the mapping we already have; fall back to full resolution
        const { data: existingSub } = await admin
          .from("stripe_subscriptions")
          .select("client_id")
          .eq("id", subscription.id)
          .maybeSingle();

        const clientId =
          existingSub?.client_id ??
          (await resolveClientId(admin, {
            metadataClientId: subscription.metadata?.client_id,
            customerId,
          }));

        if (!clientId) {
          console.error("[webhook] subscription event: could not resolve client", {
            subscription: subscription.id,
            customerId,
          });
          break;
        }

        const coachId = await resolveCoachId(admin, {
          metadataCoachId: subscription.metadata?.coach_id,
          clientId,
        });

        await provisionSubscription(admin, { subscription, clientId, coachId });

        // First time we've seen this subscription → it's a new subscriber
        if (!existingSub && (subscription.status === "active" || subscription.status === "trialing")) {
          await notifyNewSubscriber(admin, { clientId, coachId });
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const { data: sub } = await admin
          .from("stripe_subscriptions")
          .select("client_id")
          .eq("id", subscription.id)
          .maybeSingle();

        await admin
          .from("stripe_subscriptions")
          .update({ status: "cancelled" })
          .eq("id", subscription.id);

        if (sub?.client_id) {
          const clientId = sub.client_id;

          // Update profile status so layout blocks access
          await admin.from("profiles").update({ status: "cancelled" }).eq("id", clientId);

          // Notify client via push + email
          const [{ data: prof }, { data: authUser }] = await Promise.all([
            admin.from("profiles").select("full_name, lang").eq("id", clientId).single(),
            admin.auth.admin.getUserById(clientId),
          ]);
          const email = authUser?.user?.email;
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kravcoaching.com";
          const cLang: "pt" | "en" = prof?.lang === "en" ? "en" : "pt";

          await Promise.allSettled([
            sendPushToUser(
              clientId,
              cLang === "en" ? "⚠️ Subscription cancelled" : "⚠️ Subscrição cancelada",
              cLang === "en" ? "Your access has been suspended. Open the app to reactivate." : "O teu acesso foi suspenso. Abre a app para reactivar.",
              "/client/dashboard",
            ),
            email && sendSubscriptionCancelledEmail({
              to: email,
              clientName: prof?.full_name ?? "",
              siteUrl,
              lang: cLang,
            }),
          ]);
        }

        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string"
          ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;

        const invoiceClientId = await resolveClientId(admin, { customerId });
        if (!invoiceClientId) break;

        const invSubRef = invoice.parent?.subscription_details?.subscription;
        const invSubId = typeof invSubRef === "string" ? invSubRef : invSubRef?.id ?? null;

        // A renewal *is* an invoice being paid. Advancing the period only on
        // `customer.subscription.updated` made every renewal depend on that one
        // event type being enabled on the Stripe endpoint; when it wasn't, a
        // client who had just been charged kept the old period end and showed
        // up as overdue until the nightly job caught it. Sync here too: both
        // events now independently do the right thing, and doing it twice is
        // harmless because the sync only writes on a real difference.
        if (invSubId) {
          try {
            const subscription = await getStripe().subscriptions.retrieve(invSubId);
            const coachId = await resolveCoachId(admin, {
              metadataCoachId: subscription.metadata?.coach_id,
              clientId: invoiceClientId,
            });
            await syncSubscription(admin, { subscription, clientId: invoiceClientId, coachId });
          } catch (e) {
            console.error("[webhook] invoice.paid subscription sync failed:", e);
          }
        }

        const { data: profile } = await admin
          .from("profiles")
          .select("id, full_name, lang")
          .eq("id", invoiceClientId)
          .maybeSingle();
        if (!profile) break;

        const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
        const email = authUser?.user?.email;
        if (!email) break;

        const invoiceLang: "pt" | "en" = profile.lang === "en" ? "en" : "pt";
        const amountCents = invoice.amount_paid ?? 0;
        const amountEur = `€ ${(amountCents / 100).toFixed(2).replace(".", ",")}`;

        // Read back the period the sync above just wrote, so the receipt quotes
        // the *next* renewal rather than the one that was already paid.
        let nextRenewal = "";
        if (invSubId) {
          const { data: sub } = await admin
            .from("stripe_subscriptions")
            .select("current_period_end")
            .eq("id", invSubId)
            .maybeSingle();
          if (sub?.current_period_end) {
            nextRenewal = new Date(sub.current_period_end).toLocaleDateString(
              invoiceLang === "en" ? "en-GB" : "pt-PT",
              { day: "numeric", month: "long", year: "numeric" },
            );
          }
        }

        const invoiceNumber = invoice.number ?? invoice.id.slice(-8).toUpperCase();

        await sendInvoiceEmail({
          to: email,
          clientName: (profile.full_name ?? "").split(" ")[0] || "Client",
          amountEur,
          periodEnd: nextRenewal,
          invoiceNumber,
          lang: invoiceLang,
        }).catch((e: unknown) => console.error("[webhook] invoice email failed:", e));

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subRef = invoice.parent?.subscription_details?.subscription;
        const subscriptionId = typeof subRef === "string" ? subRef : subRef?.id ?? null;

        if (subscriptionId) {
          await admin
            .from("stripe_subscriptions")
            .update({ status: "past_due" })
            .eq("id", subscriptionId);
        }

        // Send failure email
        const customerId = typeof invoice.customer === "string"
          ? invoice.customer : invoice.customer?.id;
        if (customerId) {
          const failClientId = await resolveClientId(admin, { customerId });
          const { data: profile } = failClientId
            ? await admin
                .from("profiles")
                .select("id, full_name, lang")
                .eq("id", failClientId)
                .maybeSingle()
            : { data: null };
          if (profile) {
            const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
            const email = authUser?.user?.email;
            const failLang: "pt" | "en" = profile.lang === "en" ? "en" : "pt";
            const amountCents = invoice.amount_due ?? 0;
            const amountEur = `€ ${(amountCents / 100).toFixed(2).replace(".", ",")}`;

            await Promise.allSettled([
              // Lock the account so the app reflects payment failure immediately
              admin.from("profiles").update({ status: "past_due" }).eq("id", profile.id),
              email && sendPaymentFailedEmail({
                to: email,
                clientName: (profile.full_name ?? "").split(" ")[0] || "Client",
                amountEur,
                lang: failLang,
              }),
              sendPushToUser(
                profile.id,
                failLang === "en" ? "❌ Payment failed" : "❌ Pagamento falhado",
                failLang === "en"
                  ? `Could not charge ${amountEur}. Update your card.`
                  : `Não foi possível cobrar ${amountEur}. Actualiza o teu cartão.`,
                "/client/profile",
              ),
            ]);
          }
        }

        break;
      }

      default:
        break;
    }

    // Mark event as processed (idempotency guard)
    await admin
      .from("stripe_processed_events")
      .insert({ id: event.id })
      .throwOnError();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Handler error";
    console.error("Stripe webhook handler error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
