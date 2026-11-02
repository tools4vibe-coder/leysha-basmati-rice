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
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('open', open);
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menu.setAttribute('aria-expanded', 'false');
  nav.classList.remove('open');
}));
const products = {
  shahi: {name: 'Shahi Pasand', image: 'shahi-cutout.png', copy: 'Leysha Shahi Pasand Basmati Rice. Sweet and soft, with rich aroma—crafted for every cuisine.', sizes: 'Shown in a 1 kg pack. Contact our team for available pack sizes.'},
  supermax: {name: 'SuperMaxxx', image: 'supermax-cutout.png', copy: 'Leysha SuperMaxxx Basmati Rice. Long and slender grains with rich aroma, ready for your favourite rice creations.', sizes: 'Shown in a 1 kg pack. Contact our team for available pack sizes.'},
  virasat: {name: 'Virasat Biryani', image: 'shahi-cutout.png', copy: 'Aged basmati with a gentle vintage aroma and 2× grain elongation, crafted for layered biryanis and the occasions that bring everyone together.', sizes: 'Available in 1 kg, 5 kg and 10 kg packs.'},
  nainital: {name: 'Nainital Special', image: 'nainital-cutout.png', copy: 'Part of Leysha’s steam basmati collection. Speak with our team to find the right pack for your kitchen or business.', sizes: 'Available in 1 kg, 5 kg, 10 kg and 30 kg packs.'},
  goldensella: {name: 'Golden Sella', image: 'supermax-cutout.png', copy: 'Parboiled golden basmati engineered to stay firm, separate and aromatic through slow dum cooking and large gatherings.', sizes: 'Available in 1 kg, 5 kg, 10 kg and 25 kg packs.'},
  creamsella: {name: 'Cream Sella', image: 'nainital-cutout.png', copy: 'Parboiled creamy ivory basmati with tender texture, delicate aroma and dependable grain separation in every pot.', sizes: 'Available in 1 kg, 5 kg, 10 kg and 25 kg packs.'}
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

// Horizontal stamp-ticket carousel in #range with arrow controls, dots, and scrollsnapchange sync.
const rangeCarousel = document.querySelector('#range-carousel');
const rangeTickets = [...document.querySelectorAll('#range-carousel .stamp-ticket')];
const rangeDots = [...document.querySelectorAll('.range-dot')];
const rangeArrows = [...document.querySelectorAll('.range-arrow')];

function setActiveRangeSlide(index) {
  const clamped = Math.max(0, Math.min(rangeDots.length - 1, index));
  rangeDots.forEach((dot, i) => {
    const active = i === clamped;
    dot.classList.toggle('is-active', active);
    if (active) dot.setAttribute('aria-current', 'true');
    else dot.removeAttribute('aria-current');
  });
}

function scrollToRangeSlide(index) {
  const target = rangeTickets[index];
  if (!target || !rangeCarousel) return;
  const scrollerLeft = rangeCarousel.getBoundingClientRect().left;
  const targetLeft = target.getBoundingClientRect().left;
  rangeCarousel.scrollBy({left: targetLeft - scrollerLeft - 10, behavior: reducedMotion.matches ? 'auto' : 'smooth'});
  setActiveRangeSlide(index);
}

rangeArrows.forEach(btn => {
  btn.addEventListener('click', () => {
    if (!rangeCarousel || !rangeTickets.length) return;
    const dir = Number(btn.dataset.rangeDir) || 1;
    const cardWidth = rangeTickets[0].getBoundingClientRect().width + 30;
    rangeCarousel.scrollBy({left: dir * cardWidth, behavior: reducedMotion.matches ? 'auto' : 'smooth'});
  });
});

rangeDots.forEach(dot => {
  dot.addEventListener('click', () => scrollToRangeSlide(Number(dot.dataset.rangeSlide) || 0));
});

if (rangeCarousel) {
  if ('onscrollsnapchange' in HTMLElement.prototype) {
    rangeCarousel.addEventListener('scrollsnapchange', event => {
      const snapped = event.snapTargetInline;
      const idx = rangeTickets.indexOf(snapped);
      if (idx !== -1) setActiveRangeSlide(idx);
    });
  }
  let rangeScrollTick = 0;
  rangeCarousel.addEventListener('scroll', () => {
    if (rangeScrollTick) return;
    rangeScrollTick = requestAnimationFrame(() => {
      rangeScrollTick = 0;
      const scrollerLeft = rangeCarousel.getBoundingClientRect().left;
      let bestIdx = 0;
      let bestDist = Infinity;
      rangeTickets.forEach((card, i) => {
        const dist = Math.abs(card.getBoundingClientRect().left - scrollerLeft);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      });
      setActiveRangeSlide(bestIdx);
    });
  }, {passive: true});
}

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
  heritage: `<img class="story-banner" src="assets/factory.jpg" alt="SSIEL rice processing facility"><article class="story-content"><h2 id="story-title">The roots of our story.</h2><p>Before a grain reaches the kitchen, it carries the experience of the people who have worked with it. For Leysha, those roots lie in the rice-processing journey of Shiv Shakti Inter Globe Exports.</p><p>The story began with a small rice mill in 1967. In 1985, Shiv Shakti Rice Mill was established. The formation of SSIEL in 2012 brought an ultra-modern rice mill and a vision to take its rice to kitchens around the world.</p><div class="story-milestones"><div><strong>1967</strong><p>A small rice mill begins the journey.</p></div><div><strong>1985</strong><p>Shiv Shakti Rice Mill is established.</p></div><div><strong>2012</strong><p>SSIEL is formed, opening a new chapter.</p></div></div><h3>A legacy brought to the everyday.</h3><p>As part of the SSIEL family, Leysha brings this rice expertise to a collection made for different cuisines and occasions. Steam basmati, golden sella and cream sella each have a place in the kitchen, from a fragrant pulao to a biryani shared with family.</p><p>That is the spirit of Cook Brilliance Today: the pride of serving something made with care, on an ordinary day as much as a special one.</p><p class="story-source">Explore the company behind Leysha at <a href="https://ssiel.com/ssiel-history/" target="_blank" rel="noopener">SSIEL’s history ↗</a>.</p></article>`,
  film: `<video class="story-video" controls playsinline preload="metadata" poster="assets/hero-film-poster.jpg"><source src="assets/hero-film.mp4" type="video/mp4"></video><div class="story-content film-story-content"><h2 id="story-title">From field to table.</h2><p>A glimpse into the world of Leysha: the grain, the craft and the people behind it.</p></div>`,
  process: `<img class="story-banner" src="assets/lab.jpg" alt="Rice inspection in the SSIEL quality laboratory"><article class="story-content"><h2 id="story-title">The care in every grain.</h2><p>Rice has its own character. Processing and inspection help bring that character to the kitchen with consistency. Here is how SSIEL describes the journey behind its rice.</p><div class="process-steps"><section class="process-step"><h3>Selection & ageing</h3><p>Paddy is sourced from Haryana, Punjab and Western Uttar Pradesh. After harvest, rice is stored for ageing before further processing.</p></section><section class="process-step"><h3>Cleaning & preparation</h3><p>Pre-cleaners, de-stoners and sizers separate unwanted material and prepare the grain for the stages ahead.</p></section><section class="process-step"><h3>Polishing & colour sorting</h3><p>Water and air are used in polishing. Colour sorting then separates discoloured and damaged grains.</p></section><section class="process-step"><h3>Grading & packing</h3><p>The rice is graded by length for uniformity before being packed for kitchens and businesses.</p></section></div><div class="quality-note"><h3>Checked before and after cooking.</h3><p>SSIEL’s quality lab evaluates grains at both stages. Checks include grain length and elongation, moisture and whiteness, alongside aroma, flavour, texture and appearance.</p></div><h3>What the checks look for.</h3><p>Length checks examine the grain before and after cooking. Moisture and whiteness checks help assess its condition and degree of milling. Sensory evaluation considers how the cooked rice smells, tastes, feels and looks.</p><p class="story-source">Read more about <a href="https://ssiel.com/" target="_blank" rel="noopener">SSIEL’s processing ↗</a> and its <a href="https://ssiel.com/ssiel-qc-lab/" target="_blank" rel="noopener">quality-control laboratory ↗</a>.</p></article>`,
  blog: `<img class="story-banner" src="assets/virasat.jpg" alt="Aged Basmati harvest in the foothills of Haryana"><article class="story-content"><h2 id="story-title">Why ageing Basmati in the foothills of Haryana changes everything.</h2><p>Walk into a traditional kitchen as a pot of Basmati comes to a gentle steam, and you notice the aroma long before the lid is lifted. That unmistakable fragrance—earthy, nutty and floral—begins in the alluvial soil of the Indo-Gangetic plains, but it reaches its peak through patience.</p><div class="story-milestones"><div><strong>12–24 Months</strong><p>Careful post-harvest resting reduces moisture naturally.</p></div><div><strong>2× Elongation</strong><p>Aged grains cook longer, fluffier and stay separate.</p></div><div><strong>Taraori Craft</strong><p>Monitored at every stage in our Haryana mills.</p></div></div><h3>Patience as an ingredient.</h3><p>Freshly harvested paddy holds higher natural moisture, which can cause grains to soften too quickly or cling together in the pot. Resting the grain in controlled conditions allows moisture to recede gradually, firming the starch structure inside each slender kernel.</p><p>When that aged grain finally meets warm water and gentle heat—whether in a layered Dum Biryani, a festive Kashmiri Pulao, or a simple bowl of steamed white rice—it elongates gracefully without breaking, releasing the signature aroma that defines Leysha Basmati.</p></article>`
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
    const rot = Math.max(-55, Math.min(55, (offset / Math.max(1, trackRect.width)) * 42));
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
let grainTarget = 0, grainDrawn = -1, grainTick = 0;
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
function drawGrain() {
  grainTick = 0;
  const frame = grainFrames[grainTarget];
  if (frame?.complete && frame.naturalWidth && grainDrawn !== grainTarget) {
    grainContext.imageSmoothingEnabled = true;
    grainContext.imageSmoothingQuality = 'high';
    grainContext.clearRect(0, 0, grainCanvas.width, grainCanvas.height);
    grainContext.drawImage(frame, 0, 0, grainCanvas.width, grainCanvas.height);
    grainDrawn = grainTarget;
  }
}
function updateGrainScroll() {
  const header = filmHeaderHeight();
  const bounds = grainSection.getBoundingClientRect();
  const travel = grainSection.offsetHeight - (innerHeight-header);
  const progress = Math.min(1,Math.max(0,(header-bounds.top)/travel));
  grainTarget = Math.round(progress*(grainFrames.length-1));
  grainSection.style.setProperty('--grain-progress',progress);
  // Scenes and annotations move naturally with the page; only the grain stays centred.
  const firstSceneTop = grainScenes[0].scene.getBoundingClientRect().top;
  const lastSceneBottom = grainScenes[grainScenes.length - 1].scene.getBoundingClientRect().bottom;
  const sceneIndex = (firstSceneTop > header + 42 || lastSceneBottom < header + 42)
    ? 'lead'
    : String(Math.min(2,Math.max(0,Math.floor((header-firstSceneTop+(innerHeight-header)/2)/(innerHeight-header)))));
  grainSection.dataset.scene=sceneIndex;
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
  const img=new Image();
  grainFrames[i]=img;
  img.onload=()=>{if(i===grainTarget || grainDrawn<0) {grainTarget=grainDrawn<0?i:grainTarget;drawGrain();}};
  img.src=`assets/grain-scroll-clean/${String(i).padStart(3,'0')}.webp?v=1080p-smooth`;
}
loadGrainFrame(0);
// Load the sequence as the reader approaches the section, rather than blocking the opening page.
const grainLoader = new IntersectionObserver(entries=>{if(entries[0].isIntersecting){for(let i=1;i<grainFrames.length;i++)loadGrainFrame(i);grainLoader.disconnect();}},{rootMargin:'1200px'});
grainLoader.observe(grainSection);
window.addEventListener('scroll',updateGrainScroll,{passive:true});
window.addEventListener('resize',updateGrainScroll);
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
  const basePush = 46;
  let moving = false;

  heroGrains.forEach(g => {
    const rect = g.el.getBoundingClientRect();
    if (!rect.width && !rect.height) return;
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
