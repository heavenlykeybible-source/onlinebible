import {makeApprovalHandler,type VerifyOwner} from "./approval-handler";
import type {RegistryDb} from "./release-approval";

/** Dedicated Account 4 release API. Requires a real Control Room identity verifier. */
export function createReleaseRouter(verifyOwner:VerifyOwner){
 const approve=makeApprovalHandler(verifyOwner);
 return async (request:Request,db:RegistryDb):Promise<Response>=>{
  const url=new URL(request.url);
  if(url.pathname==="/api/control/releases/approve")
   return approve(request,{DB:db});
  return Response.json({error:"not_found"},{status:404});
 };
}
