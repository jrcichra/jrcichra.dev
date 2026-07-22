(function () {
  var target = document.getElementById('typedName');
  var cursor = document.getElementById('nameCursor');
  if (!target || !cursor) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fullText = target.getAttribute('data-text') || target.textContent || '';

  if (reduceMotion) {
    target.textContent = fullText;
    cursor.classList.add('blink');
    return;
  }

  var i = 0;
  function tick() {
    target.textContent = fullText.slice(0, i);
    i++;
    if (i <= fullText.length) {
      setTimeout(tick, 60 + Math.random() * 70);
    } else {
      cursor.classList.add('blink');
    }
  }
  setTimeout(tick, 250);
})();
