/* Site-wide vertical parallax.
   Each target gets a speed; on scroll its offset from the viewport centre is
   multiplied by that speed and written to --py, which CSS applies with the
   independent `translate` property (so it composes with existing transforms,
   reveal animations and hover effects). Skipped for reduced motion and inside
   the pinned career road map. */
(function () {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var targets = [
    // [selector, speed, extra class]  speed > 0 lags behind the scroll, < 0 runs ahead
    ['.hero-glow', 0.35], ['.hero .eternal-grid', 0.22], ['.hero-text', 0.12], ['.hero-fig', -0.06],
    ['.sec-head .sec-num', 0.18], 
    ['.statement', 0.08],
    ['.work:not(.feature) .work-media img', 0.14, 'px-inner'], ['.case-thumb img', 0.14, 'px-inner'],
    ['.contact h2', 0.14], ['.contact .eyebrow', 0.24], ['.case-head h1', 0.07], ['.case-head .lede', 0.12],
    ['.next h2', 0.1], ['.wordmark', -0.12]
  ];
  var touch = window.matchMedia && matchMedia('(hover: none)').matches;
  var scale = touch ? 0.5 : 1;
  var items = [];
  targets.forEach(function (t) {
    document.querySelectorAll(t[0]).forEach(function (el) {
      if (el.closest('.roadmap') || el.closest('.wide')) return;
      if (items.some(function (i) { return i.el === el; })) return;
      el.setAttribute('data-px', '');
      if (t[2]) el.classList.add(t[2]);
      items.push({ el: el, speed: t[1] * scale, py: 0 });
    });
  });
  if (!items.length) return;
  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight, mid = vh / 2;
    for (var i = 0; i < items.length; i++) {
      var it = items[i], r = it.el.getBoundingClientRect();
      var top = r.top - it.py, bottom = r.bottom - it.py;          // natural position
      if (bottom < -vh * 0.5 || top > vh * 1.5) continue;        // far off screen: skip
      var py = -((top + bottom) / 2 - mid) * it.speed;
      if (it.el.classList.contains('px-inner')) {                  // inside a frame: keep within the overscan
        var lim = r.height * 0.06; py = Math.max(-lim, Math.min(lim, py));
      }
      py = Math.round(py * 10) / 10;
      if (py !== it.py) { it.py = py; it.el.style.setProperty('--py', py + 'px'); }
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', onScroll);
  update();
})();
