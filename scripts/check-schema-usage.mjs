#!/usr/bin/env node
/**
 * Compare every query in the app against the real database schema.
 *
 * TypeScript cannot catch this: `.eq("coach_id", id)` on a table with no
 * coach_id column, or an upsert whose ON CONFLICT names an index that does not
 * exist, both compile and both fail at runtime. When the calling code ignores
 * the error (as most of this app's did), the feature silently does nothing.
 *
 * That is how the workout logs were lost for two weeks, how the three buttons
 * on the leads page never worked, and how the analytics workout chart drew
 * zero for a year.
 *
 * Run: npm run check:schema
 *
 * What this does NOT cover: whether an ON CONFLICT target has a matching
 * unique index. The columns can all exist and the upsert still fail with
 * 42P10, which is exactly what happened to workout_logs. To check one, send a
 * probe upsert with every value set to a UUID that cannot exist, using the
 * service role:
 *
 *   await db.from("t").upsert({ ...ghostRow }, { onConflict: "a,b" })
 *   42P10 -> no such constraint.  23503/23502 -> the constraint is there.
 *
 * Pick a table whose foreign keys will reject the ghost row, so the probe can
 * never leave anything behind.
 */
import fs from "fs";
import path from "path";

const envFile = ".env.local";
if (!fs.existsSync(envFile)) {
  console.error("No .env.local: this needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(2);
}
const env = Object.fromEntries(
  fs.readFileSync(envFile, "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Missing Supabase credentials in .env.local"); process.exit(2); }

// PostgREST publishes the whole schema it serves, columns included.
const res = await fetch(`${url}/rest/v1/`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
if (!res.ok) { console.error("Could not read the schema:", res.status, await res.text()); process.exit(2); }
const spec = await res.json();
const schema = {};
for (const [name, def] of Object.entries(spec.definitions ?? {})) schema[name] = Object.keys(def.properties ?? {});

// Storage buckets are also reached through .from(), and are not tables.
const BUCKETS = new Set(["avatars", "progress-photos", "transformations"]);

function sourceFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(p, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(p);
  }
  return out;
}

const problems = [];

for (const file of sourceFiles("src")) {
  const src = fs.readFileSync(file, "utf8");
  const queries = [...src.matchAll(/\.from\(\s*["'`]([a-zA-Z_]+)["'`]\s*\)/g)];

  queries.forEach((match, i) => {
    const table = match[1];
    if (BUCKETS.has(table)) return;

    const columns = schema[table];
    if (!columns) {
      problems.push({ file, table, detail: "table is not in the database" });
      return;
    }

    // A chain runs until the next query starts or the statement ends, whichever
    // comes first. Without that bound, queries inside one Promise.all bleed
    // into each other and every reading is noise.
    const start = match.index + match[0].length;
    const nextQuery = queries[i + 1]?.index ?? src.length;
    const semicolon = src.indexOf(";", start);
    const chain = src.slice(start, Math.min(nextQuery, semicolon === -1 ? src.length : semicolon));

    const used = new Map();
    for (const f of chain.matchAll(/\.(eq|neq|gt|gte|lt|lte|like|ilike|in|is)\(\s*["'`]([a-zA-Z_]+)["'`]/g)) {
      used.set(f[2], `.${f[1]}()`);
    }
    for (const f of chain.matchAll(/onConflict:\s*["'`]([a-zA-Z_,\s]+)["'`]/g)) {
      for (const c of f[1].split(",")) used.set(c.trim(), "onConflict");
    }

    for (const [column, how] of used) {
      if (column && !columns.includes(column)) {
        problems.push({ file, table, detail: `${table}.${column} used in ${how}, but that column does not exist` });
      }
    }
  });
}

if (problems.length === 0) {
  console.log("Every filtered column and conflict target exists in the database.");
  process.exit(0);
}

console.log(`${problems.length} ${problems.length === 1 ? "problem" : "problems"}:\n`);
for (const p of problems) console.log(`  ${p.detail}\n    ${p.file}\n`);
console.log("An upsert naming a constraint that does not exist fails with 42P10;");
console.log("a filter on a missing column fails with 42703. Neither is a type error.");
process.exit(1);
