import { createHmac, timingSafeEqual } from "crypto";

/**
 * Short, signed payment links: kravcoaching.com/pagar/<token>
 *
 * Sending a raw Stripe Checkout URL by message means sending four lines of
 * random characters from a domain the client has never heard of, which is
 * exactly what a scam looks like. This is short, on our own domain, and it
 * builds the Stripe session when the link is opened, so it can never be the
 * expired session from a message sent last week.
 *
 * The token is the client id plus a signature, so the link cannot be guessed
 * by walking through ids, and nothing has to be stored to make it work.
 */

function secret(): string {
  // Server only, and always present: the same key the admin client uses.
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "krav-dev-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(`pay:${payload}`).digest("base64url").slice(0, 12);
}

/**
 * The monthly price is part of the link, and part of what is signed, so the
 * coach can send a different amount without anyone being able to edit it on
 * the way. Left out, the link means the standard price.
 */
export const DEFAULT_AMOUNT_CENTS = 12700;

/** "AbCd...", around 35 characters, against Stripe's 400. */
export function payTokenFor(clientId: string, amountCents?: number): string {
  const compact = Buffer.from(clientId.replace(/-/g, ""), "hex").toString("base64url");
  if (!amountCents || amountCents === DEFAULT_AMOUNT_CENTS) {
    return `${compact}.${sign(clientId)}`;
  }
  const amount = String(amountCents);
  return `${compact}.${amount}.${sign(`${clientId}:${amount}`)}`;
}

export function payLinkFor(
  clientId: string,
  options: { amountCents?: number; site?: string } = {},
): string {
  const site = options.site ?? "https://www.kravcoaching.com";
  return `${site}/pagar/${payTokenFor(clientId, options.amountCents)}`;
}

export interface PayTokenContents {
  clientId: string;
  amountCents: number;
}

/** What a token says, or null when the signature does not hold. */
export function readPayToken(token: string): PayTokenContents | null {
  const parts = (token ?? "").split(".");
  if (parts.length !== 2 && parts.length !== 3) return null;

  const compact = parts[0];
  const amountPart = parts.length === 3 ? parts[1] : null;
  const signature = parts[parts.length - 1];
  if (!compact || !signature) return null;

  let hex: string;
  try {
    hex = Buffer.from(compact, "base64url").toString("hex");
  } catch {
    return null;
  }
  if (hex.length !== 32) return null;

  const clientId = [
    hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20),
  ].join("-");

  let amountCents = DEFAULT_AMOUNT_CENTS;
  let payload = clientId;
  if (amountPart !== null) {
    if (!/^\d{2,7}$/.test(amountPart)) return null;
    amountCents = Number(amountPart);
    payload = `${clientId}:${amountPart}`;
  }

  const expected = sign(payload);
  if (expected.length !== signature.length) return null;
  // Constant time: this is a signature check, however small the stakes.
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;

  return { clientId, amountCents };
}

/** Kept for callers that only need the client. */
export function clientIdFromPayToken(token: string): string | null {
  return readPayToken(token)?.clientId ?? null;
}
