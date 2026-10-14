# Remove the outer gateway lock; keep application administrator login

Owner clarification — 14 October 2026: remove the blocking administrative splash
page that has no authentication form. Administrators must still enter their normal
application password and sign in. Do not disable application sessions, roles,
member privacy, API authorization, passwords or publishing approvals.

## Source finding

The saved Account 1 gateway source in `Pasted text.txt` unconditionally returns
HTTP 403 for `cfg.type === "protected"`, before calling the upstream application.
That prevents the application's login form from being reached.

The quoted Studio HTML splash is absent from the inspected default branches of
the connected main/platform repositories. It can be a newer deployed gateway
variant. This recovered source is not a verified copy of the current live Worker.

## Candidate change

`worker.mjs` is the recovered source with only the unconditional protected-host
403 branch removed, plus a source-status comment. Existing service entries,
cookies, Authorization forwarding, request bodies and response status codes are
preserved. Login and private API authorization remain the upstream application's
responsibility. No application authentication code was removed.

## Applying to the production candidate

Apply the removal to the CURRENT `heavenlykey-gateway` source, retaining every
verified upstream, enabled flag, route, binding and streaming/redirect fix.
Remove equivalent outer splash-screen blocks for Studio, Control and Admin.
Do not replace a newer live gateway with this older recovered file.

The recovered configuration has empty upstreams. It is therefore NOT ready to
deploy unchanged: missing upstreams produce 502, not a working login form.
A deployment of the main platform alone does not update Account 1's gateway.

If an independently configured Cloudflare Access application intercepts requests
before the Worker, remove that extra interception in the account configuration.
Application login remains required. Do not delete databases, secrets or accounts.

## Verification

`node --check worker.mjs && node --test access.test.mjs`: six checks passed.
Configured Studio, Control and Admin requests reach an upstream login form;
upstream HTTP 401 remains 401; missing upstreams are not guessed; apex/www
and unknown hosts remain outside this gateway.

The tests use mocked upstreams. No live gate removal or Cloudflare deployment
has been performed. Cloudflare dashboard sign-in failed in this session.
