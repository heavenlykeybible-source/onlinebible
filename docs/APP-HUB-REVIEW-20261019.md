# Heavenly Key app page

The app page now introduces the All-in-One App with a computer and nine phone advertisements, followed by a three-column grid of the nine individual public apps. It reuses the main homepage navigation and footer. Smaller screens reflow the grid.

## Routes

- `/pages/app.html`: showcase and app workspace. `?app=radio` (or another registry ID) opens that app.
- `/pages/app-downloads.html?app=radio`: horizontal device rows, each with matching installation link and QR.
- `/pages/apps/{id}/`: independent installation entry, manifest identity and narrow launcher service-worker scope for each app.
- `/pages/app-suite.html`: the All-in-One launcher inside the phone window.
- `/pages/app-radio.html` and `/pages/app-assistant.html`: isolated mounts of the existing approved player and assistant, with the same backend and assets.
- `/pages/app-blog.html` and `/api/apps/blog`: an in-phone text reader for the fixed official public Blogger feed. Article HTML is never injected into the page.

## Behaviour

Only one phone window is visible. App frames load on demand and remain mounted when another app opens or the window is minimized. Reopening restores the same iframe rather than creating another radio connection. Explicit Close removes only that app’s frame and ends its playback/session. The minimized-app dock restores or closes each session. The window can be moved by its heading and resized within the available viewport.

Share uses native sharing where supported, with WhatsApp, Facebook, Telegram, X and copy-link fallback. All links reopen the selected app. The download selector and QR codes use the same registry. Every app has seven device destinations: Android phone, iPhone, Android tablet, iPad, Windows, Mac and Linux.

Downloads are browser web-app installations, not unreleased APK/IPA/store packages. The install page gives instructions for the selected device. Launcher offline caching is restricted to reviewed public shell files. Existing notebook, progress, Bible and audio storage is untouched. Actual offline app features continue to belong to the existing app origins. Mobile OS/browser background policies can still interrupt playback outside this page.

## Embedding

Main-site frames accept the same origin. App and Community public pages accept only their own origin and the two official main-site origins. No wildcard frame-ancestor, script or cross-origin API permission is added. API/admin responses retain explicit frame denial. Authentication is not proxied or duplicated. This header change must be released to both the main-site and the existing App and Community deployments before all live embedded apps can work.

Audio Bible remains inside Bible and is not an additional app. Studio and Control Room are excluded. GRDPC/reminders remain one public app entry.

## Validation

- `node --test test/app-hub.test.mjs`: session exclusivity, registry/install identities, restricted embedding, public-only cache rules and bounded blog-feed handling.
- DOM interaction checks: nine cards and advertisements; lazy loading; stable radio iframe across switches; minimize/restore/close; selected-app share/copy/download; device guidance; all seven QR rows.
- All 70 generated QR matrices decoded and matched to the exact app/device link.

Browser visual QA and live Cloudflare deployment are pending. This is a review implementation, not a production activation.
