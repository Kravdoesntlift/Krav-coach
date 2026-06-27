import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";
import { sendInvoiceEmail, sendPaymentFailedEmail, sendSubscriptionCancelledEmail } from "@/lib/email";
import Stripe from "stripe";

export const runtime = "nodejs";
export const preferredRegion = "auto";
export const dynamic = "force-dynamic";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-04-22.dahlia" as "2026-04-22.dahlia",
    httpClient: Stripe.createFetchHttpClient(),
    maxNetworkRetries: 1,
  });
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
        const coachId = session.metadata?.coach_id;
        const clientId = session.metadata?.client_id;

        if (!coachId || !clientId || !session.subscription) break;

        const stripe = getStripe();
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        const item = subscription.items.data[0];
        const amountCents = item?.price?.unit_amount ?? null;
        // In Stripe v22, current_period_end moved from Subscription to SubscriptionItem
        const periodEndTs = item?.current_period_end ?? null;
        const periodEnd = periodEndTs ? new Date(periodEndTs * 1000).toISOString() : null;

        await admin.from("stripe_subscriptions").upsert({
          id: subscription.id,          // primary key = Stripe subscription ID
          client_id: clientId,
          coach_id: coachId,
          status: subscription.status,
          amount_cents: amountCents,
          current_period_end: periodEnd,
        }, { onConflict: "id" });

        await admin
          .from("profiles")
          .update({ status: "active" })
          .eq("id", clientId);

        // Self-service flow: ensure assignment + send welcome message & push notifications
        // We always run this when coach_id + client_id are in metadata (only set by our flow)
        {
          // 1. Ensure client is assigned to coach (upsert = safe to repeat)
          const { error: ccErr } = await admin.from("coach_clients").upsert(
            { coach_id: coachId, client_id: clientId, assigned_role: "coach" },
            { onConflict: "coach_id,client_id,assigned_role" }
          );
          if (ccErr) {
            console.error("[webhook] coach_clients upsert error:", ccErr);
          }

          // 2. Welcome message in chat (only if no message exists yet)
          const { data: existingMsg } = await admin
            .from("messages")
            .select("id")
            .eq("sender_id", coachId)
            .eq("receiver_id", clientId)
            .limit(1)
            .maybeSingle();

          const [{ data: coachProfileData }, { data: clientProfileData }] = await Promise.all([
            admin.from("profiles").select("full_name").eq("id", coachId).single(),
            admin.from("profiles").select("full_name, lang").eq("id", clientId).single(),
          ]);
          const coachFirst = (coachProfileData?.full_name ?? "").split(" ")[0] || "Coach";
          const isEN = (clientProfileData as { lang?: string } | null)?.lang === "en";
          const clientFirst = (clientProfileData?.full_name ?? "").split(" ")[0] || (isEN ? "athlete" : "atleta");

          // Welcome message — only if no prior message exists
          if (!existingMsg) {
            await admin.from("messages").insert({
              sender_id: coachId,
              receiver_id: clientId,
              content: isEN
                ? `Hi ${clientFirst}! 👋 I'm ${coachFirst}, your KRAV coach. Your payment has been confirmed and you now have full access to the app. Let's start this journey together! 💪`
                : `Olá ${clientFirst}! 👋 Sou o ${coachFirst}, o teu coach na KRAV. O teu pagamento foi confirmado e já tens acesso total à app. Vamos começar esta jornada juntos! 💪`,
            });
          }

          // Notify coach — always, regardless of prior messages
          const coachPush = await sendPushToUser(
            coachId,
            "💳 Novo pagamento recebido!",
            `${clientFirst} subscreveu o teu programa.`,
            `/coach/clients/${clientId}`,
          ).catch((e: unknown) => ({ ok: false, error: String(e) }));
          if (!coachPush.ok) {
            console.error("[webhook] coach push failed:", coachPush.error);
          }

          // Notify client — always
          const clientPush = await sendPushToUser(
            clientId,
            isEN ? "✅ Payment confirmed!" : "✅ Pagamento confirmado!",
            isEN
              ? "Welcome to KRAV! Your coach will reach out to you soon."
              : "Bem-vindo à KRAV! O teu coach vai contactar-te em breve.",
            "/client/dashboard",
          ).catch((e: unknown) => ({ ok: false, error: String(e) }));
          if (!clientPush.ok) {
            console.error("[webhook] client push failed:", clientPush.error);
          }
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const item = subscription.items.data[0];
        const amountCents = item?.price?.unit_amount ?? null;
        const periodEndTs = item?.current_period_end ?? null;
        const periodEnd = periodEndTs ? new Date(periodEndTs * 1000).toISOString() : null;

        // Fetch client_id before updating (client_id never changes — just need the value)
        const { data: existingSub } = await admin
          .from("stripe_subscriptions")
          .select("client_id")
          .eq("id", subscription.id)
          .maybeSingle();

        await admin
          .from("stripe_subscriptions")
          .update({
            status: subscription.status,
            amount_cents: amountCents,
            current_period_end: periodEnd,
          })
          .eq("id", subscription.id);

        // Sync profiles.status so middleware + app reflect the real subscription state
        if (existingSub?.client_id) {
          const profileStatus =
            subscription.status === "active"   ? "active"   :
            subscription.status === "trialing" ? "trialing" :
            subscription.status === "past_due" ? "past_due" :
            subscription.status === "unpaid"   ? "past_due" :
            null;
          if (profileStatus) {
            await admin.from("profiles")
              .update({ status: profileStatus })
              .eq("id", existingSub.client_id);
          }
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

        const { data: profile } = await admin
          .from("profiles")
          .select("id, full_name, lang")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        if (!profile) break;

        const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
        const email = authUser?.user?.email;
        if (!email) break;

        const invoiceLang: "pt" | "en" = profile.lang === "en" ? "en" : "pt";
        const amountCents = invoice.amount_paid ?? 0;
        const amountEur = `€ ${(amountCents / 100).toFixed(2).replace(".", ",")}`;
        const subRef = invoice.parent?.subscription_details?.subscription;
        const subscriptionId = typeof subRef === "string" ? subRef : subRef?.id ?? null;

        // Fetch period end from DB
        let nextRenewal = "";
        if (subscriptionId) {
          const { data: sub } = await admin
            .from("stripe_subscriptions")
            .select("current_period_end")
            .eq("id", subscriptionId)
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
          const { data: profile } = await admin
            .from("profiles")
            .select("id, full_name, lang")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();
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
