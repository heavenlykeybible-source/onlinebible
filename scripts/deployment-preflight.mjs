import { readFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {validateRootMigrationHistory} from "./root-migration-history.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const allowPlaceholders = process.argv.includes("--allow-placeholders");
const targetEnv = process.env.DEPLOY_ENV || "production";
const fail = [];
const warn = [];

const wrangler = await readFile(join(root, "wrangler.toml"), "utf8");
const requiredProductionBindings = [
  "DB", "SESSIONS_KV", "RATE_LIMIT_KV", "LIVE_STATUS_KV", "MEDIA_R2"
];
const requiredStagingBindings = [
  "DB", "SESSIONS_KV", "RATE_LIMIT_KV", "LIVE_STATUS_KV", "MEDIA_R2"
];
const requiredSecrets = [
  "SESSION_SECRET", "PASSWORD_PEPPER", "ENCRYPTION_KEY", "MEDIA_ENGINE_SHARED_SECRET"
];

for (const binding of requiredProductionBindings) {
  if (!wrangler.includes(`binding = "${binding}"`)) fail.push(`Missing production binding: ${binding}`);
}
for (const binding of requiredStagingBindings) {
  if (!wrangler.includes(`binding = "${binding}"`)) fail.push(`Missing staging binding: ${binding}`);
}
for (const secret of requiredSecrets) {
  if (!wrangler.includes(`"${secret}"`)) warn.push(`Note: secret '${secret}' is not declared in wrangler.toml — ensure it's set via 'wrangler secret put' for the target environment.`);
}

if (!allowPlaceholders) {
  if (targetEnv === "staging") {
    if (/REPLACE_WITH_MEDIA_ENGINE_STAGING_HOST/.test(wrangler)) {
      fail.push("MEDIA_ENGINE_URL is still a staging placeholder.");
    }
  } else {
    if (/REPLACE_WITH_MEDIA_ENGINE_HOST/.test(wrangler)) {
      fail.push("MEDIA_ENGINE_URL is still a production placeholder.");
    }
  }
}

const placeholders = [...wrangler.matchAll(/REPLACE_WITH_REAL_[A-Z0-9_]+/g)].map(m => m[0]);
if (placeholders.length && !allowPlaceholders) {
  fail.push(`Cloudflare resource IDs are still placeholders (${new Set(placeholders).size}). Replace them before deployment.`);
} else if (placeholders.length) {
  warn.push(`Placeholder Cloudflare IDs allowed for local validation: ${new Set(placeholders).size}.`);
}

const rootHistory=await validateRootMigrationHistory(root);
const migrations=rootHistory.files;
fail.push(...rootHistory.failures);

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (entry.name.endsWith(".ts")) {
      const text = await readFile(file, "utf8");
      if (/\b(TODO|FIXME)\b/i.test(text)) fail.push(`TODO/FIXME marker in ${file.replace(root + "/", "")}`);
      if (/console\.log\(/.test(text)) warn.push(`console.log present in ${file.replace(root + "/", "")}`);
    }
  }
}
await walk(join(root, "src"));

const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
if (!packageJson.scripts?.preflight) fail.push("Missing preflight npm script.");
if (!packageJson.scripts?.deploy) fail.push("Missing deploy npm script.");

if (fail.length) {
  console.error("PREFLIGHT FAILED");
  for (const x of fail) console.error("- " + x);
  for (const x of warn) console.error("WARN - " + x);
  process.exit(1);
}
console.log(`PREFLIGHT PASSED — ${migrations.length} migrations, required bindings present (target: ${targetEnv}).`);
for (const x of warn) console.log("WARN - " + x);
