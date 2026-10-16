/**
 * Account 4 release workflow. A release is an immutable artifact digest plus
 * optional preview URL. No production deployment capability is exposed here.
 * Owner approval is explicit and recorded against the digest.
 */
export type ReleaseState="draft"|"building"|"preview"|"rejected"|"approved"|"deploying"|"deployed"|"failed";
export const transitions:Readonly<Record<ReleaseState,readonly ReleaseState[]>>={
 draft:["building"],building:["preview","failed"],preview:["approved","rejected"],
 rejected:[],approved:["deploying"],deploying:["deployed","failed"],deployed:[],failed:[]
};
export const sha256Valid=(digest:string)=>/^[0-9a-f]{64}$/i.test(digest);
export function canTransition(from:ReleaseState,to:ReleaseState):boolean{
 return transitions[from]?.includes(to)??false;
}
export interface ReleaseApproval{
 releaseId:string;siteId:string;artifactSha256:string;
 approvedBy:string;approvedAt:string;
}
export function approveRelease(input:{
 releaseId:string;siteId:string;artifactSha256:string;state:ReleaseState;
 actorId:string;expectedSha256:string;now:string;
}):ReleaseApproval{
 if(input.state!=="preview")throw new Error("Only a previewed release can be approved");
 if(!sha256Valid(input.artifactSha256)||input.artifactSha256.toLowerCase()!==input.expectedSha256.toLowerCase())
  throw new Error("Artifact digest mismatch");
 if(!input.actorId.trim())throw new Error("Authenticated Owner required");
 return {releaseId:input.releaseId,siteId:input.siteId,artifactSha256:input.artifactSha256.toLowerCase(),approvedBy:input.actorId,approvedAt:input.now};
}
