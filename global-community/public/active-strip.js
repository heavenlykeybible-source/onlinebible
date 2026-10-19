(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const api=async path=>{const r=await fetch(path,{credentials:'same-origin',headers:{Accept:'application/json'}});if(!r.ok)throw new Error('request');return r.json()};
const avatar=(name,src)=>{const wrap=document.createElement('span');wrap.className='member-avatar';wrap.setAttribute('role','img');wrap.setAttribute('aria-label',(name||'Connected member')+' profile picture');const img=document.createElement('img');img.alt='';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.src=(typeof src==='string'&&src.startsWith('/')&&!src.startsWith('//'))?src:'/assets/heavenly-key-permanent-default-avatar.png';img.onerror=()=>{img.src='/assets/default-human-avatar.svg'};wrap.append(img);return wrap};
async function mount(){
 const stream=$('.social-stream'),heading=stream?.querySelector('.stream-heading');if(!stream||!heading||$('.hk-active-section'))return;
 let me;try{me=await api('/api/me')}catch{return}
 if(!me?.user?.userId)return;
 const section=document.createElement('section');section.className='hk-active-section';section.setAttribute('aria-label','ACTIVE posts from your connections');
 const head=document.createElement('div');head.className='hk-active-head';const h=document.createElement('h2');h.textContent='ACTIVE';const manage=document.createElement('a');manage.href='profile.html';manage.textContent='ACTIVE settings';manage.className='hk-active-manage';head.append(h,manage);
 const note=document.createElement('p');note.className='hk-active-note';note.textContent='Recent activity from people you connect with.';
 const viewport=document.createElement('div');viewport.className='hk-active-viewport';const track=document.createElement('div');track.className='hk-active-track';viewport.append(track);section.append(head,note,viewport);heading.after(section);
 try{
  const [connections,feed]=await Promise.all([api('/api/global-connections/'+me.user.userId),api('/api/feed?connections=1')]);
  const ids=new Set((connections.items||[]).filter(x=>x.target_type==='profile').map(x=>Number(x.target_id))),seen=new Set(),posts=[];
  for(const p of feed.items||[]){const id=Number(p.author_user_id);if(!ids.has(id)||seen.has(id))continue;seen.add(id);posts.push(p);if(posts.length===15)break}
  if(!posts.length){const empty=document.createElement('p');empty.className='hk-active-empty';empty.textContent='Your connected friends’ recent activity will appear here.';track.append(empty);return}
  await Promise.all(posts.map(async p=>{let photo=p.profile_photo_url||p.avatar_url||p.profile_photo_key||'';try{const d=await api('/api/profiles/'+Number(p.author_user_id));photo=d.profile?.profilePhotoKey||photo}catch{}
   const link=document.createElement('a');link.className='hk-active-person';link.href='index.html?post='+encodeURIComponent(p.post_id);link.append(avatar(p.profile_name||'Connected member',photo));const name=document.createElement('strong');name.textContent=p.profile_name||'Connected member';const small=document.createElement('small');small.textContent='View post';link.append(name,small);track.append(link)}));
  if(track.children.length>3){for(const node of [...track.children]){const copy=node.cloneNode(true);copy.setAttribute('aria-hidden','true');copy.tabIndex=-1;track.append(copy)}track.classList.add('hk-active-moving')}
 }catch{const empty=document.createElement('p');empty.className='hk-active-empty';empty.textContent='ACTIVE is temporarily unavailable.';track.append(empty)}
}
window.addEventListener('DOMContentLoaded',()=>{let tries=0;const timer=setInterval(()=>{tries++;if($('.social-stream')){clearInterval(timer);mount()}else if(tries>40)clearInterval(timer)},100)});
})();
