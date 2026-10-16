// Account 4-only entry point. Do not deploy over the existing Control Room.
import {createReleaseRouter} from "./release-router";
import {createOwnerVerifier,type IdentityConfig} from "./identity-adapter";
import type {RegistryDb} from "./release-approval";
interface Env extends IdentityConfig {DB:RegistryDb}
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
  if(url.pathname==="/api/control/health"&&request.method==="GET")
   return secure(Response.json({service:"account4-client-registry",status:"integration-pending"}));
  if(url.pathname==="/api/control/releases/approve")
   return secure(await createReleaseRouter(createOwnerVerifier(env))(request,env.DB));
  // Client registry endpoints remain disabled until migrated to Account 4 auth.
  return secure(Response.json({error:"not_found"},{status:404}));
 }
};
