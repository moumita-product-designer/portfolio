/* Portrait flip card: subtle 3D tilt that follows the cursor, flip on hover (CSS),
   tap to flip on touch screens, Enter/Space to flip from the keyboard. */
(function () {
  var card = document.querySelector('.flip-card');
  if (!card) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (finePointer && !reduce) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg');
      card.style.setProperty('--ry', (x * 14).toFixed(2) + 'deg');
    });
    card.addEventListener('pointerleave', function () {
      card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
    });
  }

  if (!finePointer) {
    card.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      card.classList.toggle('is-flipped');
    });
  }
  card.addEventListener('keydown', function (e) {
    if (e.target !== card) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.classList.toggle('is-flipped'); }
  });
})();
