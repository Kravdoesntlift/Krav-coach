import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { EBOOK } from "./content";

/**
 * Access links for the paid book: kravcoaching.com/ebook/ler?t=<token>
 *
 * The book is delivered by email the second Stripe confirms the payment, so
 * the link has to work without an account and without a row in any table:
 * there is no DDL from this repo and a purchase must never depend on a
 * migration somebody forgot to run.
 *
 * The token carries a random nonce and the day it was issued, signed. It holds
 * no email and no name, because this ends up in a URL, in an inbox, and in
 * whatever proxy sits in between. Each buyer gets a different link, and a link
 * cannot be guessed by trying.
 *
 * What it does not do is stop somebody who bought it from passing it on. That
 * is true of any PDF and the cure is worse than the disease.
 */

function secret(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "krav-dev-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(`ebook:${payload}`).digest("base64url").slice(0, 16);
}

const DAY_MS = 86_400_000;

export function ebookToken(product: string = EBOOK.id): string {
  const nonce = randomBytes(9).toString("base64url");
  const day = String(Math.floor(Date.now() / DAY_MS));
  return `${nonce}.${day}.${sign(`${product}:${nonce}:${day}`)}`;
}

export function ebookLink(lang: "pt" | "en", site = "https://www.kravcoaching.com"): string {
  const token = ebookToken();
  return `${site}/ebook/ler?t=${token}${lang === "en" ? "&lang=en" : ""}`;
}

/** True when the token was signed by us. Nothing else is claimed. */
export function readEbookToken(token: string | undefined | null, product: string = EBOOK.id): boolean {
  const parts = (token ?? "").split(".");
  if (parts.length !== 3) return false;
  const [nonce, day, signature] = parts;
  if (!/^[A-Za-z0-9_-]{8,24}$/.test(nonce) || !/^\d{4,7}$/.test(day)) return false;

  const expected = sign(`${product}:${nonce}:${day}`);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
