import type Stripe from "stripe";
import { EBOOK_PRICE_CENTS } from "@/lib/ebook/price";

/**
 * The credit a book buyer gets towards their first month.
 *
 * Somebody who paid fifteen euros for the programme and then subscribes would
 * otherwise be paying twice for the same thing, and that is exactly the person
 * most likely to subscribe. The credit removes that objection.
 *
 * It is a code generated per purchase, redeemable once, not a public code
 * printed in a book: a shared code would be worth fifteen euros to anybody who
 * found it, and the whole point is that only a real buyer can use it. Nothing
 * has to be stored on our side, because Stripe already refuses a code that has
 * been used.
 *
 * It applies once, to the first invoice. A client who pays 127 pays 112 the
 * first month and 127 after that: it is a refund of the book, not a discount
 * on the subscription.
 */

const COUPON_ID = "livro-90-dias-credito";

async function ensureCoupon(stripe: Stripe): Promise<string> {
  try {
    const existing = await stripe.coupons.retrieve(COUPON_ID);
    if (existing && !existing.deleted) return existing.id;
  } catch {
    // Not there yet: fall through and create it.
  }
  const created = await stripe.coupons.create({
    id: COUPON_ID,
    amount_off: EBOOK_PRICE_CENTS,
    currency: "eur",
    duration: "once",
    name: "Crédito do livro 90 Dias",
  });
  return created.id;
}

function randomCode(): string {
  // No ambiguous characters: this gets read off a phone screen and retyped.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `LIVRO-${out}`;
}

/**
 * A code only this buyer can use. Returns null when anything goes wrong: the
 * book has already been delivered by the time this runs, and a missing credit
 * is a conversation, while a failed delivery is a refund.
 */
export async function createBookCredit(
  stripe: Stripe,
  metadata: Record<string, string>,
): Promise<string | null> {
  try {
    const coupon = await ensureCoupon(stripe);
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = randomCode();
      try {
        const promo = await stripe.promotionCodes.create({
          // This Stripe version takes the coupon wrapped in a promotion.
          promotion: { type: "coupon", coupon },
          code,
          max_redemptions: 1,
          metadata,
        });
        return promo.code;
      } catch (e) {
        // Codes are unique per account: on the rare collision, try again.
        const message = e instanceof Error ? e.message : "";
        if (!message.includes("already exists")) throw e;
      }
    }
    return null;
  } catch (e) {
    console.error("[book-credit] could not create the code:", e);
    return null;
  }
}
