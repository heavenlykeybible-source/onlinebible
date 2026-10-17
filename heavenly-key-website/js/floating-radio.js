/* Legacy entry point retained only so existing pages load the single approved HKEM public-site system. */
(function(){'use strict';if(document.querySelector('script[data-hk-public-master]'))return;var s=document.createElement('script');s.src='/js/public-site-master.js?v=master-20261017c';s.defer=true;s.setAttribute('data-hk-public-master','true');document.head.appendChild(s);}());
