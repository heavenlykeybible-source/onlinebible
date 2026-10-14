export type RepairAccount='1'|'2'|'3';
export type RepairScope={id:string;account:RepairAccount;label:string;roots:string[];hints:string[]};

/**
 * Stable feature map for surgical maintenance. This is descriptive authorization
 * metadata; Account 4 core/security remains outside every ordinary repair scope.
 */
export const REPAIR_SCOPES:ReadonlyArray<RepairScope>=[
 {id:'website-ui',account:'1',label:'Main website interface',roots:['heavenly-key-website/'],hints:['pages','navigation','visual presentation','public player']},
 {id:'broadcast-control',account:'1',label:'Broadcast command/control API',roots:['src/routes/broadcast.ts','src/services/broadcast-service.ts','src/routes/community-player.ts','src/services/integrations/media-engine-proxy.ts'],hints:['24/7 control','live session control','player bridge']},
 {id:'social-publishing',account:'1',label:'Social connections and auto publishing',roots:['src/routes/social-accounts.ts','src/services/social-accounts-service.ts','src/routes/campaign-manager.ts','src/services/campaign-manager-service.ts','src/routes/communications.ts','heavenly-key-website/js/communications-admin.js'],hints:['auto post','scheduled post','social account selection','campaign publishing']},
 {id:'media-247',account:'2',label:'24/7 Radio and Video Webcast',roots:['media-engine/src/index.ts','media-engine/src/public-broadcast.ts'],hints:['playlist','playout','radio','video webcast','programme playback']},
 {id:'media-live',account:'2',label:'Go Live and LiveKit transport',roots:['media-engine/src/index.ts','media-engine/src/livekit.ts','media-engine/src/livekit-config.ts'],hints:['go live','publisher','viewer','live transport']},
 {id:'media-restream',account:'2',label:'Social live distribution',roots:['media-engine/src/restream.ts','media-engine/src/index.ts'],hints:['YouTube','Facebook','TikTok','RTMP','restream']},
 {id:'media-studio',account:'2',label:'Online Studio',roots:['media-engine/src/studio/','media-engine/src/index.ts'],hints:['mixer','audio','video','scene','studio controls']},
 {id:'media-upload',account:'2',label:'Media uploads',roots:['media-engine/src/uploads.ts','media-engine/src/index.ts'],hints:['2 GB upload','resumable upload','media library']},
 {id:'community-feed',account:'3',label:'Community feed',roots:['global-community/src/services.ts','global-community/public/'],hints:['feed','posts','endless scrolling','reactions']},
 {id:'community-messaging',account:'3',label:'Community messaging and calls',roots:['global-community/src/calls.ts','global-community/src/services.ts','global-community/public/'],hints:['messenger','chat','notifications','calls']},
 {id:'community-groups',account:'3',label:'Spaces and Groups',roots:['global-community/src/services.ts','global-community/public/'],hints:['space','group','membership']},
 {id:'community-ai',account:'3',label:'Heavenly Key Assistant experience',roots:['global-community/src/heavenly-key-ai.ts','global-community/public/'],hints:['AI assistant','chat composer','prompts']},
 {id:'community-adverts',account:'3',label:'Community adverts',roots:['global-community/src/adverts.ts','global-community/public/'],hints:['adverts','campaign cards']}
] as const;

const NEVER_REPAIR=[
 'recovery-control/','.github/','migrations/','wrangler.toml','media-engine/wrangler.toml','global-community/wrangler.toml',
 'src/routes/auth.ts','src/services/auth-service.ts','src/middleware/session.ts','global-community/src/auth.ts','global-community/src/social-auth.ts'
];
export function repairScope(id:string,account:string){return REPAIR_SCOPES.find(s=>s.id===id&&s.account===account)||null;}
export function pathWithinRepairScope(path:string,scope:RepairScope){
 const p=path.replace(/\\/g,'/');
 if(NEVER_REPAIR.some(x=>p===x||p.startsWith(x)))return false;
 return scope.roots.some(root=>root.endsWith('/')?p.startsWith(root):p===root);
}
export function publicRepairCatalog(){return REPAIR_SCOPES.map(({id,account,label,hints})=>({id,account,label,hints}));}
