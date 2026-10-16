// Account 4-only entry point. Do not deploy over the existing Control Room.
import {createReleaseRouter} from "./release-router";
import {createStudioSso} from "./studio-sso";
import {createUserRouter,type UserDb} from "./user-management";
import {createCmsAiRouter,type CmsDb} from "./cms-ai";
import {createAiDraftHandler,type AiEnv} from "./ai-generate";
import {createClientRegistryRouter,type QueryDb} from "./client-registry";
import {createOwnerVerifier,type IdentityConfig} from "./identity-adapter";
import type {RegistryDb} from "./release-approval";
interface Env extends IdentityConfig,AiEnv {DB:RegistryDb & QueryDb & UserDb & CmsDb;STUDIO_ORIGIN?:string;STUDIO_REDEEM_SECRET?:string}
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
  if(url.pathname==="/api/control/ai/generate")
   return secure(await createAiDraftHandler(createOwnerVerifier(env))(request,env));
  if(url.pathname==="/api/control/cms/documents"||/^\/api\/control\/cms\/documents\/[0-9a-f-]{36}(\/save)?$/i.test(url.pathname)||url.pathname==="/api/control/ai/suggestions")
   return secure(await createCmsAiRouter(createOwnerVerifier(env))(request,env.DB));
  if(url.pathname==="/api/control/users"||/^\/api\/control\/users\/[0-9a-f-]{36}\/(password|disable|enable)\/?$/i.test(url.pathname))
   return secure(await createUserRouter(createOwnerVerifier(env))(request,env.DB));
  if(url.pathname==="/api/control/studio/launch"||url.pathname==="/api/control/studio/redeem")
   return secure(await createStudioSso(createOwnerVerifier(env))(request,env));
  if(url.pathname==="/api/control/releases/approve")
   return secure(await createReleaseRouter(createOwnerVerifier(env))(request,env.DB));
  if(url.pathname==="/api/control/clients"||/^\/api\/control\/clients\/[0-9a-f-]{36}\/sites\/?$/i.test(url.pathname))
   return secure(await createClientRegistryRouter(createOwnerVerifier(env))(request,env.DB));
  return secure(Response.json({error:"not_found"},{status:404}));
 }
};
