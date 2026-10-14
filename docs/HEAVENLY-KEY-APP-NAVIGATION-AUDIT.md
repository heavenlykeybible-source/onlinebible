# Heavenly Key connected app navigation audit

Shared navigation was inserted into the website app directory, Bible, three standalone PWAs, All-in-One frontend, and Global Community frontend. The menu has links to the main website, Bible, All-in-One, Radio, Walk With God, Bible Study, and Community.

## Update safety fix
Radio, Walk and Study service workers no longer call `skipWaiting()` during installation or `clients.claim()` during activation. Instead, their update script asks users to save work and click **Update now**. The script reloads only after an explicitly approved controller change. This avoids silent replacement while people are using the app.

## Deployment caveats
The changed files are committed to source; live deployment to all separately hosted accounts has not been verified. Cross-origin app links require their destination domains to be configured and live. Installed browser PWAs may continue to show an older navigation until their deployed service worker receives a new release. Actual offline support and device installation must be verified on deployed builds. Standalone Study still requires full interactive study features.
