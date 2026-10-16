/* Installed and browser readers use the same approved release. No private data is changed. */
(()=>{'use strict';
 if(!('serviceWorker' in navigator))return;
 const box=document.createElement('aside');box.className='panel';box.hidden=true;box.setAttribute('role','status');box.setAttribute('aria-live','polite');
 const text=document.createElement('p'),button=document.createElement('button');button.type='button';box.append(text,button);document.body.prepend(box);
 let applying=false,registration,controlled=!!navigator.serviceWorker.controller;
 function show(waiting){box.hidden=false;text.textContent=waiting?'A new Bible update is ready. Save any unfinished study note, then update. Your saved notes and reading progress stay in place.':'The Bible has updated. Save any unfinished study note, then refresh to use the new version.';button.textContent=waiting?'Update now':'Refresh Bible';button.onclick=()=>{if(registration?.waiting){applying=true;button.disabled=true;registration.waiting.postMessage({type:'ACTIVATE_BIBLE_UPDATE'});}else location.reload();};}
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!controlled){controlled=true;return;}if(applying)location.reload();else show(false);});
 navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(r=>{
  registration=r;if(r.waiting)show(true);
  const watch=()=>{const worker=r.installing;if(worker)worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)show(true);});};
  r.addEventListener('updatefound',watch);watch();
  const check=()=>{if(navigator.onLine!==false)r.update().catch(()=>{});};
  window.addEventListener('online',check);document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});setInterval(check,15*60*1000);check();
 }).catch(()=>{});
})();
