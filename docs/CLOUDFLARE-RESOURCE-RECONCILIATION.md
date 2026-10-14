# Cloudflare resource reconciliation

## Currently verified Core resources

- D1: heavenlykey-core-db
- D1 ID: f4314bdc-db8e-4b63-8387-3c1fc611de2b
- KV: HEAVENLYKEY_CORE_KV
- KV ID: 5326baddaada40e6ad5c6a5d7d691e60
- R2: heavenlykey-core-assets

## Reviewed application bindings

The reviewed Project Nehemiah application expects:

- D1 binding DB
- KV bindings SESSIONS_KV, RATE_LIMIT_KV, LIVE_STATUS_KV
- R2 binding MEDIA_R2
- separate Account 2 media-engine deployment

These are architecturally different from the currently provisioned Core smoke-test resources. Do not rename or repurpose the reviewed application's bindings merely to make a deployment pass. Either provision the reviewed resource set or make an explicit, tested architecture change.

## Deployment rule

No production deployment should be attempted from this repository until the reviewed source tree is imported and the binding/resource reconciliation is completed.
