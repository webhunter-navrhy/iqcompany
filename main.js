(() => {
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // mobile menu
  const burger = document.querySelector('.burger');
  const mnav = document.getElementById('mnav');
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', open);
    mnav.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  mnav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    burger.setAttribute('aria-expanded', 'false');
    mnav.classList.remove('open');
    document.body.style.overflow = '';
  }));

  if (/[?&]kontura=0/.test(location.search)) document.body.classList.add('bez-kontury');

  // rozpad karet: jeden canvas na kartu (100x75 kostiček po 6 px), kreslí se jen změněné kostičky
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const C = 100, R = 75, T = 6, W = C * T, H = R * T, LV = 10;
  const phase = p => (p < 59 || p >= 81) ? 1 : p < 65 ? 1 - (p - 59) / 6 : p < 75 ? 0 : (p - 75) / 6;
  const cards = [];
  document.querySelectorAll('.tl').forEach(tl => {
    const card = tl.parentElement;
    const k = +card.style.getPropertyValue('--k') || 0;
    const col = card.style.getPropertyValue('--c').trim();
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    tl.appendChild(cv);
    const ctx = cv.getContext('2d');
    const base = document.createElement('canvas');
    base.width = W; base.height = H;
    const bctx = base.getContext('2d');
    const paint = () => { bctx.fillStyle = col; bctx.fillRect(0, 0, W, H); };
    paint();
    const draw = (x, y, a) => {
      ctx.clearRect(x * T, y * T, T, T);
      if (a > 0) { ctx.globalAlpha = a; ctx.drawImage(base, x * T, y * T, T, T, x * T, y * T, T, T); ctx.globalAlpha = 1; }
    };
    ctx.drawImage(base, 0, 0);
    const delay = new Float32Array(C * R), lvl = new Uint8Array(C * R).fill(LV);
    for (let i = 0; i < C * R; i++) delay[i] = Math.random() * 1.6 + k * 1.6;
    if (card.querySelector('.cb img[src*="odjizdime"]')) {
      const img = new Image();
      img.onload = () => { bctx.drawImage(img, 0, 0, W, H); ctx.clearRect(0, 0, W, H); ctx.drawImage(base, 0, 0); lvl.fill(LV); };
      img.src = 'assets/mapa-odj.jpg';
    }
    cards.push({ card, ctx, base, delay, lvl, draw, visible: true });
  });
  if (cards.length && !reduce) {
    const vio = new IntersectionObserver(es => es.forEach(e => {
      const c = cards.find(c => c.card === e.target); if (c) c.visible = e.isIntersecting;
    }));
    cards.forEach(c => vio.observe(c.card));
    const t0 = performance.now();
    const frame = now => {
      const s = (now - t0) / 1000;
      if (!document.hidden) cards.forEach(c => {
        if (!c.visible) return;
        for (let i = 0; i < C * R; i++) {
          const loc = s - c.delay[i];
          const l = loc < 0 ? LV : Math.round(phase(((loc % 14) / 14) * 100) * LV);
          if (l !== c.lvl[i]) { c.lvl[i] = l; c.draw(i % C, (i / C) | 0, l / LV); }
        }
      });
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  // reveals
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
  document.querySelectorAll('.reveal, .reveal-img').forEach(el => io.observe(el));

  // year counters
  const ease = t => 1 - Math.pow(1 - t, 3);
  const cio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const el = e.target, to = +el.dataset.count, from = to - 14, dur = 1400;
      let t0;
      const step = ts => {
        t0 ??= ts;
        const p = Math.min(1, (ts - t0) / dur);
        el.textContent = Math.round(from + (to - from) * ease(p));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(el => cio.observe(el));

  // magnetic buttons (pointer devices only)
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.querySelectorAll('.magnetic').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.22;
        const y = (e.clientY - r.top - r.height / 2) * 0.3;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }
})();
