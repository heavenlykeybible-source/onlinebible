import {approvePreview, type RegistryDb} from "./release-approval";
export interface OwnerIdentity {userId:string;role:"owner"}
export type VerifyOwner=(request:Request)=>Promise<OwnerIdentity|null>;
export interface ApprovalEnvironment {DB:RegistryDb}
const response=(body:unknown,status:number)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
export function makeApprovalHandler(verifyOwner:VerifyOwner){
 return async function handleApproval(request:Request,env:ApprovalEnvironment):Promise<Response>{
  if(request.method!=="POST")return response({error:"method_not_allowed"},405);
  const origin=request.headers.get("Origin");
  if(!origin||origin!==new URL(request.url).origin)return response({error:"invalid_origin"},403);
  const owner=await verifyOwner(request);
  if(!owner||owner.role!=="owner"||!owner.userId)return response({error:"forbidden"},403);
  if(!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json"))return response({error:"invalid_content_type"},415);
  if(Number(request.headers.get("Content-Length")||0)>4096)return response({error:"body_too_large"},413);
  const data:unknown=await request.json().catch(()=>null);
  if(!data||typeof data!=="object"||Array.isArray(data))return response({error:"invalid_body"},400);
  const body=data as Record<string,unknown>;
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if(typeof body.siteId!=="string"||!uuid.test(body.siteId)||typeof body.releaseId!=="string"||!uuid.test(body.releaseId)||typeof body.sha256!=="string")
   return response({error:"invalid_release"},400);
  const result=await approvePreview(env.DB,{siteId:body.siteId,releaseId:body.releaseId,expectedSha256:body.sha256,ownerUserId:owner.userId});
  return result==="approved"?response({status:"approved",releaseId:body.releaseId,sha256:body.sha256},200):response({error:result},result==="not_found"?404:409);
 };
}
