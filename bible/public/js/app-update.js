/* Silent public Bible updates: never interrupt a reading session or discard notes. */
(()=>{'use strict';if(!('serviceWorker'in navigator))return;let checked=0;
async function check(){if(document.hidden||navigator.onLine===false||Date.now()-checked<60000)return;checked=Date.now();try{const reg=await navigator.serviceWorker.ready;await reg.update();reg.waiting?.postMessage({type:'ACTIVATE_REVIEWED_SHELL'})}catch{}}
window.addEventListener('load',check,{once:true});window.addEventListener('online',check);window.addEventListener('pageshow',check);document.addEventListener('visibilitychange',check);
})();
