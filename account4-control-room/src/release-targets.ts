/** Public presentation releases only. Backend routes and persistent services stay in place. */
export const RELEASE_TARGETS={
 talkmoney:{site:"talkmoney",label:"Talk Money · Website, community & apps",host:"talkmoney.africa",scope:"/",source:"talkmoney-public",entry:"/index.html"},
 account1:{site:'account1',label:'Account 1 · Main website',host:'heavenlykey.org',scope:'/',source:'heavenly-key-website',entry:'/index.html'},
 account2:{site:'account2',label:'Account 2 · Studio',host:'studio.heavenlykey.org',scope:'/',source:'heavenly-key-website',entry:'/pages/admin.html'},
 account3:{site:'account3',label:'Account 3 · Community',host:'global.heavenlykey.org',scope:'/',source:'global-community/public',entry:'/index.html'},
 account4:{site:'account4',label:'Account 4 · Control Room',host:'control.heavenlykey.org',scope:'/',source:'account4-control-room/public',entry:'/index.html'},
 account5:{site:'account5',label:'Account 5 · Main app',host:'app.heavenlykey.org',scope:'/',source:'heavenly-key-app/public',entry:'/index.html'},
 account6:{site:'account6',label:'Account 6 · Bible',host:'bible.heavenlykey.org',scope:'/',source:'bible/public',entry:'/index.html'},
 'app-bible':{site:'account1',label:'Bible app',host:'heavenlykey.org',scope:'/pages/apps/bible/',source:'heavenly-key-website',overlaySource:'public-apps/bible',entry:'/pages/apps/bible/index.html'},
 'app-community':{site:'account1',label:'Community app',host:'heavenlykey.org',scope:'/pages/apps/community/',source:'heavenly-key-website',overlaySource:'public-apps/community',entry:'/pages/apps/community/index.html'},
 'app-radio':{site:'account1',label:'Radio app',host:'heavenlykey.org',scope:'/pages/apps/radio/',source:'heavenly-key-website',overlaySource:'public-apps/radio',entry:'/pages/apps/radio/index.html'},
 'app-study':{site:'account1',label:'Bible study app',host:'heavenlykey.org',scope:'/pages/apps/study/',source:'heavenly-key-website',overlaySource:'public-apps/study',entry:'/pages/apps/study/index.html'},
 'app-walk':{site:'account1',label:'My Walk with God app',host:'heavenlykey.org',scope:'/pages/apps/walk/',source:'heavenly-key-website',overlaySource:'public-apps/walk',entry:'/pages/apps/walk/index.html'}
} as const;
export type ReleaseTarget=keyof typeof RELEASE_TARGETS;
export function releaseTarget(value:unknown):ReleaseTarget{
 if(typeof value!=='string'||!Object.hasOwn(RELEASE_TARGETS,value))throw Object.assign(Error('Unknown website or app.'),{status:400});return value as ReleaseTarget;
}
export function publicPath(raw:string){
 if(raw.length>600||!raw.startsWith('/')||/[\u0000-\u001f\\?#%<>:"'`|*]/.test(raw)||raw.includes('//')||raw.split('/').some(p=>p==='.'||p==='..'||p.startsWith('.'))||/\.(?:sql|sqlite|db|toml|ya?ml|map|ts|tsx|pem|key|env)$/i.test(raw)||/(?:^|\/)(?:AGENTS\.md|node_modules|migrations|secrets?|credentials?)(?:\/|$)/i.test(raw))throw Object.assign(Error('Only public website assets may be submitted.'),{status:400});return raw;
}
export function protectedRoute(path:string){return /^\/(?:security(?:\/|$)|account-security(?:\/|$)|api(?:\/|$)|auth(?:\/|$)|oauth(?:\/|$)|health(?:\/|$)|metrics(?:\/|$)|\.well-known(?:\/|$)|cdn-cgi(?:\/|$))/.test(path)}
export function targetsFor(host:string,path:string){
 host=host.startsWith('www.')&&Object.values(RELEASE_TARGETS).some(t=>t.host===host.slice(4))?host.slice(4):host;
 return (Object.entries(RELEASE_TARGETS) as [ReleaseTarget,typeof RELEASE_TARGETS[ReleaseTarget]][]).filter(([,t])=>t.host===host&&(t.scope==='/'||path===t.scope.slice(0,-1)||path.startsWith(t.scope))).sort((a,b)=>b[1].scope.length-a[1].scope.length).map(([id])=>id);
}
