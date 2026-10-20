/** Candidate multi-connection routing plan for Account 4.
 * Does not open network connections or authorize actions.
 * Never accept a provider account ID, endpoint URL, or token from an AI agent request.
 * The owner-managed database registry is the only source of allowed destinations.
 */
export type Provider = "cloudflare" | "github" | "site-api";
export type ConnectionRole = "read" | "propose" | "preview" | "deploy";
export interface ConnectionRecord {
  id: string;
  site: string;
  provider: Provider;
  label: string;
  accountRef: string; // Cloudflare account ID, GitHub installation ID, or owner verified API identity
  resourceRef: string; // Worker name, owner/repository, or registered API name
  allowedRoles: ConnectionRole[];
  enabled: boolean;
  verified: boolean;
}
export interface ConnectionChoice { site: string; connectionId: string; operation: ConnectionRole }
const sitePattern = /^account(?:[1-3]|[5-6])$/;
const idPattern = /^[a-zA-Z0-9_-]{4,100}$/;
const identityPattern = /^[a-zA-Z0-9_.:\/-]{1,180}$/;
const roles: ConnectionRole[] = ["read", "propose", "preview", "deploy"];
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
export function validateConnection(record:unknown):ConnectionRecord {
  if (!isRecord(record)) throw Error("Invalid connection");
  const { id, site, provider, label, accountRef, resourceRef, allowedRoles, enabled, verified } = record;
  if (typeof id!=="string" || !idPattern.test(id)) throw Error("Invalid connection ID");
  if (typeof site!=="string" || !sitePattern.test(site)) throw Error("Protected or unknown site");
  if (!["cloudflare","github","site-api"].includes(String(provider))) throw Error("Unknown provider");
  if (typeof label!=="string" || label.length<1 || label.length>100) throw Error("Invalid label");
  if (typeof accountRef!=="string" || !identityPattern.test(accountRef) || typeof resourceRef!=="string" || !identityPattern.test(resourceRef)) throw Error("Invalid resource identity");
  if (!Array.isArray(allowedRoles) || allowedRoles.length===0 || !allowedRoles.every(x=>typeof x==="string" && roles.includes(x as ConnectionRole))) throw Error("Invalid roles");
  if (typeof enabled!=="boolean" || typeof verified!=="boolean") throw Error("Invalid status");
  return {id,site,provider:provider as Provider,label,accountRef,resourceRef,allowedRoles:allowedRoles as ConnectionRole[],enabled,verified};
}
/** Resolves a proposed action to exactly one owner-verified connection. This is NOT an authorization decision.
 * A deployed handler must additionally authenticate the user, check per-identity grant, owner approval,
 * rate limits and audit; reject any mismatch before contacting a provider.
 */
export function planConnectionChoice(choice:unknown, registry:readonly ConnectionRecord[]) {
  if (!isRecord(choice) || Object.keys(choice).some(k=>!["site","connectionId","operation"].includes(k)))
    throw Error("Unexpected routing parameters");
  const {site,connectionId,operation}=choice;
  if (typeof site!=="string" || !sitePattern.test(site) || typeof connectionId!=="string" || !idPattern.test(connectionId)
      || !roles.includes(operation as ConnectionRole)) throw Error("Invalid routing request");
  const matches=registry.filter(record=>record.id===connectionId && record.site===site);
  if (matches.length!==1) throw Error("Connection not found or ambiguous");
  const record=validateConnection(matches[0]);
  if (!record.enabled || !record.verified || !record.allowedRoles.includes(operation as ConnectionRole))
    throw Error("Connection not permitted");
  return {site:record.site,connectionId:record.id,provider:record.provider,
    accountRef:record.accountRef,resourceRef:record.resourceRef,operation,
    status:"plan_only" as const,executed:false,requiresOwnerApproval:operation==="deploy"};
}
