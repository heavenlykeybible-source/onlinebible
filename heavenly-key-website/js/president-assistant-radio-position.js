/* Only reposition the existing approved assistant and radio launchers above the President's photo. */
(function(){
'use strict';
const style=document.createElement('style');
style.textContent=`
.president-photo{position:relative!important;overflow:visible!important}
.president-photo .hk-president-controls{position:absolute;right:0;top:0;left:auto;bottom:auto;transform:translateY(-100%);display:flex;flex-direction:column;align-items:center;gap:8px;width:min(100%,180px);z-index:30}
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
@media(max-width:600px){.president-photo .hk-president-controls{width:min(52vw,160px);gap:5px}}
`;
document.head.appendChild(style);

/* Apply approved artwork only after both uploaded image assets are available. */
const artwork=['/assets/ministry/approved-ai-floating-icon.webp','/assets/ministry/approved-radio-floating-icon.webp'];
Promise.all(artwork.map(src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src=src;}))).then(()=>{
 const css=document.createElement('style');
 css.textContent=`
 .president-photo .hk-president-controls #hkem-assistant .hkem-launcher{background:transparent url('/assets/ministry/approved-ai-floating-icon.webp') center/100% 100% no-repeat!important;border:0!important;border-radius:0!important;box-shadow:none!important;aspect-ratio:1485/348!important;height:auto!important;min-height:0!important;font-size:0!important;color:transparent!important}
 .president-photo .hk-president-controls #hk-floating-radio.hkr-mini .hkr-bubble{background:transparent url('/assets/ministry/approved-radio-floating-icon.webp') center/100% 100% no-repeat!important;border:0!important;border-radius:0!important;box-shadow:none!important;aspect-ratio:1485/317!important;height:auto!important;min-height:0!important;font-size:0!important;color:transparent!important;animation:none!important}
 .president-photo .hk-president-controls #hk-floating-radio.hkr-mini .hkr-bubble::before,.president-photo .hk-president-controls #hk-floating-radio.hkr-mini .hkr-bubble::after{content:none!important;animation:none!important}
 `;
 document.head.appendChild(css);
}).catch(()=>{});
/* Visual indicators are separate from the approved artwork. Radio bars move only while its audio is playing. */
const indicatorStyle=document.createElement('style');
indicatorStyle.textContent=`
.president-photo .hk-president-controls .hkem-launcher{position:relative!important}
.president-photo .hk-president-controls .hkem-launcher .hk-ai-signal{position:absolute;right:2%;top:7%;width:8px;height:8px;border-radius:50%;background:#ff3535;box-shadow:0 0 9px #ff3535;pointer-events:none;animation:hk-signal-blink 1.4s ease-in-out infinite}
.president-photo .hk-president-controls .hkr-bubble{position:relative!important}
.president-photo .hk-president-controls .hkr-bubble .hk-radio-signal{position:absolute;right:2%;top:7%;width:8px;height:8px;border-radius:50%;background:#ff3535;box-shadow:0 0 9px #ff3535;pointer-events:none;animation:hk-signal-blink 1.4s ease-in-out infinite}
.president-photo .hk-president-controls .hkr-bubble .hk-radio-bars{position:absolute;right:4%;bottom:10%;height:30%;width:14%;display:flex;gap:3px;align-items:flex-end;pointer-events:none}
.president-photo .hk-president-controls .hk-radio-bars i{display:block;flex:1;background:#ffe050;height:25%;border-radius:2px}
.president-photo .hk-president-controls .hk-radio-bars.hk-playing i{animation:hk-live-bars .65s ease-in-out infinite alternate}
.president-photo .hk-president-controls .hk-radio-bars.hk-playing i:nth-child(2){animation-delay:-.25s}
.president-photo .hk-president-controls .hk-radio-bars.hk-playing i:nth-child(3){animation-delay:-.43s}
.president-photo .hk-president-controls .hk-radio-bars.hk-playing i:nth-child(4){animation-delay:-.13s}
@keyframes hk-signal-blink{50%{opacity:.25;box-shadow:0 0 3px #ff3535}}
@keyframes hk-live-bars{from{height:15%}to{height:100%}}
@media(prefers-reduced-motion:reduce){.hk-ai-signal,.hk-radio-signal,.hk-radio-bars i{animation:none!important}}
`;
document.head.appendChild(indicatorStyle);
function mountIndicators(){
 const ai=document.querySelector('.president-photo .hk-president-controls .hkem-launcher');
 const radio=document.querySelector('.president-photo .hk-president-controls #hk-floating-radio');
 const bubble=radio?.querySelector('.hkr-bubble');
 if(ai&&!ai.querySelector('.hk-ai-signal')){const n=document.createElement('span');n.className='hk-ai-signal';n.setAttribute('aria-hidden','true');ai.appendChild(n)}
 if(bubble&&!bubble.querySelector('.hk-radio-signal')){const n=document.createElement('span');n.className='hk-radio-signal';n.setAttribute('aria-hidden','true');bubble.appendChild(n)}
 if(bubble&&!bubble.querySelector('.hk-radio-bars')){const bars=document.createElement('span');bars.className='hk-radio-bars';bars.setAttribute('aria-hidden','true');for(let i=0;i<4;i++)bars.appendChild(document.createElement('i'));bubble.appendChild(bars)}
 const bars=bubble?.querySelector('.hk-radio-bars');
 const audio=radio?.querySelector('audio');
 if(bars&&audio&&!audio.dataset.hkIndicatorBound){audio.dataset.hkIndicatorBound='1';let buffering=false;const sync=()=>bars.classList.toggle('hk-playing',!buffering&&!audio.paused&&!audio.ended&&audio.readyState>=HTMLMediaElement.HAVE_CURRENT_DATA&&!audio.error);['waiting','stalled','seeking','loadstart','emptied','error','abort','suspend'].forEach(event=>audio.addEventListener(event,()=>{buffering=true;sync()}));['playing','canplay','seeked'].forEach(event=>audio.addEventListener(event,()=>{buffering=false;sync()}));['pause','ended','volumechange'].forEach(event=>audio.addEventListener(event,sync));sync()}
}

function mount(){
 const photo=document.querySelector('.president-section .president-photo');
 const assistant=document.getElementById('hkem-assistant');
 const radio=document.getElementById('hk-floating-radio');
 if(!photo||!assistant||!radio)return false;
 let holder=photo.querySelector('.hk-president-controls');
 if(!holder){holder=document.createElement('div');holder.className='hk-president-controls';holder.setAttribute('aria-label','Online Assistant and Faith of Our Fathers Radio');photo.prepend(holder);}
 if(assistant.parentElement!==holder)holder.appendChild(assistant);
 if(radio.parentElement!==holder)holder.appendChild(radio);
 radio.classList.add('hkr-mini');
 mountIndicators();
 return true;
}
if(!mount()){const watcher=new MutationObserver(()=>{if(mount())watcher.disconnect()});watcher.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('load',mount,{once:true});}
})();