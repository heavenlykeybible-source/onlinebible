# Bible reader — two independent background-music choices

## Owner workflow
The Scripture reader at `/pages/bible-reader.html` has **Off (default)**, **Background music 1**, and **Background music 2**. Its music volume defaults to 20%, ranges 0–100%, is independent of the narration volume, and is remembered only in the listener's browser. No track auto-plays on page load.

Admin opens `/pages/admin.html`, signs into the ministry admin account, and clicks **Manage Bible Music 1 & 2**. On `/pages/bible-music-admin.html`, choose **Background music 2**, select the uploaded owner-supplied M4A recording (`My Mp3 6.m4a`, about 13 minutes; optionally use a lower-bitrate M4A), confirm actual streaming rights, then select **Upload, keep and publish**. Check that the public music catalogue lists both chosen slots. Repeat for Background music 1 if no approved track is already present. The uploaded audio file must be supplied through this admin tool; commits do not silently publish private chat attachments.

The uploader intentionally uses the existing admin-guarded Media Library: `POST /api/media` for registration (with `topic: bible-background-music` and `event: bible-background-slot-1` or `-2`), `PUT /api/media/{id}/upload` for audio, `POST /api/media/{id}/keep` with `keep: true`, and `POST /api/media/{id}/approve` after the rights check. Public catalogue `GET /api/media?topic=bible-background-music` exposes only stored published files with an approved usage-rights category. The reader always has a no-music fallback.

**Do not mark a recording as ministry-owned unless Heavenly Key actually owns the recording or all rights necessary for streaming.** A file supplied by a user is not proof that the file is in the public domain.

## Acceptance checks
1. With no catalogue entries, all three Bible controls render, only Off is selectable, and Bible reading/narration still work.
2. After one approved recording is uploaded, the matching choice becomes selectable. A new approved track tagged slot 2 remains slot 2 even if it has the newest media ID.
3. After two approved tracks, users can select each, pause, switch or turn Off without audio continuing in the background.
4. Volume slider 0–100% controls only music. Bible narration is independent. Reload restores local choice and volume.
5. Opening the reader must never start music without a user gesture. iOS Safari and other clients can request partial media via HTTP 206 and `Content-Range`.
6. Only an authenticated administrator can register, upload, keep or approve a track; an unapproved track is not publicly listed.
7. Permanent Bible-background recordings remain excluded from expiry cleanup through `keep_media = 1`. Temporary broadcast media retention is unchanged.
8. Confirm actual production availability **after Account 4 owner approval**, not merely on the basis of a GitHub commit. Releasing code and uploading approved audio are separate steps.

## Troubleshooting
If the music catalogue is temporarily unavailable, the reader displays the error and keeps Off available. Use the reader's **Refresh music choices** button after publishing media. If upload fails after a media ID is issued, the item may remain a draft; it does not become available to listeners until all of upload, keep and approval succeed. Verify Cloudflare R2 binding, administrator session and rights before retrying.
