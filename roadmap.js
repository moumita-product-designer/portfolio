/* Career road map: pins the section and moves a horizontal track as you
   scroll, with background years (slower) and foreground marks (faster)
   for parallax. Falls back to the static vertical timeline on small
   screens and for reduced motion. */
(function () {
  var root = document.querySelector('.roadmap');
  if (!root) return;
  var stage = root.querySelector('.rm-stage'), track = root.querySelector('.rm-track');
  var stops = [].slice.call(root.querySelectorAll('.rm-stop'));
  var years = [].slice.call(root.querySelectorAll('.rm-years span'));
  var yearsLayer = root.querySelector('.rm-years'), marksLayer = root.querySelector('.rm-marks');
  var svg = root.querySelector('.rm-road'), meter = root.querySelector('.rm-meter i'), readout = root.querySelector('.rm-year');
  var mq = window.matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)');
  var NS = 'http://www.w3.org/2000/svg';
  var st = null, ticking = false;

  function el(name, attrs) { var e = document.createElementNS(NS, name); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function curve(pts) {
    var d = 'M' + pts[0][0] + ' ' + pts[0][1];
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], mx = (a[0] + b[0]) / 2;
      d += ' C' + mx + ' ' + a[1] + ' ' + mx + ' ' + b[1] + ' ' + b[0] + ' ' + b[1];
    }
    return d;
  }

  function teardown() {
    root.classList.remove('is-live');
    root.style.height = ''; track.style.cssText = '';
    stops.forEach(function (s) { s.style.removeProperty('--x'); s.style.removeProperty('--y'); s.classList.remove('is-active', 'is-past'); });
    st = null;
  }

  function setup() {
    if (!mq.matches) { teardown(); return; }
    root.classList.add('is-live');
    track.style.width = '';
    var vw = stage.clientWidth, H = track.clientHeight;
    var gap = Math.max(340, Math.min(vw * 0.3, 460));
    var padL = vw * 0.5, n = stops.length;
    var W = Math.round(padL + gap * (n - 1) + vw * 0.5);
    var roadY = Math.round(H * 0.56);
    track.style.width = W + 'px';

    var pts = stops.map(function (s, i) {
      var x = Math.round(padL + i * gap), y = roadY + (i % 2 ? 26 : -26);
      s.style.setProperty('--x', x + 'px'); s.style.setProperty('--y', y + 'px');
      return [x, y];
    });

    // background years: placed so each one sits behind its stop when that stop is centred
    years.forEach(function (y, i) { y.style.left = (vw / 2 + 0.45 * (pts[i][0] - vw / 2)) + 'px'; });

    // foreground marks: deterministic scatter
    marksLayer.innerHTML = '';
    var seed = 7; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var m = 0; m < Math.round(W / 90); m++) {
      var i2 = document.createElement('i');
      i2.textContent = rnd() > 0.5 ? '+' : '·';
      i2.style.left = Math.round(rnd() * W * 1.4) + 'px';
      i2.style.top = Math.round(20 + rnd() * (H - 40)) + 'px';
      marksLayer.appendChild(i2);
    }

    // the road: solid until the break, a dashed gap, then the new lane in accent
    var bi = stops.findIndex(function (s) { return s.classList.contains('break'); });
    var start = [0, roadY], end = [W, roadY];
    var before = [start].concat(pts.slice(0, bi)).concat([[pts[bi][0] - 70, pts[bi][1]]]);
    var after = [[pts[bi][0] + 70, pts[bi][1]]].concat(pts.slice(bi + 1)).concat([end]);
    svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.innerHTML = '';
    var defs = el('defs', {}), clip = el('clipPath', { id: 'rmClip' });
    var clipRect = el('rect', { x: 0, y: 0, width: 0, height: H }); clip.appendChild(clipRect); defs.appendChild(clip); svg.appendChild(defs);
    var dA = curve(before), dB = curve(after);
    svg.appendChild(el('path', { d: dA, class: 'base' }));
    svg.appendChild(el('path', { d: 'M' + (pts[bi][0] - 70) + ' ' + pts[bi][1] + ' L' + (pts[bi][0] + 70) + ' ' + pts[bi][1], class: 'gap' }));
    svg.appendChild(el('path', { d: dB, class: 'base' }));
    var g = el('g', { 'clip-path': 'url(#rmClip)' });
    g.appendChild(el('path', { d: dA, class: 'lit' }));
    g.appendChild(el('path', { d: dB, class: 'lit after' }));
    svg.appendChild(g);

    var stageH = stage.clientHeight, travel = W - vw, hold = Math.round(stageH * 0.35);
    root.style.height = (stageH + travel + hold) + 'px';
    st = { vw: vw, W: W, travel: travel, hold: hold, pts: pts, gap: gap, clipRect: clipRect, top: parseFloat(getComputedStyle(stage).top) || 0 };
    update();
  }

  function update() {
    ticking = false;
    if (!st) return;
    var r = root.getBoundingClientRect();
    var max = st.travel + st.hold;
    var px = Math.min(Math.max(st.top - r.top, 0), max);
    var p = Math.min(px / st.travel, 1);
    var tx = -p * st.travel;
    track.style.transform = 'translate3d(' + tx + 'px,0,0)';
    yearsLayer.style.transform = 'translate3d(' + (tx * -0.55) + 'px,0,0)';
    marksLayer.style.transform = 'translate3d(' + (tx * 0.35) + 'px,0,0)';
    var cx = -tx + st.vw / 2;
    st.clipRect.setAttribute('width', Math.max(0, cx));
    meter.style.transform = 'scaleX(' + p + ')';
    var active = 0, best = Infinity;
    st.pts.forEach(function (pt, i) { var d = Math.abs(pt[0] - cx); if (d < best) { best = d; active = i; } });
    stops.forEach(function (s, i) {
      s.classList.toggle('is-active', i === active);
      s.classList.toggle('is-past', st.pts[i][0] <= cx + 1);
    });
    years.forEach(function (y, i) { y.classList.toggle('is-active', i === active); });
    var label = stops[active].querySelector('.mono');
    if (label && readout.textContent !== label.textContent) readout.textContent = label.textContent;
  }

  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(setup, 150); });
  if (mq.addEventListener) mq.addEventListener('change', setup);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setup);
  setup();
})();
