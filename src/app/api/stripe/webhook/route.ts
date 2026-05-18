import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";
import { sendInvoiceEmail, sendPaymentFailedEmail } from "@/lib/email";
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

          if (!existingMsg) {
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
            const coachPush = await sendPushToUser(
              coachId,
              "Novo cliente pagante!",
              `${clientFirst} subscreveu o teu programa.`,
              `/coach/clients/${clientId}`,
            ).catch((e: unknown) => ({ ok: false, error: String(e) }));
            if (!coachPush.ok) {
              console.error("[webhook] coach push failed:", coachPush.error);
            }

            // 4. Notify client
            const clientPush = await sendPushToUser(
              clientId,
              "Pagamento confirmado!",
              "Bem-vindo à KRAV! O teu coach vai contactar-te em breve.",
              "/client/dashboard",
            ).catch((e: unknown) => ({ ok: false, error: String(e) }));
            if (!clientPush.ok) {
              console.error("[webhook] client push failed:", clientPush.error);
            }
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

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string"
          ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;

        const { data: profile } = await admin
          .from("profiles")
          .select("id, full_name")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        if (!profile) break;

        const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
        const email = authUser?.user?.email;
        if (!email) break;

        const amountCents = invoice.amount_paid ?? 0;
        const amountEur = `€ ${(amountCents / 100).toFixed(2).replace(".", ",")}`;
        const subRef = invoice.parent?.subscription_details?.subscription;
        const subscriptionId = typeof subRef === "string" ? subRef : subRef?.id ?? null;
        const periodEnd = subscriptionId
          ? (() => {
              const { data: sub } = { data: null }; // will be fetched below via sync
              return "";
            })()
          : "";

        // Fetch period end from DB
        let nextRenewal = "";
        if (subscriptionId) {
          const { data: sub } = await admin
            .from("stripe_subscriptions")
            .select("current_period_end")
            .eq("id", subscriptionId)
            .maybeSingle();
          if (sub?.current_period_end) {
            nextRenewal = new Date(sub.current_period_end).toLocaleDateString("pt-PT", {
              day: "numeric", month: "long", year: "numeric",
            });
          }
        }

        const invoiceNumber = invoice.number ?? invoice.id.slice(-8).toUpperCase();

        await sendInvoiceEmail({
          to: email,
          clientName: (profile.full_name ?? "").split(" ")[0] || "Cliente",
          amountEur,
          periodEnd: nextRenewal,
          invoiceNumber,
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
            .select("id, full_name")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();
          if (profile) {
            const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
            const email = authUser?.user?.email;
            if (email) {
              const amountCents = invoice.amount_due ?? 0;
              await sendPaymentFailedEmail({
                to: email,
                clientName: (profile.full_name ?? "").split(" ")[0] || "Cliente",
                amountEur: `€ ${(amountCents / 100).toFixed(2).replace(".", ",")}`,
              }).catch((e: unknown) => console.error("[webhook] failure email failed:", e));
            }
          }
        }

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
