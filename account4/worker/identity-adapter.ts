/** Verify an Account 4 session through a separately configured identity service.
 * Fails closed if configuration, issuer, audience, or active session is absent.
 * This is an adapter, NOT a replacement for the existing Control Room login.
 */
import type {VerifyOwner} from "./approval-handler";
export interface IdentityConfig {
 IDENTITY_VERIFY_URL?:string;
 IDENTITY_SERVICE_TOKEN?:string;
}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function createOwnerVerifier(env:IdentityConfig):VerifyOwner {
 return async(request)=>{
  if(!env.IDENTITY_VERIFY_URL||!env.IDENTITY_SERVICE_TOKEN)return null;
  let url:URL;
  try{url=new URL(env.IDENTITY_VERIFY_URL)}catch{return null}
  if(url.protocol!=="https:"||url.username||url.password||url.search||url.hash)return null;
  const cookie=request.headers.get("Cookie");
  if(!cookie||cookie.length>8192)return null;
  try{
   const response=await fetch(url.toString(),{
    method:"POST",
    headers:{"Authorization":`Bearer ${env.IDENTITY_SERVICE_TOKEN}`,"Cookie":cookie,"Accept":"application/json"},
    redirect:"error",
    signal:AbortSignal.timeout(5000)
   });
   if(!response.ok)return null;
   const identity:unknown=await response.json();
   if(!identity||typeof identity!=="object")return null;
   const value=identity as Record<string,unknown>;
   if(value.authenticated!==true||value.role!=="owner"||typeof value.userId!=="string"||!uuid.test(value.userId))return null;
   return {userId:value.userId,role:"owner"};
  }catch{return null}
 };
}
