/** Account 4 preview wrappers are public test sites with isolated D1, KV and R2.
 * No app-specific Cloudflare Access/session gate is injected here.
 * Native application authentication (e.g. member/admin accounts) is preserved. */
export function waitingRoom(app:{fetch:(req:Request,env:any,ctx:any)=>Promise<Response>},account:string,assets:boolean){
 return {async fetch(request:Request,env:any,ctx:any):Promise<Response>{
  const url=new URL(request.url);
  if(url.pathname==='/__review/enter')return Response.redirect(new URL('/',url),303);
  let response:Response;
  if(account==='2'&&url.pathname==='/'){
   response=new Response('<!doctype html><html><head><meta name="robots" content="noindex,nofollow"><title>Media Review</title></head><body><h1>Account 2 Media Engine Preview</h1><p>Isolated Account 4 test environment.</p><a href="/health">Media engine health</a></body></html>',{headers:{'content-type':'text/html;charset=utf-8'}});
  }else if(assets&&!url.pathname.startsWith('/api/')&&env.ASSETS){
   response=await env.ASSETS.fetch(request);
  }else{
   response=await app.fetch(request,env,ctx);
  }
  const output=new Response(response.body,response);
  output.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');
  output.headers.set('Cache-Control','no-store');
  return output;
 }};
}
