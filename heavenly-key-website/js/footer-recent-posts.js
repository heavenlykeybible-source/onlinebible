/* Unified website footer: first-party blog first, legacy Blogger feed only during migration. */
(function(){
 'use strict';
 const root=document.getElementById('hk-footer-recent-posts');if(!root)return;
 const API='https://api.heavenlykey.org';
 function el(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;}
 async function main(){
  try{
   const r=await fetch(API+'/api/blog/posts?limit=3',{headers:{Accept:'application/json'}});
   if(!r.ok)throw Error();const data=await r.json();
   if(Array.isArray(data.items)&&data.items.length){root.replaceChildren();for(const p of data.items){const a=el('a',p.title||'Ministry message');a.href='blog/article.html?slug='+encodeURIComponent(p.slug||'');root.append(a)}return}
  }catch(_){}
  const cb='hkFooterLegacy_'+Date.now()+'_'+Math.floor(Math.random()*100000),script=document.createElement('script');let done=false;
  function finish(){if(done)return;done=true;script.remove();try{delete window[cb]}catch(_){window[cb]=undefined}}
  const timer=setTimeout(()=>{finish();if(!root.childNodes.length)root.append(el('p','Visit our ministry blog for recent messages.'))},6500);
  window[cb]=data=>{if(done)return;clearTimeout(timer);root.replaceChildren();const entries=(data&&data.feed&&data.feed.entry)||[];let count=0;for(const p of entries){const item=(p.link||[]).find(x=>x&&x.rel==='alternate'&&x.href);if(!item)continue;try{const u=new URL(item.href);if(u.protocol!=='https:'||!['blog.heavenlykey.org','www.blog.heavenlykey.org'].includes(u.hostname.toLowerCase()))continue;const a=el('a',(p.title&&p.title.$t)||'Ministry message');a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';root.append(a);if(++count===3)break}catch(_){}}if(!count)root.append(el('p','Visit our ministry blog for recent messages.'));finish()};
  script.async=true;script.onerror=()=>{clearTimeout(timer);finish()};script.src='https://blog.heavenlykey.org/feeds/posts/default?alt=json-in-script&max-results=3&callback='+encodeURIComponent(cb);document.head.append(script);
 }
 main();
})();