/* Register only the public-content service worker; private data stays online. */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/offline-worker.js', {scope:'/'})
      .catch(error => console.warn('Offline reading unavailable:', error));
  }, {once:true});
}
