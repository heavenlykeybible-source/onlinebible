# Assistant response speed — 16 October 2026

Status: corrected and tested on draft branch; production deployment held at owner's request.

## Current production measurement

Read-only GitHub Actions run 38934335887 called the existing public service twice. The first request returned HTTP 503 / gemini_provider_error in 1.45 seconds. The second returned HTTP 200 and 502 answer characters in 11.385 seconds. The successful response headers arrived only after 11.382 seconds: the existing generateContent path buffers the whole answer. These measurements describe the existing service, not the proposed fix. Provider variation and availability remain external dependencies.

## Changes

- The approved assistant requests streaming and displays actual answer text as each chunk arrives, with no artificial character animation or typing delay.
- The public CMS uses the same Gemini model, official ministry context, KJV policy, origins, private key handling and request limits. Optional streaming is transformed into answer-only NDJSON; provider thoughts and metadata are not exposed.
- Ordinary answers are directed to 40–80 words, with longer explanations available when requested. Generation explicitly uses the provider's supported minimal thinking setting and a 500-token output cap.
- Existing non-streaming clients still receive JSON. The updated browser also accepts JSON from the currently deployed service, allowing separate rollout without breaking chat.
- Typing… displays immediately until the first answer text. Interrupted streams preserve received text and show an explicit interruption message. Send is re-enabled after completion/failure, and requests have a bounded timeout covering the body as well as response headers.
- Updated assistant asset query strings in the 16 existing consuming pages and bumped the site service-worker cache namespace for the next approved release. No layout changes.

## Tests

`node scripts/test-assistant-speed.mjs` passes six tests:

1. Fragmented UTF-8 and CRLF provider streams reconstruct correctly; thoughts are filtered.
2. Backend forwards the first answer before upstream generation completes.
3. Missing terminal events, blocked and failed responses never report false success or leak provider errors.
4. Route preserves origin restrictions, streaming configuration and KJV/ministry policy.
5. Older JSON callers remain compatible.
6. Desktop 1440px and mobile 390px browser tests show first actual text around 0.22–0.25 seconds with a simulated 150ms first chunk and 1400ms completion; JSON compatibility and interrupted streams pass, with no browser exceptions.

The simulated timings demonstrate removal of buffering; they are not promises of Gemini's live response time. Actual changed-provider timing must be measured after an approved deployment. No Cloudflare deployment or main-branch merge performed for this correction.
