// Artistic page loader: engraved Basmati grains falling from above and piling into the bowl.
(() => {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  const canvas = document.getElementById('loader-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const percentEl = document.getElementById('loader-percent');
  const stepTextEl = document.getElementById('loader-step-text');
  const preferReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const W = 520;
  const H = 520;
  const bowlCenterX = 260;
  const bowlRimY = 298;
  const bowlHalfWidth = 116;

  const fallingGrains = [];
  const landedGrains = [];
  const maxLanded = 135;
  let progress = 0;
  let assetsReady = false;
  const startTime = performance.now();
  const minDuration = preferReduced ? 550 : 2250;

  Promise.race([
    Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      new Promise(resolve => {
        if (document.readyState === 'complete') resolve();
        else window.addEventListener('load', resolve, {once: true});
      })
    ]),
    new Promise(resolve => setTimeout(resolve, 2600))
  ]).then(() => {
    assetsReady = true;
  });

  function moundSurfaceY(x, prog) {
    const normX = Math.min(1, Math.abs(x - bowlCenterX) / bowlHalfWidth);
    const dome = Math.cos(normX * Math.PI * 0.5);
    const peakLift = 8 + prog * 46;
    return bowlRimY + 6 - dome * peakLift;
  }

  function spawnGrain(initialY = -18) {
    const spread = (Math.random() - 0.5) * 140;
    const x = bowlCenterX + spread;
    const targetX = bowlCenterX + (Math.random() - 0.5) * 185 * Math.sqrt(Math.random());
    fallingGrains.push({
      x,
      y: initialY,
      vx: (targetX - x) * 0.016 + (Math.random() - 0.5) * 0.35,
      vy: 2.2 + Math.random() * 2.1,
      rot: (Math.random() - 0.5) * 1.1,
      vrot: (Math.random() - 0.5) * 0.045,
      len: 15 + Math.random() * 6,
      thick: 2.5 + Math.random() * 0.9,
      wobblePhase: Math.random() * Math.PI * 2
    });
  }

  for (let i = 0; i < 16; i++) {
    spawnGrain(-10 - i * 18);
  }

  function drawBasmatiKernel(g, isLanded = false) {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.rot);
    const L = g.len * 0.5;
    const T = g.thick;

    ctx.beginPath();
    ctx.moveTo(-L, 0);
    ctx.quadraticCurveTo(0, -T * 1.15, L, -0.3);
    ctx.quadraticCurveTo(0, T * 0.95, -L, 0);
    ctx.closePath();

    ctx.fillStyle = isLanded ? '#fffdf9' : '#ffffff';
    ctx.fill();
    ctx.lineWidth = isLanded ? 0.95 : 1.1;
    ctx.strokeStyle = '#be2726';
    ctx.stroke();

    // Fine engraved center crease along the slender grain
    ctx.beginPath();
    ctx.moveTo(-L * 0.58, -0.1);
    ctx.quadraticCurveTo(0, -T * 0.22, L * 0.58, -0.15);
    ctx.lineWidth = 0.55;
    ctx.strokeStyle = 'rgba(190, 39, 38, 0.48)';
    ctx.stroke();
    ctx.restore();
  }

  function tickLoader(now) {
    const elapsed = now - startTime;
    const timeProg = Math.min(1, elapsed / minDuration);
    const eased = 1 - Math.pow(1 - timeProg, 2.2);
    progress = assetsReady ? eased : Math.min(0.92, eased);

    loader.style.setProperty('--load-progress', progress.toFixed(3));
    const pct = Math.round(progress * 100);
    if (percentEl) percentEl.textContent = `${pct}%`;
    if (stepTextEl) {
      stepTextEl.textContent = pct < 36
        ? 'GATHERING THE HARVEST'
        : pct < 76
          ? 'AGEING IN THE FOOTHILLS'
          : 'PREPARING THE TABLE';
    }

    if (ctx) {
      ctx.clearRect(0, 0, W, H);

      // Subtle artistic radial guide lines above the bowl
      ctx.save();
      ctx.strokeStyle = 'rgba(190, 39, 38, 0.1)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(bowlCenterX, bowlRimY - 12, 132, Math.PI * 1.12, Math.PI * 1.88);
      ctx.stroke();
      ctx.restore();

      if (progress < 0.96 && fallingGrains.length < 26 && Math.random() < 0.68) {
        spawnGrain(-12);
        if (Math.random() < 0.45) spawnGrain(-24);
      }

      // Draw settled grains mounded on top of the bowl rim
      for (let i = 0; i < landedGrains.length; i++) {
        drawBasmatiKernel(landedGrains[i], true);
      }

      // Update & draw falling grains
      for (let i = fallingGrains.length - 1; i >= 0; i--) {
        const g = fallingGrains[i];
        g.wobblePhase += 0.08;
        g.x += g.vx + Math.sin(g.wobblePhase) * 0.28;
        g.vy = Math.min(5.8, g.vy + 0.075);
        g.y += g.vy;
        g.rot += g.vrot;

        const surfY = moundSurfaceY(g.x, progress);
        if (g.y >= surfY) {
          if (Math.abs(g.x - bowlCenterX) <= bowlHalfWidth - 6 && landedGrains.length < maxLanded) {
            const slope = ((g.x - bowlCenterX) / bowlHalfWidth) * 0.36;
            landedGrains.push({
              x: g.x + (Math.random() - 0.5) * 6,
              y: surfY + (Math.random() - 0.5) * 5,
              rot: slope + (Math.random() - 0.5) * 0.38,
              len: g.len,
              thick: g.thick
            });
          }
          fallingGrains.splice(i, 1);
          continue;
        }
        drawBasmatiKernel(g, false);
      }
    }

    if (progress < 1 || !assetsReady) {
      requestAnimationFrame(tickLoader);
    } else {
      setTimeout(() => {
        loader.classList.add('is-done');
        setTimeout(() => loader.remove(), 900);
      }, 180);
    }
  }

  requestAnimationFrame(tickLoader);
})();

const menu = document.querySelector('.menu');
const nav = document.querySelector('#nav');
const navGroups = [...document.querySelectorAll('.nav-group')];

function closeAllDropdowns() {
  navGroups.forEach(group => {
    group.classList.remove('is-open');
    const btn = group.querySelector('.nav-trigger');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  });
}

function setDropdownOpen(targetGroup, open) {
  navGroups.forEach(group => {
    const isTarget = group === targetGroup && open;
    group.classList.toggle('is-open', isTarget);
    const btn = group.querySelector('.nav-trigger');
    if (btn) btn.setAttribute('aria-expanded', isTarget ? 'true' : 'false');
  });
}

navGroups.forEach(group => {
  const trigger = group.querySelector('.nav-trigger');
  let closeTimer = 0;

  trigger?.addEventListener('click', event => {
    event.stopPropagation();
    const isOpen = group.classList.contains('is-open');
    setDropdownOpen(group, !isOpen);
  });

  group.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' || window.innerWidth <= 1100) return;
    clearTimeout(closeTimer);
    setDropdownOpen(group, true);
  });

  group.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'mouse' || window.innerWidth <= 1100) return;
    clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      if (group.classList.contains('is-open')) setDropdownOpen(group, false);
    }, 150);
  });
});

document.addEventListener('click', event => {
  if (!event.target.closest('.nav-group')) {
    closeAllDropdowns();
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeAllDropdowns();
  }
});

menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('open', open);
  if (!open) closeAllDropdowns();
});
nav.querySelectorAll('a, .nav-stamp-card').forEach(link => link.addEventListener('click', () => {
  closeAllDropdowns();
  menu.setAttribute('aria-expanded', 'false');
  nav.classList.remove('open');
}));
const products = {
  nayaab: {name: 'Nayaab 1121 XXXL', image: 'pack-nayaab.webp', copy: 'Maharaja Special Range — expertly aged 1121 XXXL grains with signature aroma and the world’s longest Basmati grain length for royal biryanis and grand celebrations.', sizes: 'Available in 1 kg, 5 kg, 10 kg and 25 kg packs.'},
  utsav: {name: 'Utsav Golden Sella', image: 'pack-utsav.webp', copy: 'Premium Select Range — soft, fluffy Golden Sella Basmati with signature aroma made to elevate everyday family meals and festive pulaos.', sizes: 'Available in 1 kg, 5 kg, 10 kg and 25 kg packs.'},
  superdubar: {name: 'Super Dubar Golden Sella', image: 'pack-super-dubar.webp', copy: 'Smart Kitchen Range — your daily value pack of Golden Sella Basmati that cooks consistently with non-sticky, separate grains.', sizes: 'Available in 5 kg, 10 kg and 25 kg packs.'},
  supertibar: {name: 'Super Tibar Golden Sella', image: 'pack-super-tibar.webp', copy: 'Family Feast Range — homely goodness worth sharing, offering consistent cooking and fluffy Golden Sella grains for daily meals and jeera rice.', sizes: 'Available in 5 kg, 10 kg and 25 kg packs.'},
  mogra: {name: 'Mogra Golden Sella', image: 'pack-mogra.webp', copy: 'Quick Meals Range — sweet, soft small Basmati grains that make everyday comfort recipes, khichdi, and creamy kheer effortless.', sizes: 'Available in 5 kg, 10 kg and 25 kg packs.'}
};
const dialog = document.querySelector('#product-dialog');
document.querySelectorAll('[data-product]').forEach(button => button.addEventListener('click', () => {
  const product = products[button.dataset.product];
  document.querySelector('#dialog-title').textContent = product.name;
  document.querySelector('#dialog-image').src = 'assets/' + product.image;
  document.querySelector('#dialog-image').alt = 'Leysha ' + product.name;
  document.querySelector('#dialog-copy').textContent = product.copy;
  document.querySelector('#dialog-sizes').textContent = product.sizes;
  document.querySelector('#product-enquiry').href = 'mailto:contact@ssiel.com?subject=' + encodeURIComponent('Leysha enquiry: ' + product.name);
  dialog.showModal();
}));
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) {
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
}});

const filmFrame = document.querySelector('.film-reveal');
const film = document.querySelector('#hero-film');
const filmToggle = document.querySelector('.film-toggle');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let filmPausedByUser = reducedMotion.matches;
let filmVisible = true;
let filmTick = 0;
let filmStart = 0;
let filmBase = 430;
let filmFull = 430;

// Only a sticky header occupies screen space once the mobile masthead scrolls away.
function filmHeaderHeight() {
  const header = document.querySelector('header');
  return getComputedStyle(header).position === 'sticky' ? header.getBoundingClientRect().height : 0;
}
function renderFilmReveal() {
  filmTick = 0;
  const header = document.querySelector('header');
  header?.classList.toggle('is-scrolled', window.scrollY > 12);
  const headerHeight = filmHeaderHeight();
  // The frame's document top is stable: growing it only moves content below it.
  const distance = Math.max(1, filmStart - headerHeight);
  const progress = reducedMotion.matches ? 0 : Math.min(1, Math.max(0, window.scrollY / distance));
  const eased = progress * progress * (3 - 2 * progress);
  filmFrame.style.setProperty('--film-frame', `${filmBase + (filmFull - filmBase) * eased}px`);
  filmFrame.style.setProperty('--film-drift', `${(1 - eased) * 22}px`);
  const captionOpacity = Math.max(0,1-eased*1.5);
  filmFrame.style.setProperty('--film-caption-opacity',captionOpacity);
  const journeyLink=filmFrame.querySelector(':scope > a');
  if (journeyLink) {
    journeyLink.style.pointerEvents=captionOpacity<.05?'none':'';
    journeyLink.tabIndex=captionOpacity<.05?-1:0;
  }
  // The seal turns with scroll distance and reverses when the reader scrolls back.
  document.querySelector('.intro-seal')?.style.setProperty('--seal-turn',`${reducedMotion.matches?0:window.scrollY*.08}deg`);
}
function measureFilmReveal() {
  filmBase = window.matchMedia('(max-width:650px)').matches ? 330 : 430;
  filmStart = filmFrame.getBoundingClientRect().top + window.scrollY;
  // Use the source proportions at full page width so the expanded film has no side bars.
  const aspect = film.videoWidth && film.videoHeight ? film.videoWidth / film.videoHeight : 16 / 9;
  const naturalHeight = filmFrame.getBoundingClientRect().width / aspect;
  filmFull = Math.max(filmBase, naturalHeight);
  filmFrame.style.setProperty('--film-full', `${filmFull}px`);
  renderFilmReveal();
}
function updateFilmButton() {
  const paused = film.paused;
  filmToggle.innerHTML = paused ? 'Play <span aria-hidden="true">▶</span>' : 'Pause <span aria-hidden="true">Ⅱ</span>';
  filmToggle.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
}
function syncFilmPlayback() {
  if (filmPausedByUser || !filmVisible || document.hidden) film.pause();
  else film.play().catch(updateFilmButton);
}
filmToggle.addEventListener('click', () => {
  filmPausedByUser = !film.paused;
  syncFilmPlayback();
});
film.addEventListener('play', updateFilmButton);
film.addEventListener('pause', updateFilmButton);

// Dual-video playlist (Brand Film + LEYSHA_CRICKET_50SEC) and circular unmute/mute pointer.
const filmSwitchButtons = [...filmFrame.querySelectorAll('.film-switch')];
const filmCaptionEl = filmFrame.querySelector(':scope > span');
const filmCursorText = filmFrame.querySelector('.film-cursor-text');
let currentFilmIndex = 0;

function selectHeroFilm(index) {
  const targetBtn = filmSwitchButtons[index];
  if (!targetBtn) return;
  currentFilmIndex = index;
  filmSwitchButtons.forEach((btn, i) => btn.classList.toggle('is-active', i === index));
  const nextSrc = targetBtn.dataset.filmSrc;
  const sourceEl = film.querySelector('source');
  if (sourceEl.getAttribute('src') !== nextSrc) {
    const wasMuted = film.muted;
    sourceEl.setAttribute('src', nextSrc);
    film.load();
    film.muted = wasMuted;
    syncFilmPlayback();
  }
  if (filmCaptionEl && targetBtn.dataset.filmCaption) {
    filmCaptionEl.textContent = targetBtn.dataset.filmCaption;
  }
}

filmSwitchButtons.forEach((btn, i) => {
  btn.addEventListener('click', event => {
    event.stopPropagation();
    selectHeroFilm(i);
  });
  btn.addEventListener('pointerenter', () => filmFrame.classList.remove('is-cursor-visible'));
});

film.addEventListener('ended', () => {
  const nextIndex = (currentFilmIndex + 1) % filmSwitchButtons.length;
  selectHeroFilm(nextIndex);
});

function syncFilmMuteState() {
  const isMuted = film.muted;
  filmFrame.dataset.muted = String(isMuted);
  if (filmCursorText) filmCursorText.textContent = isMuted ? 'UNMUTE' : 'MUTE';
}

filmFrame.addEventListener('pointermove', event => {
  if (event.pointerType === 'touch') return;
  const overSwitcher = Boolean(event.target.closest('.film-switcher'));
  filmFrame.classList.toggle('is-cursor-visible', !overSwitcher);
  const rect = filmFrame.getBoundingClientRect();
  filmFrame.style.setProperty('--cursor-x', `${(event.clientX - rect.left).toFixed(1)}px`);
  filmFrame.style.setProperty('--cursor-y', `${(event.clientY - rect.top).toFixed(1)}px`);
});

filmFrame.addEventListener('pointerleave', () => {
  filmFrame.classList.remove('is-cursor-visible', 'is-cursor-pressed');
});

filmFrame.addEventListener('pointerdown', event => {
  if (event.target.closest('.film-switcher')) return;
  filmFrame.classList.add('is-cursor-pressed');
});

filmFrame.addEventListener('pointerup', () => {
  filmFrame.classList.remove('is-cursor-pressed');
});

filmFrame.addEventListener('click', event => {
  if (event.target.closest('.film-switcher') || event.target.closest('.film-toggle')) return;
  film.muted = !film.muted;
  if (!film.muted) {
    film.volume = 1;
    filmPausedByUser = false;
    film.play().catch(() => {});
  }
  syncFilmMuteState();
});
syncFilmMuteState();
new IntersectionObserver(entries => {
  filmVisible = entries[0].isIntersecting;
  syncFilmPlayback();
}, {threshold: 0}).observe(filmFrame);
window.addEventListener('scroll', () => {
  if (!filmTick) filmTick = requestAnimationFrame(renderFilmReveal);
}, {passive: true});
window.addEventListener('resize', measureFilmReveal);
film.addEventListener('loadedmetadata', measureFilmReveal);
document.addEventListener('visibilitychange', syncFilmPlayback);
reducedMotion.addEventListener('change', () => {
  filmPausedByUser = reducedMotion.matches;
  measureFilmReveal();
  syncFilmPlayback();
});
measureFilmReveal();
document.fonts.ready.then(measureFilmReveal);
syncFilmPlayback();

const storyDialog = document.querySelector('#story-dialog');
const storyBody = document.querySelector('#story-body');
const stories = {
  heritage: `<img class="story-banner" src="assets/factory.jpg" alt="SSIEL rice processing facility"><article class="story-content"><h2 id="story-title">Our journey since 1967.</h2><p>Behind every pack of Leysha Basmati is over fifty years of hands-on rice milling experience from Shiv Shakti Inter Globe Exports (SSIEL).</p><p>We started with a small local rice mill in 1967, expanded into Shiv Shakti Rice Mill in 1985, and founded SSIEL in 2012 with modern milling technology to bring clean, reliable Basmati rice to kitchens around the world.</p><div class="story-milestones"><div><strong>1967</strong><p>Started with a small local rice mill.</p></div><div><strong>1985</strong><p>Expanded into Shiv Shakti Rice Mill.</p></div><div><strong>2012</strong><p>Founded SSIEL to serve kitchens worldwide.</p></div></div><h3>Great rice for everyday cooking.</h3><p>Whether you are making simple steamed rice for lunch, a quick pulao, or a festive biryani for family and friends, our steam, golden sella, and cream sella varieties make it easy to get fluffy, fragrant results every time.</p><p class="story-source">Read more at <a href="https://ssiel.com/ssiel-history/" target="_blank" rel="noopener">SSIEL’s history ↗</a>.</p></article>`,
  film: `<video class="story-video" controls playsinline preload="metadata" poster="assets/hero-film-poster.jpg"><source src="assets/hero-film.mp4" type="video/mp4"></video><div class="story-content film-story-content"><h2 id="story-title">From the farm to your plate.</h2><p>See how Leysha Basmati is grown, harvested, aged, and packed with care.</p></div>`,
  process: `<img class="story-banner" src="assets/lab.jpg" alt="Rice inspection in the SSIEL quality laboratory"><article class="story-content"><h2 id="story-title">Cleaned, aged &amp; lab-tested.</h2><p>Good rice starts with good farming and careful cleaning. Here is how we prepare every batch of Leysha Basmati before it reaches your home.</p><div class="process-steps"><section class="process-step"><h3>1. Farm selection &amp; ageing</h3><p>We buy paddy from trusted farms in Haryana, Punjab, and Western Uttar Pradesh, then rest and age the grains so they cook fluffy and non-sticky.</p></section><section class="process-step"><h3>2. Removing dust &amp; stones</h3><p>Modern cleaning machines remove husks, dust, pebbles, and broken pieces so you get clean, uniform rice in every bag.</p></section><section class="process-step"><h3>3. Gentle polishing &amp; sorting</h3><p>Grains are gently polished and passed through optical colour sorters that spot and remove any discoloured kernels.</p></section><section class="process-step"><h3>4. Size grading &amp; hygienic packing</h3><p>We sort the grains by length so they cook evenly in your pot, then seal them in fresh, moisture-safe packs.</p></section></div><div class="quality-note"><h3>Tested in the pot, not just on paper.</h3><p>Our quality team actually cooks samples from every batch to check grain length, aroma, softness, and taste before approving it for packing.</p></div><p class="story-source">Learn more about <a href="https://ssiel.com/" target="_blank" rel="noopener">SSIEL’s mills ↗</a> and our <a href="https://ssiel.com/ssiel-qc-lab/" target="_blank" rel="noopener">quality lab ↗</a>.</p></article>`,
  blog: `<img class="story-banner" src="assets/virasat.jpg" alt="Aged Basmati harvest in the foothills of Haryana"><article class="story-content"><h2 id="story-title">Why aged Basmati cooks better and never turns sticky.</h2><p>Have you ever wondered why newly harvested rice often turns soft or clumpy in the pot, while aged Basmati cooks up long, light, and separate? The secret is simply giving the grain time to rest.</p><div class="story-milestones"><div><strong>12–24 Months</strong><p>Natural resting slowly reduces excess moisture inside the grain.</p></div><div><strong>2× Longer</strong><p>Aged grains stretch to nearly double their length when boiled.</p></div><div><strong>Zero Stickiness</strong><p>Firm starch structure keeps every grain separate on your plate.</p></div></div><h3>Why resting the grain matters.</h3><p>Fresh paddy has extra natural moisture, which makes grains burst or stick together when boiled. By storing the rice in clean, temperature-checked warehouses for up to two years, that moisture dries out naturally and the grain firms up from the inside.</p><p>When you soak and cook aged Leysha Basmati at home, the grains absorb water evenly, grow long without breaking, and release that unmistakable Basmati aroma across your kitchen.</p></article>`
};
document.querySelectorAll('[data-story]').forEach(button => button.addEventListener('click', () => {
  storyBody.innerHTML = stories[button.dataset.story];
  storyDialog.showModal();
  storyDialog.scrollTop = 0;
  const video = storyBody.querySelector('video');
  if (video) { film.pause(); video.play().catch(() => {}); }
}));
storyDialog.querySelector('.story-close').addEventListener('click', () => storyDialog.close());
storyDialog.addEventListener('close', () => {
  // Stop the dialog film when closing, including when Escape is used.
  storyBody.querySelector('video')?.pause();
  syncFilmPlayback();
});
storyDialog.addEventListener('click', event => {
  if (event.target !== storyDialog) return;
  const bounds = storyDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) storyDialog.close();
});

// Lazy-load and play the 3 craft journal card videos on hover/focus.
const supportsLazyMedia = Object.hasOwn(HTMLMediaElement.prototype, 'loading');
if (!supportsLazyMedia) {
  const lazyVideos = document.querySelectorAll('video[loading="lazy"]');
  const videoObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const media = entry.target;
      if (media.dataset.preload) {
        media.preload = media.dataset.preload;
        delete media.dataset.preload;
      }
      media.load();
      observer.unobserve(media);
    }
  }, {rootMargin: '250px 0px'});
  for (const media of lazyVideos) {
    if (media.hasAttribute('preload') && media.getAttribute('preload') !== 'none') {
      media.dataset.preload = media.getAttribute('preload');
    }
    media.preload = 'none';
    videoObserver.observe(media);
  }
}

document.querySelectorAll('.journal-card').forEach(card => {
  const hoverVideo = card.querySelector('.card-hover-video');
  if (!hoverVideo) return;
  const startPreview = () => {
    if (reducedMotion.matches) return;
    card.classList.add('is-playing');
    hoverVideo.play().catch(() => {});
  };
  const stopPreview = () => {
    card.classList.remove('is-playing');
    hoverVideo.pause();
  };
  card.addEventListener('pointerenter', startPreview);
  card.addEventListener('pointerleave', stopPreview);
  card.addEventListener('focus', startPreview);
  card.addEventListener('blur', stopPreview);
});

const qualitySection = document.querySelector('.quality-experience');
const qualityFeatures = qualitySection.querySelector('.quality-features');
const qualityButtons = qualitySection.querySelectorAll('[data-quality]');
const qualityLayers = qualitySection.querySelectorAll('[data-quality-media]');
let qualityActive = 'plain';
let qualityHoverSuppressed = false;
function showQuality(key) {
  if (!key || key === qualityActive) return;
  const prevKey = qualityActive;
  qualityActive = key;
  qualityButtons.forEach(button => {
    const active = button.dataset.quality === key;
    button.setAttribute('aria-expanded', String(active));
    button.closest('.quality-item').classList.toggle('is-active', active);
    qualitySection.querySelector('#' + button.getAttribute('aria-controls')).inert = !active;
  });
  qualityLayers.forEach(layer => {
    const mediaKey = layer.dataset.qualityMedia;
    if (mediaKey === key) {
      // Snap incoming plate and its image rotation to the bottom entry pose so it always rises and rotates upwards.
      layer.classList.add('is-snapping');
      layer.classList.remove('is-leaving', 'is-active');
      void layer.offsetWidth;
      layer.classList.remove('is-snapping');
      layer.classList.add('is-active');
      layer.setAttribute('aria-hidden', 'false');
    } else if (mediaKey === prevKey) {
      layer.classList.remove('is-active');
      layer.classList.add('is-leaving');
      layer.setAttribute('aria-hidden', 'true');
    } else {
      layer.classList.remove('is-active', 'is-leaving');
      layer.setAttribute('aria-hidden', 'true');
    }
  });
}
qualityButtons.forEach(button => {
  button.closest('.quality-item').addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse' && !qualityHoverSuppressed) showQuality(button.dataset.quality);
  });
  button.addEventListener('focus', () => showQuality(button.dataset.quality));
  button.addEventListener('click', () => {
    const key = button.dataset.quality;
    const item = button.closest('.quality-item');
    if (window.innerWidth <= 650 && item) {
      item.scrollIntoView({behavior: 'smooth', inline: 'center', block: 'nearest'});
      showQuality(key);
      return;
    }
    if (qualityActive === key) {
      qualityHoverSuppressed = true;
      showQuality('plain');
    } else {
      showQuality(key);
    }
  });
});

let qualityScrollRaf = 0;
function syncMobileQualityCards() {
  qualityScrollRaf = 0;
  if (window.innerWidth > 650) return;
  const trackRect = qualityFeatures.getBoundingClientRect();
  const trackCenter = trackRect.left + trackRect.width * 0.5;
  let closestKey = null;
  let closestDist = Infinity;
  qualityFeatures.querySelectorAll('[data-quality-item]').forEach(item => {
    const rect = item.getBoundingClientRect();
    const offset = (rect.left + rect.width * 0.5) - trackCenter;
    const dist = Math.abs(offset);
    const rot = Math.max(-7, Math.min(7, (offset / Math.max(1, trackRect.width)) * 9));
    item.style.setProperty('--card-bowl-rot', `${rot.toFixed(1)}deg`);
    if (dist < closestDist) {
      closestDist = dist;
      closestKey = item.dataset.qualityItem;
    }
  });
  if (closestKey) showQuality(closestKey);
}
qualityFeatures.addEventListener('scroll', () => {
  if (window.innerWidth > 650 || qualityScrollRaf) return;
  qualityScrollRaf = requestAnimationFrame(syncMobileQualityCards);
}, {passive: true});
window.addEventListener('resize', () => {
  if (window.innerWidth <= 650) syncMobileQualityCards();
});
syncMobileQualityCards();
qualityFeatures.addEventListener('pointerleave', event => {
  if (event.pointerType === 'mouse' && !qualityHoverSuppressed) showQuality('plain');
});
qualityFeatures.addEventListener('pointermove', event => {
  if (!qualityHoverSuppressed || (!event.movementX && !event.movementY)) return;
  qualityHoverSuppressed = false;
  const row = event.target.closest('[data-quality-item]');
  if (row && event.pointerType === 'mouse') showQuality(row.dataset.qualityItem);
});


// Transparent frame sequence allows precise, reversible scroll control without video seeking delays.
const grainSection = document.querySelector('.grain-scroll');
const grainCanvas = document.querySelector('#grain-canvas');
const grainContext = grainCanvas.getContext('2d');
const grainFrames = new Array(120);
let grainTarget = 0, grainTargetFloat = 0, grainCurrent = 0, grainDrawn = -1, grainTick = 0;
let grainInViewport = true;
// Keep annotations above the transparent grain while their source scenes scroll beneath it.
const grainStage = document.querySelector('.grain-scroll-stage');
const grainScenes = [...document.querySelectorAll('.grain-scene')].map(scene => {
  const callout = scene.querySelector('.grain-callout:not(.callout-feature)');
  const featureCallout = scene.querySelector('.grain-callout.callout-feature');
  grainStage.append(callout);
  callout.querySelector('svg')?.remove();
  const leader = document.createElementNS('http://www.w3.org/2000/svg','svg');
  leader.classList.add('grain-leader');
  leader.dataset.stage = callout.dataset.stage;
  leader.setAttribute('aria-hidden','true');
  leader.innerHTML = '<path pathLength="1"/><circle r="11" pathLength="1"/>';
  grainStage.append(leader);

  let featureLeader = null;
  if (featureCallout) {
    grainStage.append(featureCallout);
    featureLeader = document.createElementNS('http://www.w3.org/2000/svg','svg');
    featureLeader.classList.add('grain-leader','grain-leader-feature');
    featureLeader.dataset.stage = featureCallout.dataset.stage;
    featureLeader.setAttribute('aria-hidden','true');
    featureLeader.innerHTML = '<path pathLength="1"/><circle class="feature-dot" r="5"/>';
    grainStage.insertBefore(featureLeader, grainCanvas);
  }
  return {scene, callout, leader, featureCallout, featureLeader};
});
function pickLoadedGrainFrame(index) {
  const exact = grainFrames[index];
  if (exact?.complete && exact.naturalWidth) return {frame: exact, index};
  for (let offset = 1; offset < grainFrames.length; offset++) {
    const prev = index - offset;
    if (prev >= 0 && grainFrames[prev]?.complete && grainFrames[prev].naturalWidth) return {frame: grainFrames[prev], index: prev};
    const next = index + offset;
    if (next < grainFrames.length && grainFrames[next]?.complete && grainFrames[next].naturalWidth) return {frame: grainFrames[next], index: next};
  }
  return null;
}
function mapScrollToGrainFrame(scrolled, endScroll, screen, boundsTop) {
  const d0 = grainScenes[0].scene.getBoundingClientRect().top - boundsTop;
  const d1 = grainScenes[1].scene.getBoundingClientRect().top - boundsTop;
  const d2 = grainScenes[2].scene.getBoundingClientRect().top - boundsTop;
  // Align the 3 carved 3D reliefs (Farms=24, Mill=55, Bowl=88) with each scene's focal scroll window,
  // hold Bowl/Table (86..90) squarely across Scene 2 ("Today."), and finish the 360° turn (90..119)
  // only once 60% of the rice grain has scrolled out of the frame (endScroll).
  const rawStops = [
    [0, 0],
    [d0 + screen * 0.22, 24],
    [d1 - screen * 0.50, 38],
    [d1 + screen * 0.22, 55],
    [d2 - screen * 0.50, 73],
    [d2 + screen * 0.16, 86],
    [d2 + screen * 0.34, 90],
    [endScroll, grainFrames.length - 1]
  ];
  const stops = [rawStops[0]];
  for (let i = 1; i < rawStops.length; i++) {
    const minPos = stops[i - 1][0] + 1;
    stops.push([Math.max(minPos, rawStops[i][0]), rawStops[i][1]]);
  }
  const maxPos = stops[stops.length - 1][0];
  const clampedScroll = Math.min(maxPos, Math.max(0, scrolled));
  for (let i = 0; i < stops.length - 1; i++) {
    const [sA, fA] = stops[i];
    const [sB, fB] = stops[i + 1];
    if (clampedScroll <= sB) {
      const t = (clampedScroll - sA) / Math.max(1, sB - sA);
      return fA + t * (fB - fA);
    }
  }
  return grainFrames.length - 1;
}
function drawGrain() {
  grainTick = 0;
  if (reducedMotion.matches) {
    grainCurrent = grainTargetFloat;
  } else {
    const diff = grainTargetFloat - grainCurrent;
    if (Math.abs(diff) > 0.06) {
      grainCurrent += diff * 0.32;
      if (grainInViewport) grainTick = requestAnimationFrame(drawGrain);
    } else {
      grainCurrent = grainTargetFloat;
    }
  }
  grainTarget = Math.min(grainFrames.length - 1, Math.max(0, Math.round(grainCurrent)));
  const resolved = pickLoadedGrainFrame(grainTarget);
  if (resolved && grainDrawn !== resolved.index) {
    grainContext.imageSmoothingEnabled = true;
    grainContext.imageSmoothingQuality = 'high';
    grainContext.clearRect(0, 0, grainCanvas.width, grainCanvas.height);
    grainContext.drawImage(resolved.frame, 0, 0, grainCanvas.width, grainCanvas.height);
    grainDrawn = resolved.index;
  }
}
function updateGrainScroll() {
  if (!grainInViewport) return;
  const header = filmHeaderHeight();
  const bounds = grainSection.getBoundingClientRect();
  const screen = Math.max(1, innerHeight - header);
  const pinTravel = Math.max(1, grainSection.offsetHeight - screen);
  const mobileStage = innerWidth <= 650;
  const canvasH = screen * (mobileStage ? 0.72 : 1);
  const canvasTopInStage = (mobileStage ? 0.37 : 0.50) * screen - canvasH * 0.5;
  const grainTopInStage = canvasTopInStage + 0.056 * canvasH;
  const grainHeight = (0.931 - 0.056) * canvasH;
  // Extra scroll distance after unpinning until 60% of the rice grain has exited the frame above the header.
  const exit60 = Math.max(1, grainTopInStage + 0.60 * grainHeight);
  const endScroll = pinTravel + exit60;
  const rawScrolled = Math.max(0, header - bounds.top);
  const pinnedScrolled = Math.min(pinTravel, rawScrolled);
  const rotationScrolled = Math.min(endScroll, rawScrolled);
  const progress = rotationScrolled / endScroll;
  grainSection.style.setProperty('--grain-progress', pinnedScrolled / pinTravel);
  // Scenes and annotations move naturally with the page; only the grain stays centred.
  const firstSceneTop = grainScenes[0].scene.getBoundingClientRect().top;
  const lastSceneBottom = grainScenes[grainScenes.length - 1].scene.getBoundingClientRect().bottom;
  const sceneIndex = (firstSceneTop > header + 42 || lastSceneBottom < header + 42)
    ? 'lead'
    : String(Math.min(2, Math.max(0, Math.floor((header - firstSceneTop + screen / 2) / screen))));
  grainSection.dataset.scene = sceneIndex;
  if (reducedMotion.matches) {
    // Respect prefers-reduced-motion by snapping cleanly to each scene's static carved relief instead of spinning continuously.
    grainTargetFloat = sceneIndex === '0' ? 24 : sceneIndex === '1' ? 55 : (sceneIndex === '2' || (rawScrolled > pinTravel && rawScrolled < endScroll)) ? 88 : (progress > 0.5 ? 119 : 0);
  } else {
    grainTargetFloat = mapScrollToGrainFrame(rotationScrolled, endScroll, screen, bounds.top);
  }
  grainTarget = Math.round(grainTargetFloat);
  grainScenes.forEach(({scene,callout,leader,featureCallout,featureLeader})=>{
    const rect=scene.getBoundingClientRect();
    const screen=innerHeight-header;
    const phase=(header-rect.top)/screen;
    const clamp=value=>Math.min(1,Math.max(0,value));
    const smooth=value=>{const x=clamp(value);return x*x*(3-2*x);};
    const reveal=smooth((phase+.27)/.32)*(1-smooth((phase-.4)/.32));
    const drift=reducedMotion.matches ? 0 : -phase*screen*.22;
    scene.style.setProperty('--word-drift',`${reducedMotion.matches?0:phase*screen*.3}px`);
    callout.style.setProperty('--callout-drift',`${drift}px`);
    callout.style.setProperty('--reveal',reveal);
    const fade=1-smooth((phase-.56)/.24);
    const ring=smooth((phase+.56)/.11)*fade;
    const line=smooth((phase+.45)/.14)*fade;
    const text=smooth((phase+.32)/.14)*fade;
    callout.style.setProperty('--text-reveal',text);
    leader.style.setProperty('--ring',ring);
    leader.style.setProperty('--line',line);
    leader.style.opacity=fade;
    const stageRect=grainStage.getBoundingClientRect();
    const textRect=callout.getBoundingClientRect();
    const mobile=innerWidth<=650;
    const right=callout.classList.contains('callout-right');
    const x=stageRect.width/2+(right?28:-28);
    const y=stageRect.height*(mobile?.43:.56);
    const h3El=callout.querySelector('h3');
    const h3Rect=h3El?h3El.getBoundingClientRect():textRect;
    const endX=mobile ? (right?textRect.right-55:textRect.left+55) : (right?textRect.left-16:textRect.right+16);
    const endY=mobile ? textRect.top-stageRect.top-18 : (h3Rect.top+18)-stageRect.top;
    const bendX=x+(endX-x)*.38;
    leader.setAttribute('viewBox',`0 0 ${stageRect.width} ${stageRect.height}`);
    leader.querySelector('path').setAttribute('d',`M${x} ${y} L${bendX} ${endY} H${endX}`);
    leader.querySelector('circle').setAttribute('cx',x);
    leader.querySelector('circle').setAttribute('cy',y);
    callout.setAttribute('aria-hidden',text<.1);

    if (featureCallout && featureLeader) {
      const fLine = smooth((phase + .15) / .14) * fade;
      const fDot = smooth((phase + .02) / .08) * fade;
      const fText = smooth((phase - .01) / .14) * fade;
      const fReveal = smooth((phase + .02) / .24) * (1 - smooth((phase - .56) / .24));
      featureCallout.style.setProperty('--callout-drift', `${drift}px`);
      featureCallout.style.setProperty('--reveal', fReveal);
      featureCallout.style.setProperty('--text-reveal', fText);
      featureLeader.style.setProperty('--line', fLine);
      featureLeader.style.setProperty('--dot', fDot);
      featureLeader.style.opacity = fade;
      const fRect = featureCallout.getBoundingClientRect();
      const headingEl = featureCallout.querySelector('.feature-heading');
      const headingRect = headingEl ? headingEl.getBoundingClientRect() : fRect;
      const fRight = featureCallout.classList.contains('callout-right');
      const fStartX = stageRect.width * 0.5;
      const fEndX = mobile
        ? (fRight ? fRect.left - 10 : fRect.right + 10)
        : (fRight ? fRect.left - 18 : fRect.right + 18);
      const fEndY = (headingRect.top + headingRect.height * 0.5) - stageRect.top;
      featureLeader.setAttribute('viewBox', `0 0 ${stageRect.width} ${stageRect.height}`);
      featureLeader.querySelector('path').setAttribute('d', `M${fStartX} ${fEndY} H${fEndX}`);
      const dotEl = featureLeader.querySelector('circle');
      dotEl.setAttribute('cx', fEndX);
      dotEl.setAttribute('cy', fEndY);
      featureCallout.setAttribute('aria-hidden', fText < .1);
    }
  });
  if (!grainTick) grainTick=requestAnimationFrame(drawGrain);
}
function loadGrainFrame(i) {
  if (grainFrames[i]) return;
  const img = new Image();
  grainFrames[i] = img;
  img.onload = () => {
    if (i === grainTarget || grainDrawn < 0) {
      if (!grainTick) grainTick = requestAnimationFrame(drawGrain);
    }
  };
  img.src = `assets/grain-scroll-clean/${String(i).padStart(3,'0')}.webp?v=carved-grain-v4`;
}
loadGrainFrame(0);
// Load key sculpted frames first, then stream the full 120-frame rotation as the reader approaches the section.
const grainLoader = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) {
    [24, 38, 55, 73, 88, 119].forEach(loadGrainFrame);
    for (let i = 1; i < grainFrames.length; i++) loadGrainFrame(i);
    grainLoader.disconnect();
  }
}, {rootMargin: '1400px 0px'});
grainLoader.observe(grainSection);
// Pause scroll/canvas calculations when the grain section is far outside the viewport.
const grainActivityObserver = new IntersectionObserver(entries => {
  const wasActive = grainInViewport;
  grainInViewport = entries[0].isIntersecting;
  if (grainInViewport && !wasActive) updateGrainScroll();
}, {rootMargin: '350px 0px'});
grainActivityObserver.observe(grainSection);
window.addEventListener('scroll', updateGrainScroll, {passive: true});
window.addEventListener('resize', () => {
  const prev = grainInViewport;
  grainInViewport = true;
  updateGrainScroll();
  grainInViewport = prev;
});
updateGrainScroll();

// Scroll parallax, bidirectional scroll rotation, and cursor proximity repulsion for the hero grains.
const heroGrainsConfig = [
  {vy: -0.25, vx: -0.05, vrot: 0.18, depth: 1.0},   // l1 (mid)
  {vy: -0.46, vx: -0.11, vrot: -0.28, depth: 1.35}, // l2 (near)
  {vy: -0.22, vx: -0.04, vrot: 0.21, depth: 1.0},   // l3 (mid)
  {vy: -0.11, vx: -0.02, vrot: -0.12, depth: 0.55}, // l4 (far)
  {vy: -0.13, vx: -0.03, vrot: 0.14, depth: 0.52},  // l5 (far)
  {vy: -0.35, vx: -0.08, vrot: 0.24, depth: 1.18},  // l6 (near-mid)
  {vy: -0.28, vx: 0.06, vrot: -0.22, depth: 1.0},   // r1 (mid)
  {vy: -0.24, vx: 0.05, vrot: 0.25, depth: 1.0},    // r2 (mid)
  {vy: -0.40, vx: 0.09, vrot: -0.24, depth: 1.25},  // r3 (near)
  {vy: -0.12, vx: 0.02, vrot: 0.13, depth: 0.55},   // r4 (far)
  {vy: -0.48, vx: 0.12, vrot: -0.30, depth: 1.38},  // r5 (near)
  {vy: -0.10, vx: 0.02, vrot: -0.11, depth: 0.50}   // r6 (far)
];
const heroGrains = [...document.querySelectorAll('.hero-grain')].map((el, i) => ({
  el,
  ...(heroGrainsConfig[i] || {vy: -0.22, vx: 0, vrot: 0.18, depth: 1.0}),
  rx: 0, ry: 0, rrot: 0,
  tx: 0, ty: 0, trot: 0
}));
const showcaseGrainsConfig = [
  {vy: -0.022, vx: -0.008, vrot: 0.045, depth: 1.0},  // show-g1 (mid)
  {vy: -0.038, vx: -0.014, vrot: -0.068, depth: 1.35},// show-g2 (near)
  {vy: -0.012, vx: -0.004, vrot: -0.028, depth: 0.55},// show-g3 (far)
  {vy: -0.024, vx: -0.007, vrot: 0.052, depth: 1.05}, // show-g4 (mid)
  {vy: -0.035, vx: -0.011, vrot: 0.062, depth: 1.28}, // show-g5 (near)
  {vy: -0.014, vx: -0.005, vrot: 0.032, depth: 0.58}, // show-g6 (far)
  {vy: -0.024, vx: 0.008, vrot: -0.048, depth: 1.0},  // show-g7 (mid)
  {vy: -0.036, vx: 0.013, vrot: -0.064, depth: 1.32}, // show-g8 (near)
  {vy: -0.012, vx: 0.004, vrot: 0.030, depth: 0.55},  // show-g9 (far)
  {vy: -0.025, vx: 0.007, vrot: 0.054, depth: 1.05},  // show-g10 (mid)
  {vy: -0.040, vx: 0.014, vrot: -0.070, depth: 1.35}, // show-g11 (near)
  {vy: -0.011, vx: 0.004, vrot: -0.026, depth: 0.52}  // show-g12 (far)
];
const showcaseGrains = [...document.querySelectorAll('.show-grain')].map((el, i) => ({
  el,
  ...(showcaseGrainsConfig[i] || {vy: -0.022, vx: 0, vrot: 0.045, depth: 1.0}),
  rx: 0, ry: 0, rrot: 0,
  tx: 0, ty: 0, trot: 0
}));
const allRepelGrains = [...heroGrains, ...showcaseGrains];
let pointerX = -9999, pointerY = -9999, heroRepelRaf = 0;

function updateHeroGrainsScroll() {
  if (reducedMotion.matches) {
    heroGrains.forEach(({el}) => {
      el.style.setProperty('--scroll-x', '0px');
      el.style.setProperty('--scroll-y', '0px');
      el.style.setProperty('--scroll-rot', '0deg');
    });
    return;
  }
  const y = Math.min(window.scrollY, 900);
  heroGrains.forEach(g => {
    g.el.style.setProperty('--scroll-x', `${(y * g.vx).toFixed(2)}px`);
    g.el.style.setProperty('--scroll-y', `${(y * g.vy).toFixed(2)}px`);
    g.el.style.setProperty('--scroll-rot', `${(y * g.vrot).toFixed(2)}deg`);
  });
}

function stepHeroGrainsRepel() {
  heroRepelRaf = 0;
  if (reducedMotion.matches) return;
  const baseRadius = 195;
  const basePush = 48;
  let moving = false;

  allRepelGrains.forEach(g => {
    const rect = g.el.getBoundingClientRect();
    if (!rect.width && !rect.height) return;
    if (rect.bottom < -120 || rect.top > innerHeight + 120) return;
    // Subtract current repulsion offset so the rest anchor never drifts.
    const anchorX = rect.left + rect.width * 0.5 - g.rx;
    const anchorY = rect.top + rect.height * 0.5 - g.ry;
    const dx = anchorX - pointerX;
    const dy = anchorY - pointerY;
    const dist = Math.hypot(dx, dy);
    const radius = baseRadius * (0.75 + 0.25 * g.depth);

    if (dist < radius && dist > 0.01) {
      const falloff = Math.pow(1 - dist / radius, 1.55);
      const push = basePush * g.depth;
      g.tx = (dx / dist) * falloff * push;
      g.ty = (dy / dist) * falloff * push;
      g.trot = ((dx >= 0 ? 1 : -1) * 0.65 + (dy / radius) * 0.35) * falloff * 24 * g.depth;
    } else {
      g.tx = 0;
      g.ty = 0;
      g.trot = 0;
    }

    g.rx += (g.tx - g.rx) * 0.14;
    g.ry += (g.ty - g.ry) * 0.14;
    g.rrot += (g.trot - g.rrot) * 0.14;

    if (Math.abs(g.tx - g.rx) > 0.08 || Math.abs(g.ty - g.ry) > 0.08 || Math.abs(g.trot - g.rrot) > 0.08) {
      moving = true;
    } else {
      g.rx = g.tx;
      g.ry = g.ty;
      g.rrot = g.trot;
    }

    g.el.style.setProperty('--repel-x', `${g.rx.toFixed(2)}px`);
    g.el.style.setProperty('--repel-y', `${g.ry.toFixed(2)}px`);
    g.el.style.setProperty('--repel-rot', `${g.rrot.toFixed(2)}deg`);
  });

  if (moving) heroRepelRaf = requestAnimationFrame(stepHeroGrainsRepel);
}

window.addEventListener('pointermove', event => {
  if (event.pointerType === 'touch' || reducedMotion.matches) return;
  pointerX = event.clientX;
  pointerY = event.clientY;
  if (!heroRepelRaf) heroRepelRaf = requestAnimationFrame(stepHeroGrainsRepel);
}, {passive: true});

window.addEventListener('pointerleave', () => {
  pointerX = -9999;
  pointerY = -9999;
  if (!heroRepelRaf) heroRepelRaf = requestAnimationFrame(stepHeroGrainsRepel);
});

window.addEventListener('scroll', () => {
  updateHeroGrainsScroll();
  if (pointerX > -9000 && !heroRepelRaf) heroRepelRaf = requestAnimationFrame(stepHeroGrainsRepel);
}, {passive: true});
updateHeroGrainsScroll();

// Live sync for the latest post from the official SSIEL WordPress blog API (https://ssiel.com/blog/).
async function syncLatestSsielBlogPost() {
  const titleEl = document.getElementById('live-blog-title');
  const excerptEl = document.getElementById('live-blog-excerpt');
  const dateEl = document.getElementById('live-blog-date');
  if (!titleEl || !excerptEl) return;
  try {
    const res = await fetch('https://ssiel.com/wp-json/wp/v2/posts?_embed&per_page=1');
    if (!res.ok) return;
    const posts = await res.json();
    const post = posts && posts[0];
    if (!post) return;
    const decodeHtml = html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return (doc.body.textContent || '').trim();
    };
    if (post.title?.rendered) {
      const rawTitle = decodeHtml(post.title.rendered).replace(/\s+/g, ' ');
      titleEl.textContent = rawTitle.length > 68
        ? `${rawTitle.slice(0, 65).replace(/[,:\s]+\S*$/, '')}…`
        : rawTitle;
    }
    if (post.link) {
      titleEl.href = post.link;
    }
    if (post.excerpt?.rendered) {
      const cleanExcerpt = decodeHtml(post.excerpt.rendered).replace(/\s+/g, ' ');
      if (cleanExcerpt) {
        excerptEl.textContent = cleanExcerpt.length > 110
          ? `${cleanExcerpt.slice(0, 107).replace(/\s+\S*$/, '')}…`
          : cleanExcerpt;
      }
    }
    if (post.date && dateEl) {
      const d = new Date(post.date);
      if (!Number.isNaN(d.getTime())) {
        dateEl.textContent = d.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}).toUpperCase();
      }
    }
  } catch {
    // Fallback to the pre-fetched latest SSIEL blog article already rendered in HTML.
  }
}
syncLatestSsielBlogPost();

// Interactive Culinary Inspiration (#recipes) dish selector, servings stepper, and cooking ratio calculator.
(function initCulinaryInspiration() {
  const stylesEl = document.getElementById('styles');
  const lessBtn = document.getElementById('less');
  const moreBtn = document.getElementById('more');
  const servingsEl = document.getElementById('servings');
  const mLiq = document.getElementById('mLiq');
  const mRice = document.getElementById('mRice');
  const mCups = document.getElementById('mCups');
  const mWater = document.getElementById('mWater');
  const mRatio = document.getElementById('mRatio');
  const mSoak = document.getElementById('mSoak');
  const mCook = document.getElementById('mCook');
  const mRest = document.getElementById('mRest');
  const stepsEl = document.getElementById('steps');
  if (!stylesEl || !servingsEl || !stepsEl) return;

  const recipeStyles = {
    vegbiryani: {
      per: 75,
      boil: true,
      soak: 30,
      cook: 7,
      rest: 'then 20 min on low steam',
      steps: [
        ['Wash & soak', 'Wash Leysha Nayaab 1121 XXXL rice 3–4 times until clear, then soak for 30 minutes while you prepare your vegetable gravy.'],
        ['Boil halfway', 'Boil the soaked rice in plenty of salted water with bay leaf and cardamom for 7 minutes until it is about 70% cooked.'],
        ['Drain & layer', 'Drain the water right away and spread the rice over your vegetables with mint, fried onions, and a little saffron milk.'],
        ['Cover & steam (Dum)', 'Cover the pot with a tight lid and cook on the lowest flame for 20 minutes. Let it rest 5 minutes before serving.']
      ]
    },
    zarda: {
      per: 60,
      boil: true,
      soak: 30,
      cook: 6,
      rest: 'then 15 min covered on low',
      steps: [
        ['Wash & soak', 'Wash and soak Leysha Utsav Golden Sella rice for 30 minutes. Warm two spoons of milk with a pinch of saffron.'],
        ['Boil until tender', 'Boil the drained rice with green cardamom and cloves for 6 minutes until nearly cooked, then drain out the water.'],
        ['Mix with sugar & nuts', 'Heat ghee in a pan, add the rice, sugar (about half the weight of the rice), saffron milk, raisins, and almonds.'],
        ['Cover & finish', 'Cover tightly and cook on a low flame for 15 minutes until the syrup is absorbed. Fluff gently and serve warm.']
      ]
    },
    pulao: {
      per: 65,
      ratio: 1.8,
      soak: 25,
      cook: 10,
      rest: 'then 5 min covered off heat',
      steps: [
        ['Wash & soak', 'Rinse Leysha Super Dubar rice 3 times until the water looks clear, then soak for 25 minutes so the grains cook evenly.'],
        ['Sauté spices & veggies', 'Warm ghee in a pot, crackle cumin, bay leaf, and cloves, then sauté sliced onions, peas, carrots, and beans for 3 minutes.'],
        ['Simmer on low', 'Add the drained rice, measured water, and salt. Bring to a boil, then cover and simmer on a low flame for 10 minutes.'],
        ['Rest & fluff', 'Turn off the stove and let the pot rest covered for 5 minutes before fluffing the non-sticky grains gently with a fork.']
      ]
    },
    jeera: {
      per: 65,
      ratio: 1.9,
      soak: 20,
      cook: 9,
      rest: 'then 5 min covered off heat',
      steps: [
        ['Wash & soak', 'Wash Leysha Super Tibar rice gently until clear and soak for 20 minutes for light, fluffy grains.'],
        ['Temper cumin in ghee', 'Melt a generous spoon of ghee in a pan and let cumin seeds, a slit green chilli, and a bay leaf sizzle until fragrant.'],
        ['Add rice & water', 'Fold in the drained rice gently for 30 seconds, pour in the measured water and salt, and bring to a lively boil.'],
        ['Cover & steam', 'Cover tightly, cook on low heat for 9 minutes until all water is absorbed, rest 5 minutes, and top with fresh coriander.']
      ]
    },
    kheer: {
      per: 20,
      milk: 250,
      soak: 30,
      cook: 35,
      rest: 'stir often, serve warm or chilled',
      steps: [
        ['Wash & soak', 'Wash Leysha Mogra rice well and soak it in water for 30 minutes so the sweet, soft small grains cook smoothly.'],
        ['Boil the milk', 'Bring full-cream milk to a boil in a heavy pan, add the drained Mogra rice, and turn the flame to low.'],
        ['Simmer slowly', 'Cook on a low flame for about 35 minutes, stirring every few minutes until the milk turns thick, rich, and creamy.'],
        ['Sweeten & garnish', 'Add sugar and cardamom powder, stir until dissolved, and garnish with chopped almonds, pistachios, and saffron.']
      ]
    }
  };

  let currentStyle = 'vegbiryani';
  let serv = 4;

  function updateMeasures() {
    const s = recipeStyles[currentStyle];
    const g = serv * s.per;
    const cups = g / 190;
    const water = s.milk ? serv * s.milk : s.boil ? g * 8 : Math.round(cups * s.ratio * 240 / 10) * 10;
    mLiq.textContent = s.milk ? 'Milk' : 'Water';
    servingsEl.textContent = serv;
    mRice.textContent = `${g} g`;
    mCups.textContent = `about ${cups.toFixed(1)} cups`;
    mWater.textContent = water >= 1000 ? `${(water / 1000).toFixed(1)} L` : `${water} ml`;
    mRatio.textContent = s.milk ? 'full-fat milk' : s.boil ? 'a full pot, drained later' : `1 : ${s.ratio} rice to water`;
    mSoak.textContent = `${s.soak} min`;
    mCook.textContent = `${s.cook} min`;
    mRest.textContent = s.rest;
    stepsEl.innerHTML = s.steps.map(t => `<li><b>${t[0]}</b><span>${t[1]}</span></li>`).join('');
  }

  stylesEl.addEventListener('click', event => {
    const btn = event.target.closest('button');
    if (!btn) return;
    currentStyle = btn.getAttribute('data-style');
    stylesEl.querySelectorAll('button').forEach(x => {
      x.setAttribute('aria-pressed', String(x === btn));
    });
    document.querySelectorAll('.cook-dish-item').forEach(item => {
      item.classList.toggle('is-active', item.getAttribute('data-cook-visual') === currentStyle);
    });
    if (stylesEl.scrollWidth > stylesEl.clientWidth) {
      const targetLeft = btn.offsetLeft - (stylesEl.clientWidth - btn.offsetWidth) * 0.5;
      stylesEl.scrollTo({left: Math.max(0, targetLeft), behavior: reducedMotion.matches ? 'auto' : 'smooth'});
    }
    updateMeasures();
  });

  lessBtn?.addEventListener('click', () => {
    serv = Math.max(1, serv - 1);
    updateMeasures();
  });

  moreBtn?.addEventListener('click', () => {
    serv = Math.min(12, serv + 1);
    updateMeasures();
  });

  updateMeasures();
})();

// Utmost bottom footer expandable Popular Search & About Leysha Rice sections with hidden="until-found" support.
(() => {
  const facc = document.querySelector('.footer-utmost-bottom .facc');
  if (!facc) return;
  const supportsBeforeMatch = 'onbeforematch' in HTMLElement.prototype;

  facc.querySelectorAll('.fq-btn').forEach(btn => {
    const item = btn.closest('.fq');
    const panel = item ? item.querySelector('.fq-panel') : null;
    if (!item || !panel) return;

    btn.addEventListener('click', () => {
      const nextOpen = !item.classList.contains('open');
      item.classList.toggle('open', nextOpen);
      btn.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
      if (nextOpen) {
        panel.removeAttribute('hidden');
      } else if (supportsBeforeMatch) {
        panel.setAttribute('hidden', 'until-found');
      }
    });
  });

  facc.addEventListener('beforematch', event => {
    const panel = event.target.closest('.fq-panel');
    if (!panel) return;
    const item = panel.closest('.fq');
    const btn = item ? item.querySelector('.fq-btn') : null;
    panel.removeAttribute('hidden');
    if (item) item.classList.add('open');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  });

  if (!supportsBeforeMatch) {
    facc.querySelectorAll('[hidden="until-found"]').forEach(el => {
      el.removeAttribute('hidden');
      const item = el.closest('.fq');
      const btn = item ? item.querySelector('.fq-btn') : null;
      if (item) item.classList.add('open');
      if (btn) btn.setAttribute('aria-expanded', 'true');
    });
  }
})();

// Pinned 5-slide Product Showcase (#range) with scroll-linked progress, watermark fill, grain parallax, and recipe handoff.
(() => {
  const showSection = document.querySelector('#range.show-range');
  if (!showSection) return;
  const showPin = showSection.querySelector('.show-pin');
  const showWords = [...showSection.querySelectorAll('.show-word span')];
  const showPacks = [...showSection.querySelectorAll('.show-pk')];
  const showLeftTxts = [...showSection.querySelectorAll('.show-l .show-txt')];
  const showRightTxts = [...showSection.querySelectorAll('.show-r .show-txt')];
  const showNavBtns = [...showSection.querySelectorAll('.show-nav button')];
  const showGrains = [...showSection.querySelectorAll('.show-grain')];
  const showSkip = showSection.querySelector('.show-skip');
  // Darker shade of each packshot pouch: Super Dubar (deep teal), Super Tibar (deep rosewood), Mogra (deep pewter), Nayaab (imperial emerald), Utsav (midnight sapphire).
  const showBgs = ['#215452', '#7e3b43', '#3d4147', '#0b2920', '#0d1554'];
  const supportsCssScrollTimeline = () => !reducedMotion.matches && CSS.supports('animation-timeline: scroll()') && CSS.supports('animation-range: 0% 100%');

  let activeIdx = -1;
  let showInViewport = true;
  let showRaf = 0;

  function renderShowcase() {
    showRaf = 0;
    const header = filmHeaderHeight();
    const bounds = showSection.getBoundingClientRect();
    const screen = Math.max(1, innerHeight - header);
    const travel = Math.max(1, showSection.offsetHeight - screen);
    const scrolled = Math.min(travel, Math.max(0, header - bounds.top));
    const count = showPacks.length;
    const seg = travel / count;
    const nextIdx = Math.min(count - 1, Math.max(0, Math.floor(scrolled / Math.max(1, seg))));
    const segProg = Math.min(1, Math.max(0, (scrolled - nextIdx * seg) / Math.max(1, seg)));

    if (nextIdx !== activeIdx) {
      activeIdx = nextIdx;
      showSection.style.setProperty('--show-bg', showBgs[activeIdx] || '#215452');
      for (let i = 0; i < count; i++) {
        const isCurrent = i === activeIdx;
        const isPast = i < activeIdx;
        showPacks[i]?.classList.toggle('on', isCurrent);
        showPacks[i]?.classList.toggle('out', isPast);
        showWords[i]?.classList.toggle('on', isCurrent);
        showWords[i]?.classList.toggle('out', isPast);
        showLeftTxts[i]?.classList.toggle('on', isCurrent);
        showRightTxts[i]?.classList.toggle('on', isCurrent);
        if (isCurrent) showNavBtns[i]?.setAttribute('aria-current', 'true');
        else showNavBtns[i]?.removeAttribute('aria-current');
      }
    }

    for (let i = 0; i < count; i++) {
      const fillPct = i < activeIdx ? 100 : i === activeIdx ? segProg * 100 : 0;
      showWords[i]?.style.setProperty('--fill', `${fillPct.toFixed(1)}%`);
    }

    if (reducedMotion.matches) {
      showcaseGrains.forEach(({el}) => {
        el.style.setProperty('--scroll-x', '0px');
        el.style.setProperty('--scroll-y', '0px');
        el.style.setProperty('--scroll-rot', '0deg');
      });
    } else {
      const driftDelta = scrolled - travel * 0.5;
      showcaseGrains.forEach(g => {
        g.el.style.setProperty('--scroll-x', `${(driftDelta * g.vx).toFixed(2)}px`);
        g.el.style.setProperty('--scroll-y', `${(driftDelta * g.vy).toFixed(2)}px`);
        g.el.style.setProperty('--scroll-rot', `${(driftDelta * g.vrot).toFixed(2)}deg`);
      });
    }

    if (!supportsCssScrollTimeline()) {
      for (let i = 0; i < count; i++) {
        const barFill = reducedMotion.matches
          ? (i <= activeIdx ? 1 : 0)
          : (i < activeIdx ? 1 : i === activeIdx ? segProg : 0);
        showNavBtns[i]?.style.setProperty('--f', barFill.toFixed(3));
      }
    }
  }

  function scheduleShowcase() {
    if (!showInViewport || showRaf) return;
    showRaf = requestAnimationFrame(renderShowcase);
  }

  showNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.showSlide) || 0;
      const header = filmHeaderHeight();
      const screen = Math.max(1, innerHeight - header);
      const travel = Math.max(1, showSection.offsetHeight - screen);
      const seg = travel / showPacks.length;
      const sectionStart = window.scrollY + showSection.getBoundingClientRect().top - header;
      window.scrollTo({
        top: sectionStart + (idx + 0.38) * seg,
        behavior: reducedMotion.matches ? 'auto' : 'smooth'
      });
    });
  });

  showSkip?.addEventListener('click', () => {
    const header = filmHeaderHeight();
    const nextSection = document.getElementById('quality');
    const targetTop = nextSection
      ? window.scrollY + nextSection.getBoundingClientRect().top - header
      : window.scrollY + showSection.getBoundingClientRect().bottom - header;
    window.scrollTo({
      top: targetTop,
      behavior: reducedMotion.matches ? 'auto' : 'smooth'
    });
  });

  showSection.querySelectorAll('.show-cta[data-cook-target]').forEach(cta => {
    cta.addEventListener('click', () => {
      const dish = cta.dataset.cookTarget;
      const dishBtn = document.querySelector(`#styles button[data-style="${dish}"]`);
      dishBtn?.click();
    });
  });

  const showObserver = new IntersectionObserver(entries => {
    const wasActive = showInViewport;
    showInViewport = entries[0].isIntersecting;
    if (showInViewport && !wasActive) renderShowcase();
  }, {rootMargin: '350px 0px'});
  showObserver.observe(showSection);

  window.addEventListener('scroll', scheduleShowcase, {passive: true});
  window.addEventListener('resize', () => {
    renderShowcase();
  });
  renderShowcase();
})();

// Hover-scoped 5-card "Field to Fork" section (#field-to-fork): wheel scrolling inside .ftf-stack advances cards, while scrolling anywhere else scrolls the page normally.
(() => {
  const ftfSection = document.querySelector('#field-to-fork.ftf');
  if (!ftfSection) return;
  const ftfStack = ftfSection.querySelector('.ftf-stack');
  const cards = [...ftfSection.querySelectorAll('.fc')];
  const railItems = [...ftfSection.querySelectorAll('.ftf-rail li')];
  const stepBtns = [...ftfSection.querySelectorAll('.ftf-step')];
  const railLine = ftfSection.querySelector('.ftf-line');
  const mapWipe = ftfSection.querySelector('#ftf-map-wipe');
  const cardVideos = cards.map(card => card.querySelector('video.fc-vid'));
  const lastIdx = Math.max(1, cards.length - 1);

  let activeIdx = -1;
  let ftfInViewport = false;
  let currentU = 0;
  let targetU = 0;
  let animRaf = 0;
  let snapTimer = 0;
  let lastWheelDir = 0;
  let boundaryCooldownUntil = 0;

  function syncVideos(enters, unders) {
    cardVideos.forEach((vid, i) => {
      if (!vid) return;
      const shouldPlay = ftfInViewport && !reducedMotion.matches && enters[i] < 0.96 && unders[i] < 0.96;
      if (shouldPlay) {
        if (vid.paused) vid.play().catch(() => {});
      } else if (!vid.paused) {
        vid.pause();
      }
    });
  }

  function applyU(u) {
    const clampedU = Math.min(lastIdx, Math.max(0, u));
    const normP = clampedU / lastIdx;
    const enters = [];
    const unders = [];
    let nextIdx = 0;

    for (let k = 0; k <= lastIdx; k++) {
      const enter = k === 0 ? 0 : Math.min(1, Math.max(0, k - clampedU));
      const under = k === lastIdx ? 0 : Math.min(1, Math.max(0, clampedU - k));
      enters.push(enter);
      unders.push(under);
      cards[k].style.setProperty('--enter', enter.toFixed(4));
      cards[k].style.setProperty('--under', under.toFixed(4));
      if (k > 0 && clampedU >= k - 0.45) nextIdx = k;
    }

    if (nextIdx !== activeIdx) {
      activeIdx = nextIdx;
      for (let k = 0; k <= lastIdx; k++) {
        const isCurrent = k === activeIdx;
        const isDone = k < activeIdx;
        cards[k].classList.toggle('on', isCurrent);
        railItems[k]?.classList.toggle('on', isCurrent);
        railItems[k]?.classList.toggle('done', isDone);
        if (isCurrent) stepBtns[k]?.setAttribute('aria-current', 'step');
        else stepBtns[k]?.removeAttribute('aria-current');
      }
    }

    if (railLine) {
      railLine.style.setProperty('--rp', normP.toFixed(4));
    }

    if (mapWipe) {
      if (reducedMotion.matches) {
        mapWipe.setAttribute('r', '1050');
      } else {
        const enterMap = enters[lastIdx] ?? 1;
        const wipeLin = Math.min(1, Math.max(0, (1 - enterMap) * 1.22));
        const wipeEase = wipeLin * (2 - wipeLin);
        mapWipe.setAttribute('r', (wipeEase * 1050).toFixed(1));
      }
    }

    syncVideos(enters, unders);
  }

  function tickAnim() {
    animRaf = 0;
    if (reducedMotion.matches) {
      currentU = targetU;
      applyU(currentU);
      return;
    }
    const diff = targetU - currentU;
    if (Math.abs(diff) < 0.0015) {
      currentU = targetU;
      applyU(currentU);
      return;
    }
    currentU += diff * 0.16;
    applyU(currentU);
    animRaf = requestAnimationFrame(tickAnim);
  }

  function startAnim() {
    if (!animRaf) {
      animRaf = requestAnimationFrame(tickAnim);
    }
  }

  ftfStack?.addEventListener('wheel', event => {
    const dy = event.deltaMode === 1 ? event.deltaY * 36 : event.deltaMode === 2 ? event.deltaY * 360 : event.deltaY;
    if (Math.abs(dy) < 0.5 || Math.abs(event.deltaX) > Math.abs(event.deltaY) * 1.5) return;

    const now = performance.now();
    const atStart = currentU <= 0.02 && targetU <= 0.02;
    const atEnd = currentU >= lastIdx - 0.02 && targetU >= lastIdx - 0.02;
    if ((dy < 0 && atStart && now > boundaryCooldownUntil) || (dy > 0 && atEnd && now > boundaryCooldownUntil)) {
      return;
    }

    event.preventDefault();
    const prevTarget = targetU;
    targetU = Math.min(lastIdx, Math.max(0, targetU + dy / 250));
    lastWheelDir = Math.sign(dy);

    if ((prevTarget < lastIdx - 0.02 && targetU >= lastIdx - 0.02) || (prevTarget > 0.02 && targetU <= 0.02)) {
      boundaryCooldownUntil = now + 380;
    }

    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      const base = Math.floor(targetU);
      const frac = targetU - base;
      if (frac > 0.001 && frac < 0.999) {
        targetU = lastWheelDir > 0
          ? (frac > 0.2 ? Math.min(lastIdx, base + 1) : base)
          : (frac < 0.8 ? base : Math.min(lastIdx, base + 1));
        startAnim();
      }
    }, 140);

    startAnim();
  }, {passive: false});

  let touchStartX = 0;
  let touchStartY = 0;
  ftfStack?.addEventListener('touchstart', event => {
    const t = event.touches[0];
    if (!t) return;
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }, {passive: true});

  ftfStack?.addEventListener('touchend', event => {
    const t = event.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      targetU = dx < 0 ? Math.min(lastIdx, Math.round(targetU) + 1) : Math.max(0, Math.round(targetU) - 1);
      startAnim();
    }
  }, {passive: true});

  stepBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const k = Math.min(lastIdx, Math.max(0, Number(btn.dataset.ftfStep) || 0));
      clearTimeout(snapTimer);
      targetU = k;
      startAnim();
    });
  });

  const ftfObserver = new IntersectionObserver(entries => {
    const wasActive = ftfInViewport;
    ftfInViewport = entries[0].isIntersecting;
    if (ftfInViewport && !wasActive) {
      applyU(currentU);
    } else if (!ftfInViewport && wasActive) {
      cardVideos.forEach(vid => {
        if (vid && !vid.paused) vid.pause();
      });
    }
  }, {rootMargin: '300px 0px'});
  ftfObserver.observe(ftfSection);

  reducedMotion.addEventListener('change', () => {
    currentU = Math.round(targetU);
    targetU = currentU;
    applyU(currentU);
  });

  applyU(currentU);
})();
