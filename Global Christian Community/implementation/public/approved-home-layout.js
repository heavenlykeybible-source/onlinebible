/* Approved home visual integration. Existing community app owns sessions, feeds and ACTIVE API. */
(()=>{'use strict';
function setMemberState(session){
  const signedIn=Boolean(session?.user?.userId);
  document.body.classList.toggle('gc-approved-member',signedIn);
  document.body.classList.toggle('gc-approved-guest',!signedIn);
  return signedIn;
}
function update(e){
  if(e.detail?.page!=='home'){
    document.body.classList.remove('gc-approved-member','gc-approved-guest');
    return;
  }
  const signedIn=setMemberState(e.detail.session);
  const stream=document.querySelector('.social-stream');
  if(!stream)return;
  const banner=stream.querySelector('.gc-visitor-banner');
  const heading=stream.querySelector('.stream-heading');
  if(!signedIn&&banner){
    if(heading)heading.after(banner);
    banner.setAttribute('aria-label','Join the Global Christian Community');
    const intro=banner.querySelector(':scope > p');
    if(intro)intro.textContent='A global family united in Christ. Connect with believers, discover Spaces and Groups, share Design Cards and prayer requests, and grow together in faith.';
    const actions=banner.querySelector('.gc-visitor-actions');
    if(actions){
      let welcome=banner.querySelector('.gc-visitor-heading');
      if(!welcome){
        welcome=document.createElement('h2');
        welcome.className='gc-visitor-heading';
        welcome.textContent='A global family united in Christ';
      }
      actions.before(welcome);
      if(intro)actions.before(intro);
      const join=actions.querySelector('a[href*="register"]');
      if(join)join.textContent='Join the Community';
      const login=actions.querySelector('a:not([href*="register"])');
      if(login)login.textContent='Sign In';
    }
  }
  if(signedIn&&banner)banner.remove();
  // The guest banner and ACTIVE are mutually exclusive; keep both under the stream heading.
  const nav=document.querySelector('.top .nav');
  if(nav){
    nav.classList.add('gc-premium-header');
    const links=nav.querySelector('.navlinks');
    if(links)links.setAttribute('aria-label','Community navigation');
  }
  const rail=document.querySelector('.social-rail');
  if(rail){
    rail.setAttribute('aria-label','Community menu');
    const activeLink=rail.querySelector('.rail-link[aria-current="page"]');
    if(activeLink)activeLink.classList.add('gc-current-section');
  }
  const sidebar=document.querySelector('.social-sidebar');
  if(sidebar)sidebar.setAttribute('aria-label','Community information');
  const active=stream.querySelector('.gc-active-section');
  if(signedIn&&active&&heading)heading.after(active);
}
window.addEventListener('hk-community-view-ready',update);
window.addEventListener('hk-care-session',e=>{
  if(document.body.dataset.page==='home')setMemberState(e.detail);
});
})();
