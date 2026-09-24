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

function sign(clientId: string): string {
  return createHmac("sha256", secret()).update(`pay:${clientId}`).digest("base64url").slice(0, 12);
}

/** "AbCd...".  Around 35 characters, against Stripe's 400. */
export function payTokenFor(clientId: string): string {
  const compact = Buffer.from(clientId.replace(/-/g, ""), "hex").toString("base64url");
  return `${compact}.${sign(clientId)}`;
}

export function payLinkFor(clientId: string, site = "https://www.kravcoaching.com"): string {
  return `${site}/pagar/${payTokenFor(clientId)}`;
}

/** The client id inside a token, or null when the signature does not hold. */
export function clientIdFromPayToken(token: string): string | null {
  const [compact, signature] = (token ?? "").split(".");
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

  const expected = sign(clientId);
  if (expected.length !== signature.length) return null;
  // Constant time: this is a signature check, however small the stakes.
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;

  return clientId;
}
