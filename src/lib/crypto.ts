import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// ENCRYPTION_KEY must be 32 bytes encoded as 64 hex chars.
// Generate with: openssl rand -hex 32
function getKey(): Buffer | null {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) return null;
  try { return Buffer.from(hex, "hex"); } catch { return null; }
}

// Encrypts a plaintext string. Returns "enc:<base64>" or plaintext if no key.
export function encrypt(plaintext: string): string {
  const key = getKey();
  if (!key) return plaintext;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return "enc:" + Buffer.concat([iv, tag, encrypted]).toString("base64");
}

// Decrypts an "enc:<base64>" string. Falls back to returning the value as-is
// so existing plaintext tokens (before encryption was added) still work.
export function decrypt(value: string): string {
  if (!value.startsWith("enc:")) return value;
  const key = getKey();
  if (!key) return value.slice(4);
  try {
    const buf = Buffer.from(value.slice(4), "base64");
    const iv        = buf.subarray(0, 12);
    const tag       = buf.subarray(12, 28);
    const encrypted = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch {
    return value; // tampered or wrong key, caller should treat as invalid
  }
}
