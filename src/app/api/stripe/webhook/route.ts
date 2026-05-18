import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";
import Stripe from "stripe";

export const runtime = "nodejs";
export const preferredRegion = "auto";
export const dynamic = "force-dynamic";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-04-22.dahlia" as "2026-04-22.dahlia",
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

        // Self-service flow: assign client to coach, send welcome message & push notifications
        if (session.metadata?.self_service === "true") {
          // 1. Assign client to coach via coach_clients (insert, ignore if already exists)
          const { error: ccErr } = await admin.from("coach_clients")
            .insert({ coach_id: coachId, client_id: clientId, assigned_role: "coach" });
          if (ccErr && ccErr.code !== "23505") {
            console.error("[webhook] coach_clients insert error:", ccErr);
          }

          // 2. Welcome message in chat
          const [{ data: coachProfileData }, { data: clientProfileData }] = await Promise.all([
            admin.from("profiles").select("full_name").eq("id", coachId).single(),
            admin.from("profiles").select("full_name").eq("id", clientId).single(),
          ]);
          const coachFirst =
            (coachProfileData?.full_name ?? "").split(" ")[0] || "Coach";
          const clientFirst =
            (clientProfileData?.full_name ?? "").split(" ")[0] || "atleta";

          await admin.from("messages").insert({
            sender_id: coachId,
            receiver_id: clientId,
            content: `Olá ${clientFirst}! 👋 Sou o ${coachFirst}, o teu coach na KRAV. O teu pagamento foi confirmado e já tens acesso total à app. Vamos começar esta jornada juntos! 💪`,
          });

          // 3. Notify coach of new paying client
          await sendPushToUser(
            coachId,
            "Novo cliente pagante!",
            `${clientFirst} subscreveu o teu programa.`,
            `/coach/clients/${clientId}`,
          ).catch(() => {});

          // 4. Notify client
          await sendPushToUser(
            clientId,
            "Pagamento confirmado!",
            "Bem-vindo à KRAV! O teu coach vai contactar-te em breve.",
            "/client/dashboard",
          ).catch(() => {});
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const item = subscription.items.data[0];
        const amountCents = item?.price?.unit_amount ?? null;
        const periodEndTs = item?.current_period_end ?? null;
        const periodEnd = periodEndTs ? new Date(periodEndTs * 1000).toISOString() : null;

        await admin
          .from("stripe_subscriptions")
          .update({
            status: subscription.status,
            amount_cents: amountCents,
            current_period_end: periodEnd,
          })
          .eq("id", subscription.id);

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
          await admin
            .from("profiles")
            .update({ status: "cancelled" })
            .eq("id", sub.client_id);
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        // In Stripe v22, subscription ID is under invoice.parent.subscription_details.subscription
        const subRef = invoice.parent?.subscription_details?.subscription;
        const subscriptionId = typeof subRef === "string" ? subRef : subRef?.id ?? null;

        if (!subscriptionId) break;

        await admin
          .from("stripe_subscriptions")
          .update({ status: "past_due" })
          .eq("id", subscriptionId);

        break;
      }

      default:
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Handler error";
    console.error("Stripe webhook handler error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
