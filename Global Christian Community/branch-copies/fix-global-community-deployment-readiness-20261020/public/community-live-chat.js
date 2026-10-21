/* Enhance the existing messenger; app.js owns sessions, requests, retries and polling. */
(()=>{
 'use strict';
 const root=document.getElementById('page-root');
 if(!root)return;
 const histories=new WeakMap();
 let toastTimer=null,queued=false;
 function notify(){
  document.querySelector('.community-chat-toast')?.remove();
  const toast=document.createElement('div');
  toast.className='community-chat-toast';
  toast.setAttribute('role','status');
  toast.textContent='New fellowship message received';
  document.body.append(toast);
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.remove(),3500);
 }
 function inspect(){
  queued=false;
  if(document.body.dataset.page!=='messages')return;
  for(const history of root.querySelectorAll('.chat-history')){
   const previous=histories.get(history);
   const messages=[...history.querySelectorAll('.message-bubble[data-message-id]')];
   if(!history.dataset.rendered)continue;
   const newest=Math.max(0,...messages.map(message=>Number(message.dataset.messageId)||0));
   // The first snapshot is history, not a new-message notification.
   if(previous!==undefined&&messages.some(message=>message.classList.contains('received')&&Number(message.dataset.messageId)>previous))notify();
   histories.set(history,Math.max(previous||0,newest));
  }
 }
 const observer=new MutationObserver(()=>{
  if(queued)return;
  queued=true;
  queueMicrotask(inspect);
 });
 observer.observe(root,{childList:true,subtree:true});
 inspect();
 window.addEventListener('pagehide',()=>{observer.disconnect();clearTimeout(toastTimer);document.querySelector('.community-chat-toast')?.remove();});
 window.addEventListener('pageshow',()=>{observer.observe(root,{childList:true,subtree:true});inspect();});
})();
