const targets = Object.freeze({
  'global.heavenlykey.org': 'https://heavenly-key-global-community.heavenlykeyglobal-cd095c09.workers.dev',
  'bible.heavenlykey.org': 'https://onlinebible.heavenlykeybible.workers.dev'
});

export async function route(request, upstreamFetch = fetch) {
  const publicUrl = new URL(request.url);
  const origin = targets[publicUrl.hostname];
  if (!origin) return new Response('Unknown ministry portal', {status: 404});
  const headers = new Headers(request.headers);
  const incomingOrigin = headers.get('Origin');
  // Keep the same-origin write rule before forwarding to the fixed upstream.
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    if (headers.get('Sec-Fetch-Site') === 'cross-site' || (incomingOrigin && incomingOrigin !== publicUrl.origin)) {
      return new Response('Cross-site action denied', {status: 403});
    }
  }
  if (incomingOrigin === publicUrl.origin) headers.set('Origin', origin);
  headers.delete('Host');
  headers.delete('X-Forwarded-Host');
  const upstreamUrl = new URL(publicUrl.pathname + publicUrl.search, origin);
  const forwarded = new Request(upstreamUrl, request);
  const init = new Request(forwarded, {headers, redirect: 'manual'});
  let response;
  try {
    response = await upstreamFetch(init);
  } catch {
    return new Response('The ministry portal is temporarily unavailable.', {
      status: 503, headers: {'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store'}
    });
  }
  if (response.status === 101) return response;
  const location = response.headers.get('Location');
  if (!location) return response;
  const redirect = new URL(location, upstreamUrl);
  if (redirect.origin !== origin) return response;
  const result = new Response(response.body, response);
  result.headers.set('Location', publicUrl.origin + redirect.pathname + redirect.search + redirect.hash);
  return result;
}

export default {fetch(request) {return route(request);}};
