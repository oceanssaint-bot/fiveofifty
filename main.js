/* ============================================================================
   FIVEOFIFTY STUDIOS — main.js
   Nav dropdown · mobile menu · lazy video · lightbox · contact form
   · hover-to-unmute video · page-transition fades · reduced-motion handling
   ============================================================================ */
(function () {
  'use strict';
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    initDropdown();
    initMobileMenu();
    initBrandIntro();
    initStickyHeader();
    initWork();
    initLazyVideo();
    initLightbox();
    initContactForm();
    initVideoSound();
    initPageTransitions();
    var y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  });

  /* --- Brand intro: play official logo animation once per session --------- */
  function initBrandIntro() {
    var intro = document.getElementById('brand-intro');
    if (!intro) return;
    var video = intro.querySelector('video');
    var seen = false;
    try { seen = sessionStorage.getItem('fof-intro') === '1'; } catch (e) {}

    function clear() {
      if (intro.classList.contains('is-done')) return;
      intro.classList.add('is-done');
      document.body.classList.remove('intro-playing');
      document.body.classList.add('intro-cleared');
      try { sessionStorage.setItem('fof-intro', '1'); } catch (e) {}
      setTimeout(function () { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 800);
    }

    // Skip the intro entirely if already seen this session or reduced-motion
    if (seen || prefersReduced || !video) {
      intro.parentNode && intro.parentNode.removeChild(intro);
      return;
    }

    document.body.classList.add('intro-playing');
    // play, then clear when the animation finishes (with safety timeout)
    var safety = setTimeout(clear, 6000);
    video.addEventListener('ended', function () { clearTimeout(safety); clear(); });
    var p = video.play();
    if (p && p.catch) p.catch(function () { clearTimeout(safety); clear(); });
    // let the user skip by clicking / pressing a key
    intro.addEventListener('click', function () { clearTimeout(safety); clear(); });
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { clearTimeout(safety); clear(); document.removeEventListener('keydown', onKey); }
    });
  }

  /* --- Home: transparent header turns solid on scroll ---------------------- */
  function initStickyHeader() {
    var header = document.getElementById('site-header');
    if (!header || !header.classList.contains('site-header--home')) return;
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* --- Keyboard-accessible WORK dropdown ----------------------------------- */
  function initDropdown() {
    var item = document.querySelector('.nav-item--has-menu');
    if (!item) return;
    var trigger = item.querySelector('.nav-link');
    var menu = item.querySelector('.nav-menu');
    if (!trigger || !menu) return;
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');

    function open() { item.classList.add('nav-item--open'); trigger.setAttribute('aria-expanded', 'true'); }
    function close() { item.classList.remove('nav-item--open'); trigger.setAttribute('aria-expanded', 'false'); }
    function toggle() { item.classList.contains('nav-item--open') ? close() : open(); }

    trigger.addEventListener('click', function (e) {
      // allow keyboard / tap toggle without following a (possible) link
      e.preventDefault();
      toggle();
    });
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); open(); var f = menu.querySelector('a'); if (f) f.focus(); }
    });
    item.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); trigger.focus(); } });
    document.addEventListener('click', function (e) { if (!item.contains(e.target)) close(); });
    // close when focus leaves the item entirely
    item.addEventListener('focusout', function () {
      setTimeout(function () { if (!item.contains(document.activeElement)) close(); }, 0);
    });
  }

  /* --- Mobile fullscreen menu ---------------------------------------------- */
  function initMobileMenu() {
    var burger = document.querySelector('.hamburger');
    var menu = document.querySelector('.mobile-menu');
    if (!burger || !menu) return;
    var scrollY = 0;
    burger.setAttribute('aria-controls', 'mobile-menu');
    burger.setAttribute('aria-expanded', 'false');

    function open() {
      scrollY = window.scrollY;
      document.body.classList.add('menu-open');
      document.body.style.top = -scrollY + 'px';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      burger.setAttribute('aria-expanded', 'true');
      menu.removeAttribute('aria-hidden');
    }
    function close() {
      document.body.classList.remove('menu-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
      burger.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
    }
    burger.addEventListener('click', function () {
      document.body.classList.contains('menu-open') ? close() : open();
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { close(); burger.focus(); }
    });
  }

  /* --- Lazy video: load + play only near viewport -------------------------- */
  function initLazyVideo() {
    var vids = [].slice.call(document.querySelectorAll('video[data-src]'));
    if (!vids.length) return;

    function load(v) {
      if (v.dataset.loaded) return;
      v.src = v.dataset.src;
      v.dataset.loaded = '1';
      v.load();
    }
    if (!('IntersectionObserver' in window)) {
      vids.forEach(function (v) { load(v); if (!prefersReduced) v.play().catch(function(){}); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) {
          load(v);
          if (!prefersReduced) {
            var p = v.play();
            if (p && p.catch) p.catch(function () {});
          }
        } else if (v.dataset.loaded && !v.paused) {
          v.pause();
        }
      });
    }, { rootMargin: '250px 0px', threshold: 0.1 });
    vids.forEach(function (v) { io.observe(v); });

    // honor reduced-motion toggles live
    var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.addEventListener) mq.addEventListener('change', function (e) {
      prefersReduced = e.matches;
      vids.forEach(function (v) { if (e.matches) v.pause(); });
    });
  }

  /* --- Lightbox (stills page) ---------------------------------------------- */
  function initLightbox() {
    var grid = document.querySelector('[data-lightbox-grid]');
    var box = document.querySelector('.lightbox');
    if (!grid || !box) return;
    var imgEl = box.querySelector('img');
    var countEl = box.querySelector('.lb-count');
    var items = [].slice.call(grid.querySelectorAll('[data-full]'));
    var idx = 0, lastFocus = null;

    function show(i) {
      idx = (i + items.length) % items.length;
      var el = items[idx];
      imgEl.src = el.getAttribute('data-full');
      imgEl.alt = el.getAttribute('data-alt') || '';
      if (countEl) countEl.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(items.length).padStart(2, '0');
    }
    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      box.classList.add('open');
      box.removeAttribute('aria-hidden');
      document.body.style.overflow = 'hidden';
      box.querySelector('.lb-close').focus();
    }
    function close() {
      box.classList.remove('open');
      box.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }
    items.forEach(function (el, i) {
      el.addEventListener('click', function (e) { e.preventDefault(); open(i); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); } });
    });
    box.querySelector('.lb-close').addEventListener('click', close);
    box.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    box.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* --- Contact form: validate, send to FormSubmit, mailto fallback -------- */
  function initContactForm() {
    var form = document.querySelector('form[data-contact]');
    if (!form) return;
    var success = document.querySelector('.form-success');
    var btn = form.querySelector('button[type="submit"]');
    var btnHTML = btn ? btn.innerHTML : '';

    function setError(field, on) { field.classList.toggle('has-error', on); }
    function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

    function showSuccess(failed) {
      if (failed && success) {
        var note = success.querySelector('[data-fallback]');
        var link = success.querySelector('[data-mailto]');
        if (link) {
          var body =
            'Name: ' + (form.first.value || '') + ' ' + (form.last.value || '') + '\n' +
            'Email: ' + (form.email.value || '') + '\n\n' + (form.message.value || '');
          link.href = 'mailto:fiveofiftystudios@gmail.com'
            + '?subject=' + encodeURIComponent(form.subject.value || 'Project enquiry')
            + '&body=' + encodeURIComponent(body);
        }
        if (note) note.style.display = 'block';
      }
      form.style.display = 'none';
      if (success) { success.classList.add('show'); success.setAttribute('tabindex', '-1'); success.focus(); }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      [].slice.call(form.querySelectorAll('[required]')).forEach(function (input) {
        var field = input.closest('.form-field');
        var val = input.value.trim();
        var bad = !val || (input.type === 'email' && !validEmail(val));
        setError(field, bad);
        if (bad && ok) input.focus();
        if (bad) ok = false;
      });
      if (!ok) return;

      if (btn) { btn.disabled = true; btn.innerHTML = 'Sending&hellip;'; }
      var endpoint = (form.getAttribute('action') || '').replace('formsubmit.co/', 'formsubmit.co/ajax/');

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      })
        .then(function (r) { if (!r.ok) throw new Error('send failed'); return r.json(); })
        .then(function () { showSuccess(false); })
        .catch(function () { showSuccess(true); })
        .then(function () { if (btn) { btn.disabled = false; btn.innerHTML = btnHTML; } });
    });

    // clear error on input
    form.addEventListener('input', function (e) {
      var field = e.target.closest('.form-field');
      if (field && field.classList.contains('has-error')) field.classList.remove('has-error');
    });
  }

  /* --- Hover-to-unmute on video tiles -------------------------------------- */
  function initVideoSound() {
    var tiles = [].slice.call(document.querySelectorAll('.tile'));
    var withVideo = [];
    tiles.forEach(function (tile) {
      var v = tile.querySelector('video');
      if (!v) return;
      withVideo.push({ tile: tile, v: v });
      var badge = document.createElement('span');
      badge.className = 'sound-badge';
      badge.innerHTML = '<svg class="sb-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path class="sb-wave" d="M16 9.5a3.5 3.5 0 0 1 0 5M18.6 7a7 7 0 0 1 0 10"/></svg><span class="sb-txt">Sound</span>';
      tile.appendChild(badge);
    });
    if (!withVideo.length) return;

    function mute(o) { o.v.muted = true; o.tile.classList.remove('is-audio'); }
    function unmute(o) {
      if (prefersReduced) return;
      withVideo.forEach(function (other) { if (other !== o) mute(other); });
      o.v.muted = false;
      try { o.v.volume = 1; } catch (e) {}
      o.tile.classList.add('is-audio');
      var p = o.v.play();
      if (p && p.catch) p.catch(function () {});
    }
    withVideo.forEach(function (o) {
      o.tile.addEventListener('mouseenter', function () { unmute(o); });
      o.tile.addEventListener('mouseleave', function () { mute(o); });
      o.tile.addEventListener('focusin', function () { unmute(o); });
      o.tile.addEventListener('focusout', function () { mute(o); });
    });
    // safety: kill all audio when the tab is hidden
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) withVideo.forEach(mute);
    });
  }

  /* --- Page-transition fades (intercept internal links) -------------------- */
  function initPageTransitions() {
    if (prefersReduced) return;
    // clear the leaving state if the page is restored from bfcache
    window.addEventListener('pageshow', function () { document.body.classList.remove('is-leaving'); });

    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;
      if (/^(https?:|mailto:|tel:)/i.test(href)) return;          // off-site / protocols
      if (a.hostname && a.hostname !== window.location.hostname) return;
      e.preventDefault();
      document.body.classList.add('is-leaving');
      setTimeout(function () { window.location.href = a.href; }, 300);
    });
  }

  /* --- Work: render videos grid + Latest list from data/videos.json -------- */
  function initWork() {
    var grid = document.getElementById('videos-grid');
    var timeline = document.querySelector('[data-work-timeline]');
    if (!grid && !timeline) return;

    // resolve data path relative to site root (admin/ pages live one level down)
    var dataUrl = 'data/videos.json';

    fetch(dataUrl, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('load failed'); return r.json(); })
      .then(function (data) {
        var items = (data && data.videos ? data.videos : []).map(parseEntry).filter(Boolean);
        if (grid) renderGrid(grid, items);
        if (timeline) renderTimeline(timeline, items);
        if (items.length) ensureVideoModal();
        backfillVimeoThumbs(items);
      })
      .catch(function () {
        if (grid) grid.innerHTML = '<p class="work-empty">Work is loading shortly.</p>';
        if (timeline) timeline.innerHTML = '';
      });
  }

  // Parse a raw JSON entry into a render-ready object (ids, embed + thumb urls).
  function parseEntry(v) {
    if (!v || !v.url) return null;
    var url = String(v.url).trim();
    var id = '', embed = '', thumb = v.thumbnail || '';
    var platform = (v.platform || '').toLowerCase();

    var yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
    var vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);

    if (yt && platform !== 'vimeo') {
      id = yt[1];
      embed = 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0';
      if (!thumb) thumb = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
      platform = 'youtube';
    } else if (vm) {
      id = vm[1];
      embed = 'https://player.vimeo.com/video/' + id + '?autoplay=1';
      platform = 'vimeo';
    } else {
      return null; // unrecognised link — skip rather than render a broken tile
    }

    return {
      title: v.title || 'Untitled', category: v.category || '', year: v.year || '',
      description: v.description || '', platform: platform, id: id,
      watch: url, embed: embed, thumb: thumb, featured: !!v.featured
    };
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function thumbImg(item, cls) {
    var src = item.thumb ? ' src="' + esc(item.thumb) + '"' : '';
    return '<img class="' + cls + '"' + src + ' alt="' + esc(item.title) +
      '" loading="lazy" data-vimeo-id="' + (item.platform === 'vimeo' && !item.thumb ? esc(item.id) : '') +
      '" onerror="this.style.opacity=0" />';
  }

  var PLAY_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  function renderGrid(grid, items) {
    if (!items.length) { grid.innerHTML = '<p class="work-empty">No work yet.</p>'; return; }
    grid.innerHTML = items.map(function (it) {
      return '<a class="tile tile-link" href="' + esc(it.watch) + '" data-video="' + esc(it.embed) +
        '" data-title="' + esc(it.title) + '" aria-label="Play ' + esc(it.title) + '">' +
        thumbImg(it, 'tile-media') +
        '<span class="tile-overlay">' +
          (it.category ? '<span class="t-cat">' + esc(it.category) + '</span>' : '') +
          '<span class="t-title">' + esc(it.title) + '</span>' +
        '</span>' +
        '<span class="tile-corner">' + PLAY_ICON + '</span>' +
      '</a>';
    }).join('');
  }

  function renderTimeline(ol, items) {
    var latest = items.filter(function (i) { return i.featured; });
    if (!latest.length) latest = items.slice(0, 5);
    ol.innerHTML = latest.map(function (it) {
      return '<li class="tl-row"><div class="tl-meta">' +
          (it.year ? '<span class="tl-year">' + esc(it.year) + '</span>' : '') +
          (it.category ? '<span class="tl-cat">' + esc(it.category) + '</span>' : '') +
        '</div>' +
        '<a class="tl-card tile-link" href="' + esc(it.watch) + '" data-video="' + esc(it.embed) +
          '" data-title="' + esc(it.title) + '">' +
          '<span class="tl-thumb">' + thumbImg(it, 'tile-media') + '</span>' +
          '<span class="tl-info"><span class="tl-title">' + esc(it.title) + '</span>' +
            '<span class="tl-sub">' + esc(it.description) + '</span>' +
            '<span class="tl-go">View project →</span></span>' +
        '</a></li>';
    }).join('');
  }

  // Vimeo gives no thumbnail from the URL alone — fetch it from the public oEmbed endpoint.
  function backfillVimeoThumbs(items) {
    items.forEach(function (it) {
      if (it.platform !== 'vimeo' || it.thumb) return;
      fetch('https://vimeo.com/api/oembed.json?url=' + encodeURIComponent(it.watch))
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          if (!j || !j.thumbnail_url) return;
          var big = j.thumbnail_url.replace(/_\d+x\d+(\.\w+)?$/, '_960$1');
          var imgs = document.querySelectorAll('img[data-vimeo-id="' + it.id + '"]');
          [].forEach.call(imgs, function (im) { im.src = big; im.style.opacity = ''; });
        })
        .catch(function () {});
    });
  }

  /* --- Video player modal (YouTube / Vimeo embeds) ------------------------- */
  var videoModal;
  function ensureVideoModal() {
    if (videoModal) return;
    videoModal = document.createElement('div');
    videoModal.className = 'video-modal';
    videoModal.setAttribute('aria-hidden', 'true');
    videoModal.innerHTML =
      '<button class="vm-close" aria-label="Close video">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      '</button><div class="vm-frame"></div>';
    document.body.appendChild(videoModal);

    var frame = videoModal.querySelector('.vm-frame');
    var lastFocus = null;

    function open(embed, title) {
      lastFocus = document.activeElement;
      frame.innerHTML = '<iframe src="' + esc(embed) + '" title="' + esc(title || 'Video') +
        '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
      videoModal.classList.add('open');
      videoModal.removeAttribute('aria-hidden');
      document.body.style.overflow = 'hidden';
      videoModal.querySelector('.vm-close').focus();
    }
    function close() {
      videoModal.classList.remove('open');
      videoModal.setAttribute('aria-hidden', 'true');
      frame.innerHTML = ''; // unload iframe to stop playback
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    videoModal.querySelector('.vm-close').addEventListener('click', close);
    videoModal.addEventListener('click', function (e) { if (e.target === videoModal) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && videoModal.classList.contains('open')) close();
    });

    // Intercept clicks on any work tile that carries a [data-video] embed.
    document.addEventListener('click', function (e) {
      var card = e.target.closest && e.target.closest('a[data-video]');
      if (!card) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // let new-tab work
      e.preventDefault();
      open(card.getAttribute('data-video'), card.getAttribute('data-title'));
    });
  }
})();
