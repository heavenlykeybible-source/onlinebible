/* Approved homepage footer is the single footer across Heavenly Key public pages. */
(function(){
  'use strict';
  function render(){
    if(location.pathname==='/'||/\/index\.html$/i.test(location.pathname)) return;
    var old=document.querySelector('footer');
    if(!old) return;
    var root=location.pathname.indexOf('/pages/')!==-1?'../':'';
    var footer=document.createElement('footer');
    footer.className='site-footer';
    footer.setAttribute('data-approved-global-footer','true');
    footer.innerHTML='<div class="wrap hk-primary-footer">'+
      '<section class="hk-footer-column hk-footer-app"><h2>Heavenly Key App</h2><div class="hk-footer-app-showcase"><div class="hk-footer-app-emblem" aria-hidden="true"><span class="hk-footer-app-spark">✦</span><span class="hk-footer-app-mark" style="font-size:clamp(38px,5vw,68px);line-height:1">📖</span><span class="hk-footer-app-label">APP</span></div><p><strong>Discipleship and Global Christian Community</strong></p><a class="hk-footer-cta" href="https://app.heavenlykey.org/" target="_blank" rel="noopener noreferrer">Explore the App ↗</a></div></section>'+
      '<nav class="hk-footer-column"><h2>Quick Links</h2><a href="'+root+'pages/about.html">About the Ministry</a><a href="'+root+'pages/meet-the-pastor.html">Meet the Pastor</a><a href="'+root+'pages/steps-to-salvation.html">Steps to Salvation</a><a href="'+root+'pages/partner.html">Partner With Us</a><a href="'+root+'pages/contact.html">Contact Us</a></nav>'+
      '<nav class="hk-footer-column"><h2>Ministry Resources</h2><a href="'+root+'pages/radio.html">Heavenly Key Radio</a><a href="'+root+'pages/grdpc.html">Global Revival &amp; Destiny Prayer Cry</a><a href="https://bible.heavenlykey.org/" target="_blank" rel="noopener noreferrer">Heavenly Key Bible ↗</a><a href="https://global.heavenlykey.org/" target="_blank" rel="noopener noreferrer">Global Christian Community ↗</a></nav>'+
      '<section class="hk-footer-column"><h2>Recent Blog Posts</h2><div class="hk-footer-recent-posts"><p>Visit our ministry blog for recent messages.</p></div><a class="hk-footer-all" href="https://blog.heavenlykey.org/" target="_blank" rel="noopener noreferrer">View All Posts ↗</a></section>'+
      '<section class="hk-footer-column hk-footer-community"><h2>Global Christian Community</h2><div class="hk-community-network" aria-hidden="true"><span>●</span><span>✦</span><span>●</span><span>◎</span><span>●</span></div><p class="hk-community-kicker">Connecting Believers Across the Nations</p><h3>Join the Community of God\'s People!</h3><p>Become part of a global Christian family where believers connect, share the Word of God, encourage one another, build godly friendships, and grow together in faith.</p><p class="hk-community-tagline">One Faith • One Family • One Body in Christ</p><a class="hk-footer-cta hk-community-join" href="https://global.heavenlykey.org/" target="_blank" rel="noopener noreferrer">JOIN OUR GLOBAL COMMUNITY ↗</a></section>'+
      '</div><div class="copyright-strip"><div class="wrap copyright-inner"><p>Copyright © Heavenly Key Evangelistic Movement 2022–2026.</p><div class="social-links" aria-label="Follow the ministry"><a href="https://www.youtube.com/@heavenlykeyministry" class="social youtube" target="_blank" rel="noopener noreferrer" aria-label="YouTube">▶</a><a href="https://www.facebook.com/heavenlykey" class="social facebook" target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a><a href="https://www.instagram.com/heavenlykey247" class="social instagram" target="_blank" rel="noopener noreferrer" aria-label="Instagram">◎</a><a href="https://twitter.com/EAdiohwo" class="social twitter" target="_blank" rel="noopener noreferrer" aria-label="X">𝕏</a></div><p>Designed by <a href="https://talkmoney.uk/" target="_blank" rel="noopener noreferrer">TALKMONEY ECOSYSTEM ↗</a></p></div></div><nav class="hk-footer-bottom-legal" aria-label="Legal information"><a href="'+root+'pages/terms.html">Terms of Use</a><a href="'+root+'pages/privacy.html">Privacy Policy</a></nav>';
    old.replaceWith(footer);
    document.querySelectorAll('.share-this-page,.share-this-app,[data-share-placard]').forEach(function(n){n.remove();});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();