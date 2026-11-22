#!/usr/bin/env bash
#
# Reprints the five preview pages shown on /ebook.
#
# The pages on the sales page are photographs of the real book, which is the
# whole reason they are worth showing: what the buyer sees is what arrives.
# That also means they go stale the moment a chapter is rewritten. This script
# is the one command that brings them back in line, so nobody has to remember
# a pipeline of four tools.
#
#   ./scripts/ebook-previa.sh                 # prints from production
#   ./scripts/ebook-previa.sh http://localhost:3000
#
# It needs SUPABASE_SERVICE_ROLE_KEY in .env.local (the reader's links are
# signed with it), Chrome, poppler's pdftoppm and ImageMagick:
#
#   brew install poppler imagemagick
#
# The page numbers below are positions in the printed book, picked because each
# one proves something different: the full contents, the technique, a written
# week, the log sheet, the home version. Change the order here and the captions
# in src/app/ebook/page.tsx have to move with it.
set -euo pipefail

PAGES=(1 6 8 7 15)
# Pinned, because src/app/ebook/page.tsx declares the box: a reprint that came
# back one pixel taller would quietly change the aspect ratio Next reserves.
WIDTH=900
HEIGHT=1273
QUALITY=82

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE="${1:-https://www.kravcoaching.com}"
OUT="$ROOT/public/ebook/previa"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
for need in pdftoppm magick node; do
  command -v "$need" >/dev/null || { echo "falta $need"; exit 1; }
done
[ -x "$CHROME" ] || { echo "Chrome nao encontrado em $CHROME (define CHROME=...)"; exit 1; }

echo "a assinar um link de leitura"
TOKEN="$(node --input-type=module -e '
import crypto from "node:crypto"; import fs from "node:fs";
const env = Object.fromEntries(
  fs.readFileSync(process.argv[1] + "/.env.local", "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["\x27]|["\x27]$/g, "")]; }),
);
const secret = env.SUPABASE_SERVICE_ROLE_KEY;
if (!secret) { console.error("SUPABASE_SERVICE_ROLE_KEY em falta no .env.local"); process.exit(1); }
const sign = (p) => crypto.createHmac("sha256", secret).update(`ebook:${p}`).digest("base64url").slice(0, 16);
const nonce = crypto.randomBytes(9).toString("base64url");
const day = String(Math.floor(Date.now() / 86400000));
process.stdout.write(`${nonce}.${day}.${sign(`90-dias:${nonce}:${day}`)}`);
' "$ROOT")"

echo "a imprimir o livro de $SITE"
"$CHROME" --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$WORK/livro.pdf" \
  "$SITE/ebook/ler?t=$TOKEN" >/dev/null 2>&1

[ -s "$WORK/livro.pdf" ] || { echo "a impressao saiu vazia: o token foi recusado?"; exit 1; }
TOTAL="$(pdftoppm -h 2>/dev/null >/dev/null; node -e 'const fs=require("fs");const b=fs.readFileSync(process.argv[1]).toString("latin1");console.log((b.match(/\/Type\s*\/Page[^s]/g)||[]).length)' "$WORK/livro.pdf")"
echo "paginas impressas: $TOTAL"

mkdir -p "$OUT"
i=0
for p in "${PAGES[@]}"; do
  i=$((i + 1))
  pdftoppm -f "$p" -l "$p" -r 200 -jpeg -jpegopt quality=95 "$WORK/livro.pdf" "$WORK/raw-$i"
  src="$(ls "$WORK/raw-$i"-*.jpg 2>/dev/null | head -1)"
  [ -n "$src" ] || { echo "a pagina $p nao saiu: o livro tem $TOTAL paginas"; exit 1; }
  magick "$src" -resize "${WIDTH}x" -background "#0a0a0c" -gravity north \
    -extent "${WIDTH}x${HEIGHT}" -quality "$QUALITY" "$OUT/pagina-$i.webp"
  printf "  pagina-%s.webp  <- pagina %s do livro  %s\n" "$i" "$p" \
    "$(magick identify -format '%wx%h %b' "$OUT/pagina-$i.webp")"
done

echo
echo "feito. confirma em /ebook antes de dar commit."
