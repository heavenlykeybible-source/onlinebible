/* Only reposition the existing approved assistant and radio launchers above the President's photo. */
(function(){
'use strict';
const style=document.createElement('style');
style.textContent=`
.president-photo{position:relative!important;overflow:visible!important}
.president-photo .hk-president-controls{position:absolute;left:50%;bottom:100%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;width:min(100%,260px);z-index:30}
.president-photo .hk-president-controls #hkem-assistant,.president-photo .hk-president-controls #hk-floating-radio{position:relative!important;inset:auto!important;top:auto!important;bottom:auto!important;left:auto!important;right:auto!important;margin:0!important;width:100%!important;transform:none!important}
.president-photo .hk-president-controls #hkem-assistant .hkem-launcher,.president-photo .hk-president-controls #hk-floating-radio.hkr-mini .hkr-bubble{width:100%!important;max-width:100%!important}
.president-photo .hk-president-controls #hk-floating-radio.hkr-mini .hkr-bubble{animation:none!important}
.president-photo .hk-president-controls #hk-floating-radio.hkr-mini .hkr-bubble::before{animation:none!important}
.president-photo .hk-president-controls #hk-floating-radio.hkr-mini .hkr-bubble::after{background:transparent!important;color:#fff!important;border:0!important}
.president-photo .hk-president-controls #hk-floating-radio.hkr-mini .hkr-bubble::after{content:"FAITH OF OUR FATHERS RADIO\\A LIVE • Listen Now"!important;white-space:pre-line!important}
.president-photo .hk-president-controls #hk-floating-radio.hkr-mini .hkr-bubble{position:relative!important;padding-right:22px!important}
.president-photo .hk-president-controls #hk-floating-radio.hkr-mini .hkr-bubble::after{padding-right:3px!important}
.president-photo .hk-president-controls #hk-floating-radio.hkr-mini .hkr-bubble{background-image:radial-gradient(circle at calc(100% - 12px) 13px,#ff2929 0 5px,transparent 5.5px),linear-gradient(115deg,#006f3d,#004a31 65%,#002f29)!important;background-repeat:no-repeat!important}
@media(prefers-reduced-motion:no-preference){.president-photo .hk-president-controls #hk-floating-radio.hkr-mini .hkr-bubble{animation:hk-radio-live-indicator 1.1s step-end infinite!important}@keyframes hk-radio-live-indicator{0%,100%{background-image:radial-gradient(circle at calc(100% - 12px) 13px,#ff2929 0 5px,transparent 5.5px),linear-gradient(115deg,#006f3d,#004a31 65%,#002f29)}50%{background-image:radial-gradient(circle at calc(100% - 12px) 13px,transparent 0 5px,transparent 5.5px),linear-gradient(115deg,#006f3d,#004a31 65%,#002f29)}}}
.president-photo .hk-president-controls #hk-floating-radio.hkr-mini .hkr-bubble{--hk-live:#ff2424}
.president-photo .hk-president-controls #hk-floating-radio.hkr-mini .hkr-bubble::selection{background:transparent}
@media(max-width:600px){.president-photo .hk-president-controls{width:min(88%,225px);gap:6px}}
`;
document.head.appendChild(style);
function mount(){
 const photo=document.querySelector('.president-section .president-photo');
 const assistant=document.getElementById('hkem-assistant');
 const radio=document.getElementById('hk-floating-radio');
 if(!photo||!assistant||!radio)return false;
 let holder=photo.querySelector('.hk-president-controls');
 if(!holder){holder=document.createElement('div');holder.className='hk-president-controls';holder.setAttribute('aria-label','Online Assistant and Faith of Our Fathers Radio');photo.prepend(holder);}
 if(assistant.parentElement!==holder)holder.appendChild(assistant);
 if(radio.parentElement!==holder)holder.appendChild(radio);
 return true;
}
if(!mount()){const watcher=new MutationObserver(()=>{if(mount())watcher.disconnect()});watcher.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('load',mount,{once:true});}
})();