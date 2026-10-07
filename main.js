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

  // pixel dissolve tiles
  document.querySelectorAll('.tl').forEach(tl => {
    const map = tl.parentElement.style.getPropertyValue('--k') === '1';
    for (let i = 0; i < 2700; i++) {
      const s = document.createElement('i');
      s.style.setProperty('--d', (Math.random() * 1.6).toFixed(2));
      if (map) s.style.backgroundPosition = `${(i % 60) / 59 * 100}% ${Math.floor(i / 60) / 44 * 100}%`;
      tl.appendChild(s);
    }
  });

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
