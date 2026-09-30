/**
 * The book's price, on its own so a client page can show it without pulling
 * the whole training generator into the browser bundle.
 */
export const EBOOK_PRICE_CENTS = 1500;

/** "15", or "15,50" if the price ever stops being round. */
export function ebookPrice(lang: "pt" | "en" = "pt"): string {
  const euros = EBOOK_PRICE_CENTS / 100;
  if (Number.isInteger(euros)) return String(euros);
  return euros.toFixed(2).replace(".", lang === "en" ? "." : ",");
}
