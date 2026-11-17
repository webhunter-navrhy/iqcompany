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

  // loga levitují a nezávisle na sobě se občas otočí o 360° kolem své osy (první kolo TP, E-dron, Odjíždíme, pak náhodně)
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const logos = [...document.querySelectorAll('.card .spin')];
  if (logos.length && !reduce && logos[0].animate) {
    const order = [0, 2, 1];
    let n = 0;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const spinOne = i => logos[i].animate(
      [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(360deg)' }],
      { duration: rnd(1500, 2100), easing: 'ease-in-out' });
    const next = () => {
      const i = n < order.length ? order[n] : Math.floor(Math.random() * logos.length);
      n++;
      if (!document.hidden) spinOne(i);
      setTimeout(next, rnd(3500, 8500));
    };
    setTimeout(next, 2800);
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

  // Odjíždíme: fotky se nahodile střídají, přechod = jemný chaotický rozpad po kostičkách (bez rámečku)
  const sc = document.getElementById('slides');
  if (sc && sc.getContext) {
    const fig = sc.parentElement;
    const names = ['wing', 'boat', 'cabin', 'ferry', 'hat', 'wagon'];
    const imgs = names.map(n => { const i = new Image(); i.src = 'assets/odj-' + n + '.jpg'; return i; });
    const ctx = sc.getContext('2d');
    let W = 0, H = 0, cur = 0, nxt = -1, tiles = [], t0 = 0, busy = false, cols = 1, rows = 1;
    const mk = document.createElement('canvas'), mx = mk.getContext('2d');
    const tmp = document.createElement('canvas'), tx = tmp.getContext('2d');
    const T = 2.6, DUR = reduce ? 1 : 2600;
    const fit = (im, o) => { // object-fit: cover
      const r = Math.max(W / im.naturalWidth, H / im.naturalHeight);
      const w = im.naturalWidth * r, h = im.naturalHeight * r;
      o.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
    };
    const size = () => {
      const r = fig.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      W = Math.round(r.width * d); H = Math.round(r.height * d); sc.width = W; sc.height = H;
      if (imgs[cur].complete) { ctx.clearRect(0, 0, W, H); fit(imgs[cur], ctx); }
    };
    const frame = ts => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / DUR, 1);
      fit(imgs[cur], ctx);
      const id = mx.createImageData(cols, rows), dt = id.data;
      for (let k = 0; k < tiles.length; k++) dt[k * 4 + 3] = tiles[k] <= p ? 255 : 0;
      mx.putImageData(id, 0, 0);
      tmp.width = W; tmp.height = H; // vymaže
      fit(imgs[nxt], tx);
      tx.globalCompositeOperation = 'destination-in';
      tx.imageSmoothingEnabled = false;
      tx.drawImage(mk, 0, 0, W, H);
      tx.globalCompositeOperation = 'source-over';
      ctx.drawImage(tmp, 0, 0);
      if (p < 1) requestAnimationFrame(frame);
      else { cur = nxt; busy = false; fit(imgs[cur], ctx); }
    };
    const change = () => {
      if (!document.hidden && !busy && imgs.every(i => i.complete && i.naturalWidth)) {
        const r = r2 => Math.floor(Math.random() * r2);
        do { nxt = r(imgs.length); } while (nxt === cur);
        cols = Math.ceil(W / (T * (W / 600))); rows = Math.ceil(H / (T * (W / 600)));
        mk.width = cols; mk.height = rows;
        tiles = Array.from({ length: cols * rows }, () => Math.random());
        busy = true; t0 = 0; requestAnimationFrame(frame);
      }
      setTimeout(change, 4500 + Math.random() * 2500);
    };
    imgs[0].onload = size; size();
    addEventListener('resize', () => { if (!busy) size(); });
    setTimeout(change, 3500);
  } else if (sc) sc.parentElement.classList.add('no-js');
})();
