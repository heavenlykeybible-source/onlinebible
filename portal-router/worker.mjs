function friendlyPage(status=404){const missing=status===404;return new Response('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Heavenly Key · '+(missing?'Page not found':'Please try again shortly')+'</title><style>body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#f5f8fc;color:#17345b;font:18px/1.6 system-ui}main{max-width:600px;padding:36px;text-align:center}a{display:inline-block;background:#173e8c;color:white;padding:12px 20px;border-radius:12px;margin:8px;text-decoration:none}</style></head><body><main><p>HEAVENLY KEY</p><h1>'+(missing?'Let’s help you find your way.':'This service is temporarily unavailable.')+'</h1><p>'+(missing?'This page may have moved. Return home and continue exploring.':'Please try again shortly, or return to the ministry homepage.')+'</p><a href="/">Return to this app’s home</a><a href="https://heavenlykey.org/">Ministry homepage</a></main></body></html>',{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export const targets = Object.freeze({
  'studioroom.heavenlykey.org': 'https://heavenlykey-media.faithofourfatherstv.workers.dev',
  'controlroom.heavenlykey.org': 'https://website-management.emmanuel2026miracle.workers.dev',
  'meeting.heavenlykey.org': 'https://heavenly-key-zoom-studio.omegawealthcreator.workers.dev',
  'radio.heavenlykey.org': 'https://heavenlykeyradio.heavenlykeyradio.workers.dev',
  'mediaeditor.heavenlykey.org': 'https://heavenlykey-studio.emmanuelmeta247.workers.dev',
  'control.heavenlykey.org': 'https://heavenlykey-owner-dashboard.emmanuel2026miracle.workers.dev',
  'studio.heavenlykey.org': 'https://heavenlykey.alldaywow247.workers.dev',
  'apps.heavenlykey.org': 'https://heavenly-key-app.heavenlykeyapp.workers.dev',
  'onlinebible.heavenlykey.org': 'https://onlinebible.heavenlykeybible.workers.dev',
  'app.heavenlykey.org': 'https://heavenly-key-app.heavenlykeyapp.workers.dev',
  'global.heavenlykey.org': 'https://heavenly-key-global-community.heavenlykeyglobal-cd095c09.workers.dev',
  'bible.heavenlykey.org': 'https://onlinebible.heavenlykeybible.workers.dev'
});

export async function route(request, upstreamFetch = fetch) {
  const publicUrl = new URL(request.url);
  // Deliver only the owner-requested chat assets without changing the production API or bindings.
  if(['heavenlykey.org','www.heavenlykey.org','studio.heavenlykey.org','global.heavenlykey.org','bible.heavenlykey.org','app.heavenlykey.org'].includes(publicUrl.hostname)&&/^\/(?:js\/)?cms-runtime-20261015\.(js|css)$/.test(publicUrl.pathname)){
    if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
    const assetUrl='https://heavenlykey-owner-dashboard.emmanuel2026miracle.workers.dev/'+publicUrl.pathname.split('/').pop()+publicUrl.search;
    const asset=await upstreamFetch(new Request(assetUrl,{method:request.method}));
    const result=new Response(asset.body,asset);
    result.headers.set('Cache-Control','no-cache, max-age=0, must-revalidate');
    result.headers.set('X-Content-Type-Options','nosniff');
    return result;
  }
  if(publicUrl.hostname==='studio.heavenlykey.org'&&publicUrl.pathname==='/')return Response.redirect(publicUrl.origin+'/pages/admin.html#studio',302);
  const wantsPage=!publicUrl.pathname.startsWith('/api/')&&((request.headers.get('Accept')||'').includes('text/html')||request.headers.get('Sec-Fetch-Dest')==='document');
  const origin = targets[publicUrl.hostname];
  if (!origin) return wantsPage?friendlyPage():new Response('Unknown ministry portal', {status: 404});
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
  headers.delete('X-HK-Public-Origin');
  headers.set('X-HK-Public-Origin', publicUrl.origin);
  const upstreamUrl = new URL(publicUrl.pathname + publicUrl.search, origin);
  const forwarded = new Request(upstreamUrl, request);
  const init = new Request(forwarded, {headers, redirect: 'manual'});
  let response;
  try {
    response = await upstreamFetch(init);
  } catch {
    if(wantsPage)return friendlyPage(503);
    return new Response('The ministry portal is temporarily unavailable.', {
      status: 503, headers: {'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store'}
    });
  }
  if (response.status === 101) return response;
  if(wantsPage&&response.status===404)return friendlyPage();
  if(wantsPage&&response.status>=500)return friendlyPage(503);
  const location = response.headers.get('Location');
  const fresh=new Response(response.body,response);fresh.headers.set('X-Heavenly-Key-Upstream',new URL(origin).hostname);if(publicUrl.pathname==='/'||publicUrl.pathname.endsWith('.html')||publicUrl.pathname.endsWith('.js')||publicUrl.pathname.endsWith('.css'))fresh.headers.set('Cache-Control','no-cache, max-age=0, must-revalidate');
  if (!location) return fresh;
  const redirect = new URL(location, upstreamUrl);
  if (redirect.origin !== origin) return response;
  const result = new Response(fresh.body, fresh);
  result.headers.set('Location', publicUrl.origin + redirect.pathname + redirect.search + redirect.hash);
  return result;
}

export default {fetch(request) {return route(request);}};
