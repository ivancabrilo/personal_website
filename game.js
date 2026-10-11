(() => {
  'use strict';
  const { WIDTH, HEIGHT, STEP, createGame, reset, jump, update } = JumpGame;
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const game = createGame();
  const panel = document.getElementById('instructions');
  const startButton = document.getElementById('closeInstructions');
  const pauseButton = document.getElementById('pauseButton');
  const keys = new Set(), pointers = new Map();
  const controlButtons = [...document.querySelectorAll('[data-action]')];
  let running = false, started = false, frame = 0, lastTime = 0, accumulator = 0;
  let width = 1, height = 1, scale = 1, offsetX = 0, offsetY = 0, background;
  let previous = { x: game.player.x, y: game.player.y, camera: game.camera };
  let displayedScore = -1, displayedBest = -1;
  try { game.best = Math.max(0, Number(localStorage.getItem('skyward-best')) || 0); } catch (_) { /* Storage may be disabled. */ }
  function snapshot() { previous = { x: game.player.x, y: game.player.y, camera: game.camera }; }
  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, bounds.width); height = Math.max(1, bounds.height);
    // Keep the backing store bounded on Retina and high-density phones.
    const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(3000000 / (width * height)));
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    scale = Math.min(width / WIDTH, height / HEIGHT);
    offsetX = (width - WIDTH * scale) / 2; offsetY = (height - HEIGHT * scale) / 2;
    background = ctx.createLinearGradient(0, 0, 0, height);
    background.addColorStop(0, '#74b9ff'); background.addColorStop(1, '#FFC300');
    draw(1);
  }
  function syncHud() {
    if (displayedScore !== game.score) {
      document.getElementById('score').textContent = String(game.score);
      displayedScore = game.score;
    }
    if (displayedBest !== game.best) {
      document.getElementById('best').textContent = String(game.best).padStart(2, '0');
      displayedBest = game.best;
      try { localStorage.setItem('skyward-best', String(game.best)); } catch (_) { /* Optional persistence. */ }
    }
  }
  function draw(alpha) {
    const x = previous.x + (game.player.x - previous.x) * alpha;
    const y = previous.y + (game.player.y - previous.y) * alpha;
    const camera = previous.camera + (game.camera - previous.camera) * alpha;
    ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
    ctx.save(); ctx.translate(offsetX, offsetY); ctx.scale(scale, scale);
    ctx.beginPath(); ctx.rect(0, 0, WIDTH, HEIGHT); ctx.clip();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
    for (const platform of game.platforms) {
      const py = platform.y - camera;
      if (py < -20 || py > HEIGHT + 20) continue;
      // The starting floor is invisible, as in the original game.
      if (platform.width === WIDTH) continue;
      const left = platform.x, right = left + platform.width;
      const apex = left + platform.width * .52, peak = py - 17;
      // Three warm stone facets keep the original triangular silhouette.
      ctx.fillStyle = '#896342';
      ctx.beginPath(); ctx.moveTo(left, py); ctx.lineTo(right, py);
      ctx.lineTo(right - 5, py + 4); ctx.lineTo(left + 5, py + 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#efd1a1';
      ctx.beginPath(); ctx.moveTo(left, py); ctx.lineTo(apex, peak);
      ctx.lineTo(apex - 10, py); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d2a679';
      ctx.beginPath(); ctx.moveTo(apex - 10, py); ctx.lineTo(apex, peak);
      ctx.lineTo(right, py); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#845c39'; ctx.lineWidth = 1.2; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(left, py); ctx.lineTo(apex, peak);
      ctx.lineTo(right, py); ctx.closePath(); ctx.stroke();
      ctx.strokeStyle = '#fff0cc'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(left + 3, py - 1); ctx.lineTo(apex, peak + 1); ctx.stroke();
    }
    ctx.translate(x, y - camera);
    const radius = game.player.radius;
    ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -radius + 8);
    ctx.lineTo(radius - 8, radius - 8); ctx.lineTo(-radius + 8, radius - 8);
    ctx.closePath(); ctx.fillStyle = '#D32F2F'; ctx.fill();
    const offset = radius * .4;
    for (const [cx, cy, color] of [[0, -offset, '#1976D2'], [-offset, offset, '#388E3C'], [offset, offset, '#8E24AA']]) {
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx, cy, offset / 2, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = i < 2 - game.player.jumps ? '#FFD700' : '#00000035';
      ctx.beginPath(); ctx.arc(-5 + i * 10, -26, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore(); syncHud();
  }
  function clearInput() {
    keys.clear(); pointers.clear(); game.jumpBuffer = 0;
    controlButtons.forEach(button => button.classList.remove('pressed'));
  }
  function setRunning(value) {
    running = value; clearInput(); cancelAnimationFrame(frame); lastTime = 0; accumulator = 0; snapshot();
    panel.hidden = value; pauseButton.textContent = value ? 'Pause' : 'Resume';
    pauseButton.setAttribute('aria-label', value ? 'Pause game' : 'Resume game');
    if (value) { started = true; canvas.focus({ preventScroll: true }); frame = requestAnimationFrame(tick); }
    else {
      if (started) {
        document.getElementById('panelTitle').textContent = 'Paused';
        document.getElementById('panelText').textContent = 'Ready for another jump?';
        document.getElementById('controlHint').hidden = true;
        startButton.textContent = 'Resume';
      }
      draw(1);
    }
  }
  function tick(time) {
    if (!running) return;
    const elapsed = lastTime ? Math.min((time - lastTime) / 1000, .1) : 0;
    lastTime = time; accumulator += elapsed;
    const active = new Set([...keys, ...pointers.values()]);
    const axis = Number(active.has('right')) - Number(active.has('left'));
    while (accumulator >= STEP) {
      snapshot();
      if (update(game, axis)) {
        snapshot();
        document.getElementById('announcement').textContent = 'Back to the starting platform. Try again!';
      }
      accumulator -= STEP;
    }
    draw(accumulator / STEP); frame = requestAnimationFrame(tick);
  }
  const keyActions = { KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', KeyW: 'jump', ArrowUp: 'jump', Space: 'jump' };
  // Track physical keys individually so releasing A does not release ArrowLeft.
  const heldCodes = new Set();
  window.addEventListener('keydown', event => {
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const control = event.target.closest('[data-action]');
    if (control && (event.code === 'Space' || event.code === 'Enter')) {
      if (!running) return;
      event.preventDefault();
      keys.add(control.dataset.action);
      if (control.dataset.action === 'jump' && !event.repeat) jump(game);
      return;
    }
    if (event.target.closest('button, a') && (event.code === 'Space' || event.code === 'Enter')) return;
    if (event.code === 'Escape' && !event.repeat) { setRunning(!running); heldCodes.clear(); return; }
    const action = keyActions[event.code];
    if (!action) return;
    event.preventDefault();
    // The starting key also performs its action, without requiring a mouse click.
    if (!running) {
      if (event.repeat) return;
      heldCodes.clear();
      setRunning(true);
    }
    if (heldCodes.has(event.code)) return;
    heldCodes.add(event.code); keys.add(action);
    if (action === 'jump') jump(game);
  });
  window.addEventListener('keyup', event => {
    heldCodes.delete(event.code);
    keys.clear(); heldCodes.forEach(code => keys.add(keyActions[code]));
  });
  controlButtons.forEach(button => {
    button.addEventListener('pointerdown', event => {
      if (!running || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault(); button.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, button.dataset.action); button.classList.add('pressed');
      if (button.dataset.action === 'jump') jump(game);
    });
    const release = event => {
      pointers.delete(event.pointerId);
      if (![...pointers.values()].includes(button.dataset.action)) button.classList.remove('pressed');
    };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => button.addEventListener(name, release));
    button.addEventListener('contextmenu', event => event.preventDefault());
  });
  startButton.addEventListener('click', () => { heldCodes.clear(); setRunning(true); startButton.blur(); });
  pauseButton.addEventListener('click', () => { heldCodes.clear(); setRunning(!running); pauseButton.blur(); });
  document.getElementById('restartButton').addEventListener('click', event => {
    reset(game); heldCodes.clear(); setRunning(true); event.currentTarget.blur();
  });
  function autoPause() { heldCodes.clear(); if (running) setRunning(false); }
  window.addEventListener('blur', autoPause);
  document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
  new ResizeObserver(resize).observe(canvas);
  window.addEventListener('resize', resize);
  resize();
})();
