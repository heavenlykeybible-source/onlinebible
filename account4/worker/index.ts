// Dedicated Account 4 Worker entry point. NOT the public Heavenly Key Worker.
// Attach a separate Account 4 D1 binding and deploy only after owner approval.
import {handleClientAccounts} from "../../src/routes/control-clients";
import type {Env} from "../../src/services/auth-service";

const secure=(response:Response)=>{
 const headers=new Headers(response.headers);
 headers.set("Cache-Control","no-store");
 headers.set("X-Content-Type-Options","nosniff");
 headers.set("Referrer-Policy","same-origin");
 headers.set("X-Frame-Options","DENY");
 return new Response(response.body,{status:response.status,headers});
};
export default {
 async fetch(request:Request,env:Env):Promise<Response>{
  const url=new URL(request.url);
  if(request.method==="OPTIONS")return secure(new Response(null,{status:204,headers:{"Allow":"GET, POST, OPTIONS"}}));
  if(url.pathname==="/api/control/clients" || /^\/api\/control\/clients\/[0-9a-f-]{36}\/sites\/?$/i.test(url.pathname)){
   return secure(await handleClientAccounts(request,env));
  }
  if(url.pathname==="/api/control/health"&&request.method==="GET"){
   return secure(Response.json({service:"account4-client-registry",status:"ready-for-integration"}));
  }
  return secure(Response.json({error:"not_found"},{status:404}));
 }
};
