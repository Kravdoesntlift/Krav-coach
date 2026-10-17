/**
 * Reading an Instagram handle out of whatever somebody types in a form field.
 *
 * The book's checkout asks for it so that a buyer can be added to the close
 * friends list without being chased for a screenshot: the payment is the
 * proof. People type it every way there is, so this takes "@krav", "krav", a
 * profile URL with tracking junk on the end, and lands on the same answer.
 */

const HANDLE = /^[A-Za-z0-9._]{1,30}$/;

export function instagramHandle(input: string | null | undefined): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;

  let value = raw;

  // A pasted profile link, with or without the scheme and with or without
  // whatever share parameters the app appended.
  const url = /(?:^|\/\/|\.)instagram\.com\/([^/?#\s]+)/i.exec(value);
  if (url) value = url[1];

  value = value.replace(/^@+/, "").replace(/\/+$/, "");

  if (HANDLE.test(value)) return `@${value}`;

  // Not a handle. Keep what they wrote rather than dropping it, because a
  // name is still something the coach can search for, but keep it short.
  return raw.length > 40 ? `${raw.slice(0, 40)}…` : raw;
}
