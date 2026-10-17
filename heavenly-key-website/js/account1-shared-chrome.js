/* Account 1 shared chrome: the homepage is the canonical menu/footer. */
(()=>{'use strict';
const path=location.pathname.toLowerCase();
const specialMenu=/\/(?:radio|admin|app|bible|studio|community)(?:[/.]|$)/.test(path)||/^(?:global|app|bible|radio|control|studio)\./.test(location.hostname);
const home=path==='/'||path.endsWith('/index.html');
if(home)return;
function style(url){if(document.querySelector('link[data-hk-shared="'+url+'"]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href=url;l.dataset.hkShared=url;document.head.appendChild(l);}
function absoluteLinks(node){node.querySelectorAll('[href]').forEach(a=>{const href=a.getAttribute('href');if(href&&!href.startsWith('#')&&!/^(?:[a-z]+:|\/\/)/i.test(href))a.href=new URL(href,'https://heavenlykey.org/').href;});node.querySelectorAll('[src]').forEach(a=>{const src=a.getAttribute('src');if(src&&!/^(?:[a-z]+:|\/\/|data:)/i.test(src))a.src=new URL(src,'https://heavenlykey.org/').href;});}
function initNav(nav){const menus=[...nav.querySelectorAll('details')];menus.forEach(menu=>menu.addEventListener('toggle',()=>{if(menu.open)menus.filter(m=>m!==menu).forEach(m=>m.open=false);}));document.addEventListener('click',e=>{if(!nav.contains(e.target))menus.forEach(m=>m.open=false)});document.addEventListener('keydown',e=>{if(e.key==='Escape')menus.forEach(m=>m.open=false)});}
async function apply(){let page;try{const r=await fetch('/index.html',{cache:'no-store'});if(!r.ok)throw Error('homepage unavailable');page=new DOMParser().parseFromString(await r.text(),'text/html');}catch(e){console.warn('Shared website chrome unavailable; retaining existing page layout',e);return;}
const base='https://heavenlykey.org/';
['css/home-renewal.css','css/premium-navigation-upgrade.css','css/resources-dropdown-fix.css','css/footer-five-columns.css'].forEach(p=>style(new URL(p,base).href));
if(!specialMenu){const source=page.querySelector('header .main-nav');const dest=document.querySelector('header nav.main-nav,header nav.inner-nav,header nav[aria-label="Site navigation"],header nav[aria-label="Primary"],header nav');if(source){const nav=source.cloneNode(true);nav.removeAttribute('id');nav.querySelectorAll('[aria-current]').forEach(a=>a.removeAttribute('aria-current'));absoluteLinks(nav);if(dest){dest.replaceWith(nav)}else{const header=document.querySelector('header');if(header)header.appendChild(nav);else document.body.prepend(nav)}initNav(nav);}}
const f=page.querySelector('footer.site-footer');if(f){const copy=f.cloneNode(true);absoluteLinks(copy);copy.setAttribute('data-hk-shared-footer','homepage');const old=[...document.querySelectorAll('footer')].filter(el=>!el.closest('aside,dialog,[role="dialog"]'));if(old.length){old[0].replaceWith(copy);old.slice(1).forEach(el=>el.remove());}else document.body.appendChild(copy);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();