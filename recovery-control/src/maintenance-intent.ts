import {REPAIR_SCOPES,type RepairScope} from './repair-scopes';

export type MaintenancePlan={account:'1'|'2'|'3';repairScope:string;label:string;confidence:'high'|'medium';instruction:string;matched:string[];requiresClarification:false}|{requiresClarification:true;instruction:string;candidates:Array<{account:string;repairScope:string;label:string}>};

const NORMALIZE=(s:string)=>s.toLowerCase().replace(/[^a-z0-9/ +.-]+/g,' ').replace(/\s+/g,' ').trim();
const aliases:Record<string,string[]>={
 'website-ui':['website','home page','homepage','navigation','public player','page design','footer'],
 'broadcast-control':['broadcast control','broadcast api','player bridge'],
 'social-publishing':['auto post','autopost','social post','scheduled post','campaign publishing','social connection'],
 'media-247':['247 radio','24/7 radio','247 video','24/7 video','radio webcast','video webcast','playlist','playout','programme playback','no sound'],
 'media-live':['go live','livekit','live stream','livestream','camera live','viewer token','publisher'],
 'media-restream':['restream','rtmp','social live','stream key','youtube live','facebook live','tiktok live'],
 'media-studio':['online studio','studio','mixer','scene','microphone','mic','audio mixer'],
 'media-upload':['media upload','upload video','upload audio','2gb','resumable upload','media library'],
 'community-feed':['community feed','feed','post feed','endless scrolling','reaction'],
 'community-messaging':['message','messaging','chat','notification','call','messenger'],
 'community-groups':['space','spaces','group','groups','membership'],
 'community-ai':['heavenly key assistant','assistant','community ai','ai chat'],
 'community-adverts':['advert','adverts','advertisement','sponsored']
};
function terms(scope:RepairScope){return [...scope.hints,...(aliases[scope.id]||[])].map(NORMALIZE).filter(Boolean);}
export function planMaintenanceInstruction(raw:string):MaintenancePlan{
 const instruction=String(raw||'').trim();const text=NORMALIZE(instruction);
 if(instruction.length<4||instruction.length>2000)return {requiresClarification:true,instruction,candidates:[]};
 const scored=REPAIR_SCOPES.map(scope=>{const matched=terms(scope).filter(t=>text.includes(t));return {scope,matched,score:matched.reduce((n,t)=>n+Math.max(1,Math.min(6,t.split(' ').length)),0)};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
 if(!scored.length)return {requiresClarification:true,instruction,candidates:[]};
 const best=scored[0],second=scored[1];
 if(second&&second.score===best.score&&second.scope.id!==best.scope.id)return {requiresClarification:true,instruction,candidates:scored.slice(0,4).map(x=>({account:x.scope.account,repairScope:x.scope.id,label:x.scope.label}))};
 return {requiresClarification:false,account:best.scope.account,repairScope:best.scope.id,label:best.scope.label,confidence:best.score>=3?'high':'medium',instruction,matched:best.matched.slice(0,8)};
}
