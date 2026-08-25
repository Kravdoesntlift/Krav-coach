import { createAdminClient } from "@/lib/supabase/admin";

export const PROGRESS_PHOTOS_BUCKET = "progress-photos";

/**
 * Progress photos are intimate. The bucket is private, so a stored reference is
 * useless on its own and every read has to be signed for a caller the server has
 * already authorised.
 *
 * Rows written before this change hold a full public URL; newer ones hold the
 * object path. Both reduce to the same path here so nothing needed migrating.
 */
export function toStoragePath(photoUrlOrPath: string): string | null {
  if (!photoUrlOrPath) return null;
  const marker = `/${PROGRESS_PHOTOS_BUCKET}/`;
  const idx = photoUrlOrPath.indexOf(marker);
  const path = idx >= 0 ? photoUrlOrPath.slice(idx + marker.length) : photoUrlOrPath;
  // Strip any query string left over from a previously signed URL.
  const clean = path.split("?")[0].replace(/^\/+/, "");
  return clean || null;
}

/** Default lifetime for a link rendered into a page the user is looking at now. */
export const SIGNED_URL_TTL = 60 * 60; // 1 hour

/**
 * Replace stored references with short-lived signed URLs.
 *
 * Call this on the server, only after establishing that the caller may see these
 * photos. Anything that cannot be signed comes back as null rather than falling
 * back to a public URL — a broken image is the correct outcome for a photo we
 * could not authorise.
 */
export async function signPhotoUrls<T extends { photo_url: string }>(
  rows: T[],
  expiresIn: number = SIGNED_URL_TTL,
): Promise<(T & { photo_url: string | null })[]> {
  if (rows.length === 0) return [];

  const admin = createAdminClient();
  const paths = rows.map((r) => toStoragePath(r.photo_url));
  const wanted = paths.filter((p): p is string => p !== null);
  if (wanted.length === 0) return rows.map((r) => ({ ...r, photo_url: null }));

  const { data, error } = await admin.storage
    .from(PROGRESS_PHOTOS_BUCKET)
    .createSignedUrls(wanted, expiresIn);

  if (error) {
    console.error("[storage] could not sign progress photos:", error.message);
    return rows.map((r) => ({ ...r, photo_url: null }));
  }

  const byPath = new Map<string, string>();
  data?.forEach((d) => {
    if (d.path && d.signedUrl) byPath.set(d.path, d.signedUrl);
  });

  return rows.map((r, i) => {
    const p = paths[i];
    return { ...r, photo_url: p ? byPath.get(p) ?? null : null };
  });
}
