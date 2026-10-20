import { readFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const failures = [];

const proxy = await readFile(join(root, "src/services/integrations/media-engine-proxy.ts"), "utf8");
if (!proxy.includes("actor.roleName")) failures.push("Media Engine proxy must propagate actor.roleName.");
if (proxy.includes("actor.level as 'Administrator'")) failures.push("Media Engine proxy must never cast numeric role level to role name.");

const mediaIndex = await readFile(join(root, "media-engine/src/index.ts"), "utf8");
if (/catch\s*\{\s*\}/.test(mediaIndex)) {
  failures.push("Media Engine must not silently swallow storage/deletion failures.");
}

const rootMigrations = (await readdir(join(root, "migrations")))
  .filter((f) => /^\d{4}_.+\.sql$/.test(f))
  .sort();
if (rootMigrations.length !== 40 || !rootMigrations.at(-1)?.startsWith("0040_")) {
  failures.push("Root migration tip must be 0040 with exactly 40 numbered migrations.");
}

const mediaMigrations = (await readdir(join(root, "media-engine/migrations")))
  .filter((f) => /^\d{4}_.+\.sql$/.test(f))
  .sort();
if (mediaMigrations.length !== 5 || !mediaMigrations.at(-1)?.startsWith("0005_")) {
  failures.push("Media Engine migration tip must be 0005 with exactly 5 numbered migrations.");
}

async function checkMigrationSequence(directory, expectedCount, expectedTip, label) {
  const files = (await readdir(join(root, directory)))
    .filter((f) => /^\d{4}_.+\.sql$/.test(f))
    .sort();
  const nums = files.map((f) => Number(f.slice(0, 4)));
  if (nums.length !== expectedCount || nums.at(-1) !== expectedTip) {
    failures.push(`${label} migration tip must be ${String(expectedTip).padStart(4, "0")} with exactly ${expectedCount} numbered migrations.`);
  }
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== i + 1) {
      failures.push(`${label} migration sequence has a gap or duplicate at ${String(i + 1).padStart(4, "0")}.`);
      break;
    }
  }
}
await checkMigrationSequence("global-community/migrations", 15, 15, "Global Community");
await checkMigrationSequence("recovery-control/migrations", 6, 6, "Recovery Control");

const packageConfig = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
for (const [script, required] of [
  ["deploy", "npm run preflight"],
  ["deploy:staging", "npm run preflight:staging"],
  ["migrate:prod", "npm run preflight"],
  ["migrate:staging", "npm run preflight:staging"]
]) {
  if (!packageConfig.scripts?.[script]?.startsWith(required)) {
    failures.push(`Remote operation '${script}' must run '${required}' first.`);
  }
}
if (!packageConfig.scripts?.["preflight:staging"]?.includes("--env staging")) {
  failures.push("Staging preflight must explicitly select the staging environment.");
}

const communityStaging = await readFile(join(root, ".github/workflows/cloudflare-global-community-staging.yml"), "utf8");
const communityPreflight = await readFile(join(root, "global-community/scripts/preflight.mjs"), "utf8");
if (!communityStaging.includes("/workers/subdomain") ||
    !communityStaging.includes("STAGING_ORIGIN") ||
    !communityStaging.includes('PUBLIC_ORIGIN = \\"$STAGING_ORIGIN\\"')) {
  failures.push("Global Community staging must resolve the account-specific workers.dev origin before deploy.");
}
if (!communityPreflight.includes("assignment.test(staging)")) {
  failures.push("Global Community preflight must reject committed secrets in staging config.");
}

const prod = await readFile(join(root, ".github/workflows/cloudflare-production.yml"), "utf8");
const account2 = await readFile(join(root, ".github/workflows/cloudflare-media-engine.yml"), "utf8");
for (const [name, workflow] of [["Account 1", prod], ["Account 2", account2]]) {
  if (!workflow.includes("npm ci")) failures.push(`${name} deployment must use npm ci.`);
  if (/wrangler whoami/.test(workflow)) failures.push(`${name} deployment must not depend on wrangler whoami.`);
}

if (failures.length) {
  console.error("ARCHITECTURE CHECK FAILED");
  for (const f of failures) console.error("- " + f);
  process.exit(1);
}

console.log("ARCHITECTURE CHECK PASSED — deployment, migration and Media Engine invariants preserved.");

