# Heavenly Key app-family release and update standard

Six connected experiences: All-in-One, Bible, Radio, Walk With God, Bible Study and Global Christian Community.

## Single maintenance cycle
1. Change and review the shared ministry design/navigation first; do not duplicate business logic without need.
2. Run each app's existing tests and security checks, then manually verify links, installation and offline behaviour.
3. Publish one app at a time; smoke-test live before releasing the next.
4. Increment the service worker cache version when app-shell files change. Do not cache authenticated pages, private API responses or community user data.
5. A new worker should install in the background. Show an update notice; never silently refresh a page containing unsaved work. The user must explicitly choose **Update now**.
6. After a successful deployment, verify offline launch, online recovery, manifest, install controls, app-family navigation and accessibility.
7. If release checks fail, restore the previous known-good deployment and investigate before continuing.

## Important boundaries
- Browser PWAs update from the deployed server; GitHub commits alone do not update users' installed apps.
- Social network authentication and user content must remain isolated from public/offline caches.
- A native iOS/Android app-store release requires separate signing, distribution and review.
- The shared update banner works only on pages where the update script is included and an active service worker exists.
- No release should be called production-verified until live browser/device checks pass.
