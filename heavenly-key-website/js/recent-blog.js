/* Unified blog preview: prefer first-party published articles, with legacy Blogger as a temporary fallback. */
(function(){
 'use strict';
 const root=document.getElementById('hk-recent-posts');if(!root)return;
 const fallback=document.getElementById('hk-blog-fallback');
 const API='https://api.heavenlykey.org';
 function node(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
 function internalCard(post){
  const url='blog/article.html?slug='+encodeURIComponent(String(post.slug||''));
  const card=node('article',null,'hk-blog-card'),thumb=node('div','HK','hk-blog-thumb'),body=node('div',null,'hk-blog-card-body');
  card.append(thumb,body);
  if(post.published_at){const d=new Date(post.published_at);if(!isNaN(d.getTime()))body.append(node('span',d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}),'hk-blog-date'));}
  const h=node('h3',post.title||'Latest ministry message');body.append(h);
  if(post.excerpt)body.append(node('p',String(post.excerpt).slice(0,125)+(String(post.excerpt).length>125?'…':'')));
  const link=node('a','Read More →','hk-blog-read');link.href=url;body.append(link);return card;
 }
 function renderInternal(items){root.replaceChildren(...items.slice(0,5).map(internalCard));if(fallback)fallback.hidden=true;}
 function safeLegacyUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&['blog.heavenlykey.org','www.blog.heavenlykey.org'].includes(u.hostname.toLowerCase())?u.href:null}catch{return null}}
 function plain(value){const box=document.createElement('div');box.innerHTML=String(value||'');return (box.textContent||'').replace(/\\s+/g,' ').trim();}
 function legacy(){
  const cb='hkRecentLegacy_'+Date.now()+'_'+Math.floor(Math.random()*100000),script=document.createElement('script');let done=false;
  const timer=setTimeout(fail,6500);
  function cleanup(){clearTimeout(timer);script.onerror=null;script.remove();try{delete window[cb]}catch(_){window[cb]=undefined}}
  function fail(){if(done)return;done=true;cleanup();if(!root.childNodes.length){root.replaceChildren(node('p','Recent posts are temporarily unavailable.','hk-blog-status'));if(fallback)fallback.hidden=false}}
  window[cb]=data=>{if(done)return;const entries=(data&&data.feed&&data.feed.entry)||[],cards=[];for(const p of entries){const a=(p.link||[]).find(x=>x&&x.rel==='alternate'&&x.href),url=a&&safeLegacyUrl(a.href);if(!url)continue;const card=node('article',null,'hk-blog-card'),body=node('div',null,'hk-blog-card-body'),title=plain(p.title&&p.title.$t)||'Ministry message';body.append(node('h3',title));const link=node('a','Read More →','hk-blog-read');link.href=url;link.target='_blank';link.rel='noopener noreferrer';body.append(link);card.append(body);cards.push(card);if(cards.length===5)break}if(cards.length)root.replaceChildren(...cards);else fail();done=true;cleanup()};
  script.async=true;script.onerror=fail;script.src='https://blog.heavenlykey.org/feeds/posts/default?alt=json-in-script&max-results=5&callback='+encodeURIComponent(cb);document.head.append(script);
 }
 fetch(API+'/api/blog/posts?limit=5',{headers:{Accept:'application/json'}}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{if(Array.isArray(data.items)&&data.items.length)renderInternal(data.items);else legacy()}).catch(legacy);
})();