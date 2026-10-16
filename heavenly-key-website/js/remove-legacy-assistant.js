/* Remove known retired controls only; never match text or touch the approved controls. */
(()=>{'use strict';const retired='#hkem-public-assistant,#hk-radio-compact,#hk-app-footer-promo,#hk-app-footer-promo-style';function clean(){document.querySelectorAll(retired).forEach(n=>n.remove())}clean();new MutationObserver(clean).observe(document.documentElement,{childList:true,subtree:true});})();
