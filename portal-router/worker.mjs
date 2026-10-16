import {protectedRoute} from '../account4-control-room/src/release-targets.ts';
const targets = Object.freeze({
  'heavenlykey.org':'https://heavenlykey.alldaywow247.workers.dev',
  'www.heavenlykey.org':'https://heavenlykey.alldaywow247.workers.dev',
  'control.heavenlykey.org': 'https://heavenlykey-owner-dashboard.emmanuel2026miracle.workers.dev',
  'studio.heavenlykey.org': 'https://heavenlykey.alldaywow247.workers.dev',
  'app.heavenlykey.org': 'https://heavenly-key-app-recovery.alldaywow247.workers.dev',
  'global.heavenlykey.org': 'https://heavenly-key-global-community.heavenlykeyglobal-cd095c09.workers.dev',
  'bible.heavenlykey.org': 'https://onlinebible.heavenlykeybible.workers.dev'
});

async function originalRoute(request, upstreamFetch = fetch) {
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

export async function route(request,upstreamFetch=fetch){
 const u=new URL(request.url),read=['GET','HEAD'].includes(request.method);
 if(!targets[u.hostname])return new Response('Unknown ministry portal',{status:404});
 const oldPresentation=/^\/api\/(?:admin\/cms\/(?:page|layout|slider)|admin\/site-content\/(?:homepage|page)|site-content\/(?:cms|layout|slider|homepage|page))$/.test(u.pathname);
 if(oldPresentation&&!read&&request.method!=='OPTIONS')return Response.json({error:'Send presentation edits to the Account 4 awaiting room for preview and approval.'},{status:409});
 if(read&&u.hostname!=='bible.heavenlykey.org'&&/^\/bible(?:\/|$)/.test(u.pathname))return Response.redirect('https://bible.heavenlykey.org'+u.pathname.replace(/^\/bible/,'')+u.search,302);
 const runtime=/^\/(?:js\/)?cms-runtime-20261015\.(js|css)$/.test(u.pathname);
 if(oldPresentation||(read&&!protectedRoute(u.pathname)&&!runtime)){
  const asset=new URL('/v1/release-asset','https://heavenlykey-cms-public.emmanuel2026miracle.workers.dev');asset.searchParams.set('host',u.hostname);asset.searchParams.set('path',oldPresentation?'/':u.pathname);
  let response;try{response=await upstreamFetch(new Request(asset,{method:oldPresentation?'HEAD':request.method,redirect:'error',cache:'no-store'}))}catch{return new Response('Website release service is temporarily unavailable.',{status:503,headers:{'Cache-Control':'no-store'}})}
  if(response.status!==204){
   if(oldPresentation){if(!response.ok)return new Response('Release status is unavailable.',{status:503});if(!read)return Response.json({error:'Send presentation edits to the Account 4 awaiting room for preview and approval.'},{status:409});return Response.json({content:{},releaseManaged:true},{headers:{'cache-control':'no-store'}})}
   return new Response(response.body,response);
  }
 }
 return originalRoute(request,upstreamFetch);
}
export default {fetch(request) {return route(request);}};

