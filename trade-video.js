(() => {
  'use strict';
  const video = document.getElementById('trade-video');
  if (!video) return;
  const source = video.querySelector('source');
  const title = document.getElementById('film-title');
  const error = document.getElementById('film-error');
  const chapters = [...document.querySelectorAll('[data-film-time]')];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = navigator.connection && navigator.connection.saveData;
  let loaded = false, inView = false, autoPaused = false, userPaused = false;
  function load() {
    if (loaded) return;
    source.src = source.dataset.src;
    loaded = true;
    error.hidden = true;
    video.load();
  }
  function play() { const request = video.play(); if (request) request.catch(() => {}); }
  // Native controls remain available even if autoplay is blocked.
  video.addEventListener('play', () => { userPaused = false; error.hidden = true; });
  video.addEventListener('pause', () => { if (!autoPaused && inView) userPaused = true; autoPaused = false; });
  video.addEventListener('timeupdate', () => {
    const port = video.currentTime >= 8;
    title.textContent = port ? 'Port logistics' : 'Metal processing';
    chapters.forEach((b,i) => b.setAttribute('aria-pressed', String(i === (port ? 1 : 0))));
  });
  function showError() { if (loaded) error.hidden = false; }
  video.addEventListener('error', showError);
  source.addEventListener('error', showError);
  document.getElementById('film-retry').addEventListener('click', () => { error.hidden = true; loaded = false; load(); play(); });
  chapters.forEach(button => button.addEventListener('click', () => {
    load();
    const seek = () => { video.currentTime = Number(button.dataset.filmTime); play(); };
    if (video.readyState >= 1) seek(); else video.addEventListener('loadedmetadata', seek, {once:true});
  }));
  // Load only near the film; respect reduced motion and data-saving preferences.
  if ('IntersectionObserver' in window) {
    const loader = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { load(); loader.disconnect(); }
    }, {rootMargin:'150px 0px'});
    loader.observe(video);
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      if (!inView && !video.paused) { autoPaused = true; video.pause(); }
      else if (inView && loaded && !motion.matches && !saveData && !userPaused && !document.hidden) play();
    }, {threshold:0.25}).observe(video);
  } else load();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !video.paused) { autoPaused = true; video.pause(); }
  });
})();
