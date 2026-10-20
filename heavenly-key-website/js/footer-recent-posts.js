/* Read-only public Blogger feed for a compact three-post footer list. */
(() => {
  'use strict';

  const root = document.getElementById('hk-footer-recent-posts');
  if (!root) return;

  const callback = 'hkFooterBlog_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
  const script = document.createElement('script');
  let done = false;
  const timer = setTimeout(finish, 6500);

  function clean() {
    clearTimeout(timer);
    script.onerror = null;
    script.remove();
    try {
      delete window[callback];
    } catch (_) {
      window[callback] = undefined;
    }
  }

  function finish() {
    if (done) return;
    done = true;
    clean();
  }

  function plain(value) {
    const el = document.createElement('div');
    el.innerHTML = value || '';
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function safePostUrl(value) {
    try {
      const url = new URL(value);
      const allowedHosts = ['blog.heavenlykey.org', 'www.blog.heavenlykey.org'];
      if (url.protocol !== 'https:' || !allowedHosts.includes(url.hostname.toLowerCase())) return null;
      return url.href;
    } catch (_) {
      return null;
    }
  }

  window[callback] = data => {
    if (done) return;
    const posts = (data && data.feed && data.feed.entry) || [];
    root.replaceChildren();
    let count = 0;

    for (const post of posts) {
      const alternate = (post.link || []).find(item => item && item.rel === 'alternate' && item.href);
      const url = alternate && safePostUrl(alternate.href);
      if (!url) continue;

      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = (plain(post.title && post.title.$t) || 'Ministry message').slice(0, 75);
      root.appendChild(link);

      if (++count === 3) break;
    }

    if (!count) {
      const message = document.createElement('p');
      message.textContent = 'Visit our ministry blog for recent messages.';
      root.appendChild(message);
    }
    finish();
  };

  script.src = 'https://blog.heavenlykey.org/feeds/posts/default?alt=json-in-script&max-results=3&callback=' + encodeURIComponent(callback);
  script.async = true;
  script.onerror = finish;
  document.head.appendChild(script);
})();
