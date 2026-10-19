/* One registry owns the showcase, workspace, share links, manifests and QR destinations. */
(()=>{'use strict';
const origin='https://heavenlykey.org';
const apps=[
 {id:'all',name:'Heavenly Key All-in-One',short:'All-in-One',tag:'Your ministry world, together.',description:'All Heavenly Key apps in one place. Read, pray, connect, listen and grow — choose an app whenever you need it.',url:'/pages/app-suite.html',color:'#075e46',symbol:'HK'},
 {id:'main',name:'Heavenly Key Main Website',short:'Ministry Website',tag:'Taking Christ to the nations.',description:'Explore the ministry, messages, programmes and opportunities to partner in the Gospel.',url:'/?app-view=1',color:'#087348',symbol:'HK'},
 {id:'community',name:'Global Christian Community',short:'Christian Community',tag:'One faith. One global family.',description:'Connect with believers through posts, groups, spaces, pages and text conversations.',url:'https://global.heavenlykey.org/',color:'#7b284d',symbol:'GC'},
 {id:'radio',name:'Heavenly Key Radio',short:'Online Radio',tag:'Jesus only is our message.',description:'Listen to the ministry’s online radio. Keep listening while you explore another app.',url:'/pages/app-radio.html',color:'#8b1623',symbol:'ON AIR'},
 {id:'bible',name:'Heavenly Key Bible',short:'KJV Bible',tag:'The Word of God, with you.',description:'Read the King James Version, search Scripture and continue your Bible study.',url:'https://app.heavenlykey.org/bible.html',color:'#1f4290',symbol:'KJV'},
 {id:'study',name:'Bible Study Portal',short:'Bible Study',tag:'From Creation to Eternity.',description:'Explore the reviewed Bible study lessons and continue your learning journey.',url:'https://app.heavenlykey.org/creation-to-eternity.html',color:'#594093',symbol:'STUDY'},
 {id:'walk',name:'My Walk with God Calculator',short:'My Walk with God',tag:'Reflect. Pray. Grow.',description:'Use your personal reflection tools, goals and private notebook for spiritual growth.',url:'https://app.heavenlykey.org/walk-offline.html',color:'#176b76',symbol:'GROW'},
 {id:'grdpc',name:'Global Revival & Destiny Prayer Cry',short:'GRDPC & Reminders',tag:'Lord, revival now!',description:'Find prayer programme information, reminder options and links to join the broadcast.',url:'/pages/grdpc.html?app-view=1',color:'#78334d',symbol:'PRAY'},
 {id:'assistant',name:'Heavenly Key Online Assistant',short:'Online Assistant',tag:'Together we take Christ to the nations.',description:'Ask a question, explore KJV-based guidance and discover Heavenly Key ministry resources.',url:'/pages/app-assistant.html',color:'#2450c8',symbol:'ASK'},
 {id:'blog',name:'Heavenly Key Blog',short:'Ministry Blog',tag:'Messages that build your faith.',description:'Read ministry articles, teachings, announcements and encouragement.',url:'/pages/app-blog.html',color:'#9b512b',symbol:'READ'}
].map(app=>Object.freeze(app));
const devices=Object.freeze([
 {id:'android',name:'Android phone',label:'Download on Android',steps:'Open the app in Chrome or Samsung Internet. Choose Install app or Add to Home screen from the browser menu.'},
 {id:'iphone',name:'iPhone',label:'Download on iPhone',steps:'Open the app in Safari. Tap Share, then Add to Home Screen. Enable Open as Web App if offered, then tap Add.'},
 {id:'android-tablet',name:'Android tablet',label:'Download on Android tablet',steps:'Open the app in Chrome or Samsung Internet on your tablet. Choose Install app or Add to Home screen in the browser menu.'},
 {id:'ipad',name:'iPad',label:'Download on iPad',steps:'Open the app in Safari on your iPad. Tap Share, choose Add to Home Screen, then tap Add.'},
 {id:'windows',name:'Windows computer',label:'Download on Windows',steps:'Open the app in Microsoft Edge or Chrome. Choose Install this site as an app or Install from the browser menu.'},
 {id:'mac',name:'Mac computer',label:'Download on Mac',steps:'Open the app in Safari and choose File → Add to Dock, or use the Install option in Chrome.'},
 {id:'linux',name:'Linux computer',label:'Download on Linux',steps:'Open the app in Chrome or a browser supporting web app installation. Use Install from the browser menu when offered.'}
]);
const get=id=>apps.find(app=>app.id===id)||null;
function shareURL(id){if(!get(id))throw Error('Unknown app');const url=new URL('/pages/app.html',origin);url.searchParams.set('app',id);return url.href}
function installURL(id,device){if(!get(id)||!devices.some(item=>item.id===device))throw Error('Unknown installation');const url=new URL('/pages/apps/'+id+'/',origin);url.searchParams.set('install',device);return url.href}
globalThis.HKApps=Object.freeze({apps:Object.freeze(apps),devices,get,shareURL,installURL,origin});
})();
