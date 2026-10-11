/* Shared deterministic simulation: browser and Node test runner. */
(function (root) {
  'use strict';
  const WIDTH = 480, HEIGHT = 720, STEP = 1 / 120;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  function createGame(random = Math.random) {
    const game = { random, best: 0 };
    reset(game);
    return game;
  }
  function reset(g) {
    g.player = { x: 240, y: 658, vx: 0, vy: 0, radius: 16, jumps: 0, grounded: true, grace: .1 };
    g.camera = 0;
    g.score = 0;
    g.jumpBuffer = 0;
    g.platforms = [{ x: 0, y: 674, width: WIDTH, touched: true }];
    extend(g);
  }
  function extend(g) {
    let last = g.platforms[g.platforms.length - 1];
    while (last.y > g.camera - 160) {
      const width = 90 + g.random() * 24;
      const center = last.x + last.width / 2;
      const direction = g.random() < .5 ? -1 : 1;
      const x = clamp(center + direction * (65 + g.random() * 65) - width / 2, 18, WIDTH - width - 18);
      last = { x, y: last.y - 88 - g.random() * 26, width, touched: false };
      g.platforms.push(last);
    }
  }
  function jump(g) { g.jumpBuffer = .12; }
  function update(g, axis, dt = STEP) {
    const p = g.player;
    g.jumpBuffer = Math.max(0, g.jumpBuffer - dt);
    p.grace = p.grounded ? .1 : Math.max(0, p.grace - dt);
    if (g.jumpBuffer > 0 && p.jumps < 2) {
      if (!p.grounded && p.grace === 0 && p.jumps === 0) p.jumps = 1;
      p.vy = p.jumps === 0 ? -580 : -(580 * (10 + g.random() * 7) / 14);
      p.jumps++;
      p.grounded = false;
      p.grace = 0;
      g.jumpBuffer = 0;
    }
    const target = axis * 250;
    const change = (axis ? 2200 : 2800) * dt;
    p.vx += clamp(target - p.vx, -change, change);
    const oldX = p.x, oldBottom = p.y + p.radius;
    p.x = clamp(p.x + p.vx * dt, p.radius, WIDTH - p.radius);
    p.vy += 1550 * dt;
    p.y += p.vy * dt;
    p.grounded = false;
    if (p.vy >= 0) {
      // Platforms are ordered from bottom to top; check the first crossed surface.
      for (let i = g.platforms.length - 1; i >= 0; i--) {
        const platform = g.platforms[i];
        const bottom = p.y + p.radius;
        if (oldBottom > platform.y + .01 || bottom < platform.y) continue;
        const fraction = (platform.y - oldBottom) / (bottom - oldBottom || 1);
        const crossingX = oldX + (p.x - oldX) * fraction;
        if (crossingX + p.radius <= platform.x || crossingX - p.radius >= platform.x + platform.width) continue;
        p.y = platform.y - p.radius;
        p.vy = 0;
        p.jumps = 0;
        p.grounded = true;
        if (!platform.touched) {
          platform.touched = true;
          g.score++;
          g.best = Math.max(g.best, g.score);
        }
        break;
      }
    }
    const targetCamera = Math.min(0, p.y - HEIGHT * .43);
    if (targetCamera < g.camera) g.camera += (targetCamera - g.camera) * (1 - Math.exp(-9 * dt));
    if (p.y - g.camera > HEIGHT + 70) { reset(g); return true; }
    g.platforms = g.platforms.filter(platform => platform.y < g.camera + HEIGHT + 100);
    extend(g);
    return false;
  }
  const api = { WIDTH, HEIGHT, STEP, createGame, reset, jump, update };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.JumpGame = api;
})(globalThis);
