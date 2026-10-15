import {test} from 'node:test';
import assert from 'node:assert/strict';
import {route} from './worker.mjs';

test('forwards the exact path and query to the fixed community host', async () => {
  const result = await route(new Request('https://global.heavenlykey.org/api/posts?before=4'), async request => {
    assert.equal(request.url, 'https://heavenly-key-global-community.heavenlykeyglobal-cd095c09.workers.dev/api/posts?before=4');
    assert.equal(request.redirect, 'manual');
    return new Response('existing application');
  });
  assert.equal(await result.text(), 'existing application');
});
test('routes Bible scripture only to the verified Bible Worker', async () => {
  const result = await route(new Request('https://bible.heavenlykey.org/api/bible/Genesis/1'), async request => {
    assert.equal(request.url, 'https://onlinebible.heavenlykeybible.workers.dev/api/bible/Genesis/1');
    return Response.json({success: true, translation: 'KJV'});
  });
  assert.equal((await result.json()).translation, 'KJV');
});
test('preserves authenticated same-origin writes and session cookies', async () => {
  const result = await route(new Request('https://global.heavenlykey.org/api/posts', {
    method: 'POST', headers: {Origin: 'https://global.heavenlykey.org', Cookie: 'session=existing', 'Content-Type': 'application/json'}, body: '{"message":"hello"}'
  }), async request => {
    assert.equal(request.headers.get('Origin'), 'https://heavenly-key-global-community.heavenlykeyglobal-cd095c09.workers.dev');
    assert.equal(request.headers.get('Cookie'), 'session=existing');
    assert.equal(await request.text(), '{"message":"hello"}');
    return new Response('saved', {headers: {'Set-Cookie': 'session=next; Secure; HttpOnly; Path=/'}});
  });
  assert.equal(result.headers.get('Set-Cookie'), 'session=next; Secure; HttpOnly; Path=/');
});
test('rejects cross-site writes before contacting upstream', async () => {
  for (const headers of [{Origin: 'https://unrelated.example'}, {'Sec-Fetch-Site': 'cross-site'}]) {
    const result = await route(new Request('https://global.heavenlykey.org/api/posts', {method: 'POST', headers}), () => {throw Error('must not be called')});
    assert.equal(result.status, 403);
  }
});
test('rejects unknown hostnames without contacting upstream', async () => {
  const result = await route(new Request('https://unrelated.example/'), () => {throw Error('must not be called')});
  assert.equal(result.status, 404);
});
test('rewrites only redirects within the same portal, retaining cookies', async () => {
  const result = await route(new Request('https://global.heavenlykey.org/api/auth'), async () => new Response(null, {
    status: 302, headers: {Location: 'https://heavenly-key-global-community.heavenlykeyglobal-cd095c09.workers.dev/profile?id=2', 'Set-Cookie': 'session=next; Secure; HttpOnly; Path=/'}
  }));
  assert.equal(result.headers.get('Location'), 'https://global.heavenlykey.org/profile?id=2');
  assert.ok(result.headers.get('Set-Cookie').includes('HttpOnly'));
});
test('preserves external sign-in redirects without following them', async () => {
  const result = await route(new Request('https://global.heavenlykey.org/api/auth'), async () => new Response(null, {status: 302, headers: {Location: 'https://accounts.google.com/signin'}}));
  assert.equal(result.headers.get('Location'), 'https://accounts.google.com/signin');
});
test('upstream network failures return a non-cacheable error', async () => {
  const result = await route(new Request('https://global.heavenlykey.org/'), async () => {throw Error('network')});
  assert.equal(result.status, 503);
  assert.equal(result.headers.get('Cache-Control'), 'no-store');
});
