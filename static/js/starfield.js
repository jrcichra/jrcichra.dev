(function () {
  var canvas = document.getElementById('space');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W, H, DPR;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = Math.max(1, Math.floor(window.innerWidth * DPR));
    H = canvas.height = Math.max(1, Math.floor(window.innerHeight * DPR));
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  var STAR_COUNT = 240;
  var stars = [];
  for (var i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.3 + 0.3,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.5 + 0.15
    });
  }

  function draw(now) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0a0c0d';
    ctx.fillRect(0, 0, W, H);

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var tw = 0.5 + 0.5 * Math.sin(now * 0.001 * s.speed + s.phase);
      ctx.globalAlpha = 0.25 + tw * 0.65;
      ctx.fillStyle = '#eef1ec';
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r * DPR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    draw(now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
