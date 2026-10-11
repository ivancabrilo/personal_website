const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createGame, reset, jump, update, STEP, WIDTH } = require('./game-core.js');
test('first jump is consistent and a third jump is rejected', () => {
  const g = createGame(() => .5);
  jump(g); update(g, 0); assert.equal(g.player.jumps, 1); assert.ok(g.player.vy < -560);
  jump(g); update(g, 0); assert.equal(g.player.jumps, 2); assert.ok(g.player.vy < -520);
  jump(g); const vy = g.player.vy; update(g, 0); assert.ok(g.player.vy > vy);
});
test('physics produces identical motion at 30, 60, and 144 Hz render rates', () => {
  function simulate(hz) {
    const g = createGame(() => .5); jump(g); let accumulator = 0;
    for (let frame = 0; frame < hz; frame++) {
      accumulator += 1 / hz;
      while (accumulator + 1e-10 >= STEP) { update(g, 1); accumulator -= STEP; }
    }
    return g.player;
  }
  assert.deepEqual(simulate(30), simulate(60)); assert.deepEqual(simulate(60), simulate(144));
});
test('crossed platforms catch fast falls and award points only once', () => {
  const g = createGame(() => .5);
  g.platforms = [{ x: 100, y: 400, width: 100, scored: false }];
  Object.assign(g.player, { x: 150, y: 360, vy: 4000, grounded: false });
  update(g, 0); assert.equal(g.player.y, 384); assert.equal(g.score, 1);
  update(g, 0); assert.equal(g.score, 1); assert.equal(g.player.jumps, 0);
});
test('falling alongside a platform cannot snap the player onto its top', () => {
  const g = createGame(() => .5);
  g.platforms = [{ x: 100, y: 400, width: 100, scored: false }];
  Object.assign(g.player, { x: 150, y: 405, vy: 100, grounded: false });
  update(g, 0); assert.equal(g.score, 0); assert.ok(g.player.y > 405);
});
test('generation is bounded and keeps consecutive platforms reachable', () => {
  for (const random of [() => 0, () => .5, () => .9999, Math.random]) {
    const g = createGame(random);
    for (let n = 0; n < 200; n++) {
      const top = g.platforms.at(-1);
      Object.assign(g.player, { x: top.x + top.width / 2, y: top.y - 16, vy: 0 });
      for (let i = 0; i < 50; i++) update(g, 0);
      assert.ok(g.platforms.length < 20);
      g.platforms.slice(1).forEach((p, i) => {
        const previous = g.platforms[i];
        assert.ok(p.x >= 0 && p.x + p.width <= WIDTH);
        assert.ok(previous.y - p.y <= 114.001);
        assert.ok(Math.abs(previous.x + previous.width / 2 - p.x - p.width / 2) <= 130.001);
      });
    }
  }
});
test('fall resets the run and preserves best score', () => {
  const g = createGame(); g.best = 9; g.score = 5; g.player.y = 1000;
  assert.equal(update(g, 0), true); assert.equal(g.score, 0); assert.equal(g.best, 9);
  reset(g); assert.equal(g.player.x, 240); assert.equal(g.camera, 0);
});

test('second jump uses the original random 10-to-17 strength relative to the first jump of 14', () => {
  for (const value of [0, .5, .999999]) {
    const g = createGame(() => value);
    jump(g); update(g, 0);
    assert.ok(Math.abs(g.player.vy - (-580 + 1550 * STEP)) < 1e-9);
    jump(g); update(g, 0);
    const expected = -(580 * (10 + value * 7) / 14) + 1550 * STEP;
    assert.ok(Math.abs(g.player.vy - expected) < 1e-9);
    const afterSecond = g.player.vy;
    jump(g); update(g, 0);
    assert.ok(g.player.vy > afterSecond);
  }
});


test('double-jumping past platforms scores without any horizontal contact', () => {
  const g = createGame(() => .5);
  const lower = { x: 350, y: 580, width: 100, scored: false };
  const upper = { x: 350, y: 480, width: 100, scored: false };
  g.platforms = [{ x: 0, y: 674, width: WIDTH, scored: true }, lower, upper];
  g.player.x = 50;
  jump(g);
  for (let i = 0; i < 40; i++) update(g, 0);
  assert.equal(lower.scored, true);
  assert.equal(upper.scored, false);
  assert.equal(g.score, 1);
  jump(g);
  for (let i = 0; i < 50; i++) update(g, 0);
  assert.equal(upper.scored, true);
  assert.equal(g.score, 2);
  assert.equal(g.best, 2);
  assert.equal(g.player.grounded, false);
});

test('one upward step can award multiple crossed heights but not an unreached platform', () => {
  const g = createGame(() => .5);
  const platforms = [600, 590, 500].map(y => ({ x: 350, y, width: 100, scored: false }));
  g.platforms = platforms;
  Object.assign(g.player, { x: 50, y: 600, vy: -4000, grounded: false });
  update(g, 0);
  assert.equal(g.score, 2);
  assert.equal(platforms[2].scored, false);
});

test('landing, falling past, and recrossing a scored height never award it twice', () => {
  const g = createGame(() => .5);
  const platform = { x: 100, y: 500, width: 100, scored: false };
  g.platforms = [platform];
  Object.assign(g.player, { x: 50, y: 485, vy: -300, grounded: false });
  update(g, 0); assert.equal(g.score, 1);
  Object.assign(g.player, { x: 150, y: 480, vy: 800, grounded: false });
  update(g, 0); assert.equal(g.player.grounded, true); assert.equal(g.score, 1);
  Object.assign(g.player, { x: 50, y: 485, vy: -300, grounded: false });
  update(g, 0); assert.equal(g.score, 1);
  Object.assign(g.player, { x: 50, y: 480, vy: 800, grounded: false });
  update(g, 0); assert.equal(g.score, 1);
});
