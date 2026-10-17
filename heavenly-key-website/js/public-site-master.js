/* HKEM unified public AI and Radio loader. Does not alter approved header/footer. */
(function(){'use strict';
if(window.__hkUnifiedMediaLoaded)return;window.__hkUnifiedMediaLoaded=true;
const radioPage=/\/pages\/radio\.html$/i.test(location.pathname);
const adminPage=/\/pages\/admin\.html$/i.test(location.pathname);
function script(src,id){if(document.getElementById(id))return;const e=document.createElement('script');e.id=id;e.src=src;e.defer=true;document.head.appendChild(e)}
function style(src,id){if(document.getElementById(id))return;const e=document.createElement('link');e.id=id;e.rel='stylesheet';e.href=src;document.head.appendChild(e)}
function init(){
if(adminPage)return;
style('/css/online-assistant.css?v=unified-20261018','hk-unified-assistant-style');
style('/css/unified-ai-radio.css?v=unified-20261018','hk-unified-media-style');
script('/js/online-assistant.js?v=unified-20261018','hk-unified-assistant');
if(!radioPage)script('/js/approved-widget-system.js?v=unified-20261018','hk-unified-radio');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();