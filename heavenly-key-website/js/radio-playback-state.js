/* Shared, playback-driven decorative state. A play request is not proof of playback. */
(function () {
  'use strict';
  window.HKRadioPlayback = function (audio, render) {
    let actual = false;
    const update = () => render(actual && !audio.paused && !audio.ended && !audio.error);
    const stop = () => { actual = false; update(); };
    audio.addEventListener('playing', () => { actual = true; update(); });
    ['pause', 'ended', 'waiting', 'stalled', 'seeking', 'emptied', 'error', 'abort', 'loadstart'].forEach(name => audio.addEventListener(name, stop));
    // canplay and suspend describe buffering/network state, not audible playback.
    update();
    return stop;
  };
})();
