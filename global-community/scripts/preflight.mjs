import { readFile } from 'node:fs/promises';

const config = await readFile(new URL('../wrangler.toml', import.meta.url), 'utf8');
const staging = await readFile(new URL('../wrangler.staging.toml', import.meta.url), 'utf8');
const release = process.argv.includes('--release');
const requiredBindings = ['DB', 'SESSIONS', 'MEDIA', 'AI'];
const requiredSecrets = ['SESSION_SECRET', 'PASSWORD_PEPPER', 'INTERSERVICE_SECRET'];

for (const secret of requiredSecrets) {
  const assignment = new RegExp('^\\s*' + secret + '\\s*=', 'm');
  if (assignment.test(config)) {
    throw new Error('Never store secret values in production wrangler.toml: ' + secret);
  }
  if (assignment.test(staging)) {
    throw new Error('Never store secret values in staging wrangler.staging.toml: ' + secret);
  }
}
for (const binding of requiredBindings) {
  if (!config.includes('binding = "' + binding + '"')) {
    throw new Error('Missing required production binding: ' + binding);
  }
  if (!staging.includes('binding = "' + binding + '"')) {
    throw new Error('Missing required staging binding: ' + binding);
  }
}
if (!config.includes('https://global.heavenlykey.org')) {
  throw new Error('Global community origin missing.');
}
const placeholders = [...config.matchAll(/REPLACE_[A-Z0-9_]+/g)].map(m => m[0]);
if (release && placeholders.length) {
  throw new Error('Release blocked: unresolved Cloudflare resource placeholders: ' + [...new Set(placeholders)].join(', '));
}
if (release) {
  console.log('RELEASE CONFIGURATION CHECK PASSED — confirm secrets, migrations, security and live tests separately.');
} else {
  console.log('GLOBAL COMMUNITY DEVELOPMENT PREFLIGHT PASSED — ' + [...new Set(placeholders)].length + ' resource placeholders; deployment readiness NOT certified.');
}
