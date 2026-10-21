# Global Christian Community — isolated working copies

These directories are copied Git trees, not symlinks. All tracked files, including binary images, are preserved byte-for-byte from their source trees.

- `premium-draft/`: 145 tracked files, copied from `draft/community-active-content-20261019` at commit `40ad5c04ef04ed30f64b8b957939f69eddddd9f8`. Includes the approved `public/assets/global-christian-community-approved-banner.jpeg`, premium CSS and dashboard files, additional migrations and feature modules.
- `current-main/`: 122 tracked files, copied from `main` at commit `f0c1de96ff1e6cc21abbe08cfead37fd3605325a`.

This branch is an audit/build workspace, not a production release. Do not deploy one copy over the other without reviewing the complete diff, database migrations and secrets/bindings. Do not overwrite Account 2 Studio, Account 3 Community, or Account 4 Control Room.

Next: compare both copies, identify unmatched UI screenshots, merge desired features on a separate development branch, execute builds and tests, and seek owner approval for a staged preview.

No Cloudflare resources, member data or production deployments were changed by this copy.
