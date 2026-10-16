/* Visitor-controlled AI and Radio sizes; changes stay on this device. */
(function(){
'use strict';
const css=document.createElement('style');
css.textContent=`
.hk-president-controls{width:min(100%,var(--hk-controls-width,160px))!important}
.hk-size-row{display:flex;align-items:center;justify-content:center;gap:5px;width:100%;position:relative;z-index:5}
.hk-size-row button{font:700 13px/1 Arial,sans-serif;min-width:32px;min-height:32px;border:1px solid #b78a24;border-radius:16px;background:#fff9e9;color:#15432d;cursor:pointer;box-shadow:0 2px 6px #0002}
.hk-size-row button:focus-visible{outline:3px solid #2865dc;outline-offset:2px}
.hk-size-row .hk-size-label{font:700 12px Arial,sans-serif;color:#18412c;background:#fff9e9;border-radius:8px;padding:5px}
.hk-president-controls .hk-size-group{width:100%;display:flex;flex-direction:column;align-items:center;gap:3px}
.hk-president-controls #hkem-assistant .hkem-launcher,.hk-president-controls #hk-floating-radio.hkr-mini .hkr-bubble{width:var(--hk-launch-width,100%)!important;max-width:100%!important}
#hk-floating-radio:not(.hkr-mini):not(.hkr-closed){width:min(var(--hk-radio-player-width,370px),calc(100vw - 16px))!important}
#hkem-assistant .hkem-iphone-chat{width:min(var(--hk-ai-panel-width,355px),calc(100vw - 14px))!important}
@media(max-width:600px){.hk-president-controls{width:min(52vw,var(--hk-controls-width,160px))!important}}
`;
document.head.appendChild(css);
const ranges={ai:[100,130,160,180],radio:[100,130,160,180]};
function read(key,def){try{const n=Number(localStorage.getItem('hk-size-'+key));return Number.isInteger(n)&&n>=0&&n<4?n:def}catch{return def}}
function save(key,n){try{localStorage.setItem('hk-size-'+key,String(n))}catch{}}
function apply(){
 const holder=document.querySelector('.hk-president-controls');
 if(!holder)return;
 for(const key of ['ai','radio']){
  const root=document.getElementById(key==='ai'?'hkem-assistant':'hk-floating-radio');
  if(!root)continue;
  const width=ranges[key][read(key,2)];
  root.style.setProperty('--hk-launch-width',width+'px');
  root.style.setProperty(key==='ai'?'--hk-ai-panel-width':'--hk-radio-player-width',(key==='ai'?width+95:width+110)+'px');
 }
 const ai=ranges.ai[read('ai',2)],radio=ranges.radio[read('radio',2)];
 holder.style.setProperty('--hk-controls-width',Math.max(ai,radio)+'px');
}
function add(){
 const holder=document.querySelector('.hk-president-controls');
 if(!holder)return false;
 for(const [key,id,title] of [['ai','hkem-assistant','AI size'],['radio','hk-floating-radio','Radio size']]){
  const root=document.getElementById(id);
  if(!root)return false;
  let group=holder.querySelector('.hk-size-group[data-size-for="'+key+'"]');
  if(!group){
   group=document.createElement('div');group.className='hk-size-group';group.dataset.sizeFor=key;
   root.before(group);group.appendChild(root);
   const row=document.createElement('div');row.className='hk-size-row';
   const label=document.createElement('span');label.className='hk-size-label';label.textContent=title;
   const minus=document.createElement('button');minus.type='button';minus.textContent='−';minus.setAttribute('aria-label','Make '+title+' smaller');
   const plus=document.createElement('button');plus.type='button';plus.textContent='+';plus.setAttribute('aria-label','Make '+title+' larger');
   const reset=document.createElement('button');reset.type='button';reset.textContent='↺';reset.setAttribute('aria-label','Reset '+title);
   const change=delta=>{save(key,Math.max(0,Math.min(3,read(key,2)+delta)));apply()};
   minus.addEventListener('click',()=>change(-1));plus.addEventListener('click',()=>change(1));
   reset.addEventListener('click',()=>{save(key,2);apply()});
   row.append(label,minus,plus,reset);group.append(row);
  }
 }
 apply();return true;
}
if(!add()){
 const observer=new MutationObserver(()=>{if(add())observer.disconnect()});
 observer.observe(document.documentElement,{childList:true,subtree:true});
 window.addEventListener('load',add,{once:true});
}
})();