/* Public Blogger JSON-in-script feed; no API key, admin access or user data required. */
(function () {
  'use strict';

  var root = document.getElementById('hk-recent-posts');
  if (!root) return;

  var fallback = document.getElementById('hk-blog-fallback');
  var done = false;
  var callback = 'hkRecentPosts_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
  var script = document.createElement('script');
  var timer;

  function cleanup() {
    clearTimeout(timer);
    script.onerror = null;
    if (script.parentNode) script.remove();
    try {
      delete window[callback];
    } catch (_) {
      window[callback] = undefined;
    }
  }

  function fail() {
    if (done) return;
    done = true;
    cleanup();
    root.replaceChildren();
    var message = document.createElement('p');
    message.className = 'hk-blog-status';
    message.textContent = 'Recent posts could not be loaded right now.';
    root.appendChild(message);
    if (fallback) fallback.hidden = false;
  }

  function plain(value) {
    var el = document.createElement('div');
    el.innerHTML = value || '';
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function append(tag, className, content, parent) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (content !== undefined) el.textContent = content;
    parent.appendChild(el);
    return el;
  }

  function safePostUrl(value) {
    try {
      var url = new URL(value);
      var allowedHosts = ['blog.heavenlykey.org', 'www.blog.heavenlykey.org'];
      if (url.protocol !== 'https:' || allowedHosts.indexOf(url.hostname.toLowerCase()) === -1) return null;
      return url.href;
    } catch (_) {
      return null;
    }
  }

  function render(data) {
    if (done) return;
    var posts = (data && data.feed && data.feed.entry) || [];
    if (!posts.length) {
      fail();
      return;
    }

    var cards = [];
    posts.slice(0, 5).forEach(function (post) {
      var links = post.link || [];
      var alternate = links.find(function (item) {
        return item && item.rel === 'alternate' && item.href;
      });
      var postUrl = alternate && safePostUrl(alternate.href);
      if (!postUrl) return;

      var cardData = {
        title: plain(post.title && post.title.$t) || 'Latest ministry message',
        url: postUrl,
        summary: plain((post.summary && post.summary.$t) || (post.content && post.content.$t) || ''),
        date: post.published && post.published.$t,
        thumbnail: post.media$thumbnail && post.media$thumbnail.url
      };
      cards.push(cardData);
    });

    if (!cards.length) {
      fail();
      return;
    }

    done = true;
    cleanup();
    root.replaceChildren();

    cards.forEach(function (post) {
      var card = append('article', 'hk-blog-card', undefined, root);
      var thumb = append('div', 'hk-blog-thumb', undefined, card);
      var imageUrl = post.thumbnail;
      if (imageUrl && /^https:\/\//i.test(imageUrl)) {
        var img = document.createElement('img');
        img.src = imageUrl;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        thumb.appendChild(img);
      } else {
        thumb.textContent = 'HK';
      }

      var body = append('div', 'hk-blog-card-body', undefined, card);
      if (post.date) {
        var date = new Date(post.date);
        if (!isNaN(date.getTime())) {
          append('span', 'hk-blog-date', date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }), body);
        }
      }

      append('h3', '', post.title, body);
      if (post.summary) {
        append('p', '', post.summary.slice(0, 125) + (post.summary.length > 125 ? '…' : ''), body);
      }

      var link = append('a', 'hk-blog-read', 'Read More →', body);
      link.href = post.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });
  }

  window[callback] = render;
  script.async = true;
  script.onerror = retry;

  function retry() {
    if (done) return;
    clearTimeout(timer);
    if (script.parentNode) script.remove();
    script.onerror = fail;
    script.src = 'https://www.blog.heavenlykey.org/feeds/posts/default?alt=json-in-script&max-results=5&callback=' + encodeURIComponent(callback);
    timer = setTimeout(fail, 7000);
    document.head.appendChild(script);
  }

  script.src = 'https://blog.heavenlykey.org/feeds/posts/default?alt=json-in-script&max-results=5&callback=' + encodeURIComponent(callback);
  timer = setTimeout(retry, 7000);
  document.head.appendChild(script);
})();
