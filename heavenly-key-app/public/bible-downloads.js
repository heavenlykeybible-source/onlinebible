/* Book-by-book, opt-in offline saving. Keeps the same cache used by the reader. */
const CACHE='hk-kjv-opt-in-books-v1';
const list=document.getElementById('bible-download-list');
const status=document.getElementById('bible-download-status');
const say=text=>{status.textContent=text;};
const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
function validBook(data,book){return data?.book===book.name&&Array.isArray(data.chapters)&&data.chapters.length===book.chapters&&data.chapters.every(ch=>Array.isArray(ch)&&ch.length>0&&ch.every(v=>typeof v==='string'&&v.trim()));}
async function isSaved(book){if(!('caches'in window))return false;const cache=await caches.open(CACHE);return Boolean(await cache.match(new URL(book.path,location.href).href));}
async function renderBook(book){
 const card=el('article',undefined,'bible-download-card');
 const details=el('div',undefined,'bible-download-details');
 details.append(el('strong',book.name),el('small',book.testament+' · '+book.chapters+' chapters'));
 const actions=el('div',undefined,'bible-download-actions');
 const save=el('button','Save offline','btn secondary');save.type='button';
 const remove=el('button','Remove copy','btn secondary');remove.type='button';
 const refresh=async()=>{const saved=await isSaved(book);save.disabled=saved;save.textContent=saved?'Saved on this device':'Save offline';remove.disabled=!saved;};
 save.addEventListener('click',async()=>{
  save.disabled=true;
  try{
   const url=new URL(book.path,location.href);
   const response=await fetch(url.href,{credentials:'same-origin'});
   if(!response.ok)throw Error('The book could not be downloaded.');
   const data=await response.clone().json();
   if(!validBook(data,book))throw Error('The downloaded book did not pass its integrity check.');
   const cache=await caches.open(CACHE);await cache.put(url.href,response);
   await refresh();say(book.name+' is saved for offline reading.');
  }catch(error){save.disabled=false;say(error.message||'Download failed. Check your connection and try again.');}
 });
 remove.addEventListener('click',async()=>{
  remove.disabled=true;
  try{const cache=await caches.open(CACHE);await cache.delete(new URL(book.path,location.href).href);await refresh();say('Offline copy of '+book.name+' removed from this device.');}
  catch{remove.disabled=false;say('Could not remove the offline copy.');}
 });
 actions.append(save,remove);card.append(details,actions);list.append(card);await refresh();
}
try{
 const response=await fetch('kjv-manifest.json');
 if(!response.ok)throw Error('The KJV catalogue is unavailable. Reconnect and reload this page.');
 const manifest=await response.json();
 if(!Array.isArray(manifest.books)||manifest.books.length!==66)throw Error('The KJV catalogue did not pass its integrity check.');
 for(const book of manifest.books)await renderBook(book);
 say('Choose the books you want saved. Existing offline copies are preserved.');
}catch(error){say(error.message||'Could not load the Bible book list.');}
