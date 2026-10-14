# D1 Capacity & Growth Modeling
**Resolves Independent Audit Finding H4 — verified against current Cloudflare docs, not estimated.**

## Real Limits (source: developers.cloudflare.com/d1/platform/limits, verified this session)

| Limit | Free | Paid ($5/mo base) |
|---|---|---|
| Max database size | 500 MB | 10 GB |
| Max storage per account | 5 GB (10 databases × 500MB) | 1 TB |
| Time Travel (point-in-time recovery) | **7 days** | 30 days |
| Rows read | ~5M/day (per one source) or ~150M/month (per another — see note below) | 25B/month |
| Rows written | ~100K/day or ~3M/month | 50M/month |
| Max rows per table | Unlimited (bounded only by total DB size) | Unlimited |

**Note on conflicting figures:** two otherwise-reputable secondary sources gave different read/write caps (daily vs. monthly framing) for the free tier. This should be confirmed directly against the Cloudflare dashboard once a real account exists, rather than assumed from either source — flagging the discrepancy rather than picking one silently.

## Real Finding for Backup & Recovery (Volume 3 §13)

**D1's Time Travel feature provides built-in point-in-time recovery — 7 days on the free tier.** This is a genuine, partial answer to the long-open Backup & Recovery gap: D1 itself can be restored to any point in the last 7 days without a custom backup system. **This does not cover R2 (media) or KV (sessions/cache)** — those still need their own policy. Recommend Volume 3 §13 be updated to state Time Travel as the D1 answer, with R2/KV backup remaining the genuinely open part of the question.

## Growth Modeling: `audit_logs`

`audit_logs` grows unboundedly by design (Rule C: audit everything sensitive, never soft-deleted). At a conservative ~300 bytes/row (actor, action, target, reason, timestamp):

- **500 MB free-tier single-database cap ÷ 300 bytes ≈ ~1.75 million audit log rows** before hitting the free-tier size ceiling — and that's before accounting for every other table sharing the same database, per the frozen one-shared-D1 architecture rule.

**Practical conclusion:** a growing ministry platform will likely need the $5/month Workers Paid plan well before audit logs alone become a problem, simply because everything shares one database. This is a small, reasonable cost consistent with "Cloudflare-first, free where practical" — but "free forever, unlimited" was never a realistic expectation once audit logging is unbounded by design, and this should be stated plainly to the ministry rather than assumed.

## Recommendation
Revisit this note once a real Cloudflare account exists and real usage data is available — this is a model, not a measurement, and should be labeled as such until Cloudflare-Verified.
