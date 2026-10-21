/* Twisting Nether hero: a slow fel-green rift with a blue heart. Layers, back to front: stars, light rays from the
   core, back smoke (procedural noise wisps), a faint rotating rune circle, the glowing rim, light trails spiralling
   into the void, the void core, fel lightning, orbiting rock shards, front smoke, sparkles and embers.
   Also paints the cracked-stone texture used inside the logo letters. */
(() => {
  "use strict";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);

  // ---- cracked stone texture for the logo (set as --crack on :root) ----
  (function crackTexture() {
    const c = document.createElement("canvas");
    c.width = 420; c.height = 220;
    const g = c.getContext("2d");
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const img = g.createImageData(c.width, c.height);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = rnd();
      if (v > .82) { img.data[i] = 255; img.data[i + 1] = 245; img.data[i + 2] = 210; img.data[i + 3] = 26; }
      else if (v < .16) { img.data[i] = 30; img.data[i + 1] = 15; img.data[i + 2] = 0; img.data[i + 3] = 34; }
    }
    g.putImageData(img, 0, 0);
    function crack(x, y, a, len, w, depth) {
      const pts = [[x, y]];
      for (let s = 0; s < len; s += 5 + rnd() * 9) {
        a += (rnd() - .5) * .9;
        x += Math.cos(a) * (5 + rnd() * 9); y += Math.sin(a) * (5 + rnd() * 9);
        pts.push([x, y]);
        if (depth < 2 && rnd() < .08) crack(x, y, a + (rnd() < .5 ? 1 : -1) * (.6 + rnd()), len * .45, w * .7, depth + 1);
      }
      for (const [off, col] of [[1, "rgba(255,244,205,.35)"], [0, "rgba(28,12,0,.75)"]]) {
        g.beginPath(); g.moveTo(pts[0][0] + off, pts[0][1] + off);
        for (const p of pts) g.lineTo(p[0] + off, p[1] + off);
        g.strokeStyle = col; g.lineWidth = w; g.lineJoin = "round"; g.stroke();
      }
    }
    for (let i = 0; i < 16; i++) crack(rnd() * c.width, rnd() * c.height, rnd() * TAU, 40 + rnd() * 120, 1 + rnd() * .9, 0);
    document.documentElement.style.setProperty("--crack", `url(${c.toDataURL()})`);
  })();

  const canvas = document.getElementById("portal");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const small = canvas.classList.contains("small");

  // ---- procedural smoke: fractal value noise shaped into a soft, ragged wisp, tinted ----
  function makeNoise(seed) {
    const N = 64, grid = new Float32Array(N * N);
    let s = seed;
    for (let i = 0; i < grid.length; i++) { s = (s * 16807) % 2147483647; grid[i] = s / 2147483647; }
    const fade = t => t * t * (3 - 2 * t);
    const at = (x, y) => grid[((y % N + N) % N) * N + ((x % N + N) % N)];
    return (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = fade(x - xi), yf = fade(y - yi);
      const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
      return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
    };
  }
  function smokeSprite(rgb, seed, size = 256) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    const img = g.createImageData(size, size);
    const n = makeNoise(seed);
    const h = size / 2;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - h) / h, dy = (y - h) / h, d = Math.sqrt(dx * dx + dy * dy);
        if (d >= 1) continue;
        // domain-warped fbm: curling wisps
        const wx = x / 38 + n(x / 60 + 3, y / 60) * 2.2, wy = y / 38 + n(x / 60, y / 60 + 7) * 2.2;
        let f = 0, amp = .55, fr = 1;
        for (let o = 0; o < 5; o++) { f += n(wx * fr, wy * fr) * amp; amp *= .5; fr *= 2.03; }
        const fall = Math.pow(1 - d, 1.6);
        const a = Math.max(0, (f - .3) * 2.4) * fall;
        const i = (y * size + x) * 4;
        img.data[i] = rgb[0]; img.data[i + 1] = rgb[1]; img.data[i + 2] = rgb[2];
        img.data[i + 3] = Math.min(255, a * 255);
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  }
  function glow(rgb, size = 64) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(.25, `rgba(${rgb},.5)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, size, size);
    return c;
  }
  const SMOKE = [
    smokeSprite([90, 210, 60], 11), smokeSprite([40, 140, 45], 23), smokeSprite([70, 150, 210], 37),
    smokeSprite([140, 255, 110], 51), smokeSprite([60, 110, 170], 73), smokeSprite([110, 200, 90], 97),
  ];
  const DOT_G = glow("190,255,150"), DOT_B = glow("150,205,255"), DOT_W = glow("245,255,235");

  // trails: motes paint onto this buffer, which fades a little every frame -> smooth light streaks
  const trail = document.createElement("canvas");
  const tctx = trail.getContext("2d");

  let W = 0, H = 0, DPR = 1, cx = 0, cy = 0, R = 100;
  let stars = [], back = [], front = [], motes = [], shards = [], bolts = [], embers = [], sparkles = [];

  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    trail.width = canvas.width; trail.height = canvas.height;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    tctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cx = W / 2; cy = small ? H * .55 : H * .47;
    R = small ? Math.min(W * .32, H * .7) : Math.min(W * .4, H * .5);
    init();
  }

  function init() {
    const area = W * H;
    stars = Array.from({ length: Math.round(area / 4800) }, () => ({ x: rand(0, W), y: rand(0, H), r: rand(.3, 1.2), p: rand(0, TAU), s: rand(.2, .8) }));
    back = Array.from({ length: small ? 16 : 26 }, () => newSmoke(false, true));
    front = Array.from({ length: small ? 6 : 10 }, () => newSmoke(true, true));
    motes = Array.from({ length: Math.round(Math.min(700, Math.max(260, area / 1900))) }, () => newMote(true));
    shards = Array.from({ length: small ? 7 : 13 }, (_, i, arr) => newShard(i, small ? 7 : 13));
    embers = Array.from({ length: small ? 24 : 46 }, () => newEmber(true));
    sparkles = Array.from({ length: small ? 18 : 34 }, () => newSparkle(true));
  }

  function newSmoke(isFront, any) {
    // smoke orbits the rift slowly while curling (rotation), breathing in size and fading in and out
    return { a: rand(0, TAU), r: R * (isFront ? rand(.75, 1.35) : rand(.45, 1.55)), w: rand(.012, .035) * (Math.random() < .15 ? -1 : 1),
             size: R * (isFront ? rand(.45, .8) : rand(.55, 1.15)), rot: rand(0, TAU), vr: rand(-.06, .06),
             spr: SMOKE[(Math.random() * SMOKE.length) | 0], al: isFront ? rand(.22, .4) : rand(.35, .65),
             life: any ? rand(0, 1) : 0, span: rand(14, 30), front: isFront, out: rand(-.004, .01) };
  }
  function newMote(any) {
    const ring = Math.random() < .7;
    const r = ring ? R * (0.83 + (Math.random() - .5) * .3) : R * rand(.32, 1.3);
    const blue = Math.random() < (r < R * .62 ? .55 : .14);
    return { a: rand(0, TAU), r: any ? r : R * rand(1.0, 1.3), drift: rand(.0025, .011),
             hue: blue ? rand(196, 214) : rand(86, 116), l: blue ? rand(62, 80) : rand(52, 72), s: rand(.7, 1.9) };
  }
  function newShard(i, n) {
    const pts = [];
    const k = 4 + ((Math.random() * 3) | 0);
    for (let j = 0; j < k; j++) { const a = j / k * TAU + rand(-.35, .35); pts.push([Math.cos(a) * rand(.55, 1), Math.sin(a) * rand(.4, 1)]); }
    return { a: i / n * TAU + rand(-.2, .2), r: R * rand(.98, 1.45), w: rand(.008, .022) * (Math.random() < .2 ? -1 : 1),
             size: rand(7, small ? 22 : 34), rot: rand(0, TAU), vr: rand(-.18, .18), pts, z: rand(.5, 1), bob: rand(0, TAU) };
  }
  function newEmber(any) {
    const a = rand(0, TAU), r = R * rand(.8, 1.1);
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * .92, vx: Math.cos(a) * rand(2, 8), vy: Math.sin(a) * rand(2, 6) - rand(4, 12),
             life: any ? rand(0, 1) : 0, max: rand(4, 9), blue: Math.random() < .3, s: rand(4, 11), wob: rand(0, TAU) };
  }
  function newSparkle(any) {
    const a = rand(0, TAU), r = R * rand(.5, 1.6);
    return { x: Math.cos(a) * r, y: Math.sin(a) * r * .8, life: any ? rand(0, 1) : 0, max: rand(1.6, 4), s: rand(3, 9), blue: Math.random() < .35 };
  }
  function bolt() {
    const a0 = rand(0, TAU), span = rand(.3, .8) * (Math.random() < .5 ? -1 : 1);
    const make = (a0, span, r0, n) => {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n, a = a0 + span * t;
        const rr = r0 * (1 + Math.sin(t * Math.PI) * rand(-.04, .1) + rand(-.03, .03));
        pts.push([Math.cos(a) * rr, Math.sin(a) * rr * .92]);
      }
      return pts;
    };
    const main = make(a0, span, R * .86, 20);
    const branch = Math.random() < .6 ? make(a0 + span * rand(.3, .7), span * rand(.25, .45), R * rand(.9, 1.05), 9) : null;
    bolts.push({ main, branch, life: 0, max: rand(.45, .8), w: rand(.8, 1.8) });
  }

  // rune circle: fixed glyph strokes around a ring, drawn once per resize into a sprite
  let runes = null;
  function runeSprite() {
    const size = Math.ceil(R * 2.7);
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    g.translate(size / 2, size / 2);
    g.strokeStyle = "rgba(170,255,130,1)"; g.lineCap = "round";
    const r1 = R * 1.18, r2 = R * 1.28;
    g.lineWidth = 1.2;
    for (const r of [r1, r2]) { g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); }
    let s = 5;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const n = 36;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU;
      g.save(); g.rotate(a); g.translate(0, -(r1 + r2) / 2);
      g.lineWidth = 1.4; g.beginPath();
      const h = (r2 - r1) * .32;
      for (let k = 0; k < 3; k++) {   // a little glyph of 3 strokes
        const x0 = (rnd() - .5) * h * 1.6, y0 = (rnd() - .5) * h * 1.6, x1 = (rnd() - .5) * h * 1.6, y1 = (rnd() - .5) * h * 1.6;
        g.moveTo(x0, y0); g.lineTo(x1, y1);
      }
      g.stroke();
      g.restore();
    }
    for (let i = 0; i < 12; i++) {   // diamonds at the cardinal points
      const a = i / 12 * TAU, rr = (r1 + r2) / 2 + (i % 3 === 0 ? 0 : 0);
      g.save(); g.rotate(a); g.translate(0, -r2 - 7);
      g.beginPath(); g.moveTo(0, -4); g.lineTo(3, 0); g.lineTo(0, 4); g.lineTo(-3, 0); g.closePath(); g.stroke();
      g.restore();
    }
    return c;
  }

  let last = performance.now(), t = 0, nextBolt = 1.5, running = false, raf = 0;

  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000);
    last = now; t += dt;
    draw(dt);
    if (running) raf = requestAnimationFrame(frame);
  }

  function drawSmoke(list, dt) {
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      p.life += dt / p.span;
      if (p.life >= 1) { list[i] = newSmoke(p.front, false); continue; }
      p.a += p.w * dt * (R / p.r); p.rot += p.vr * dt; p.r += p.out * R * dt;
      const x = Math.cos(p.a) * p.r, y = Math.sin(p.a) * p.r * .88;
      const k = Math.sin(p.life * Math.PI);         // fade in, linger, fade out
      const sz = p.size * (.8 + .35 * p.life);       // and slowly grow
      ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot);
      ctx.globalAlpha = p.al * k;
      ctx.drawImage(p.spr, -sz, -sz * .7, sz * 2, sz * 1.4);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function draw(dt) {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#05070a";
    ctx.fillRect(0, 0, W, H);
    let gr = ctx.createRadialGradient(cx, cy, R * .2, cx, cy, Math.max(W, H) * .8);
    gr.addColorStop(0, "rgba(36,100,22,.38)"); gr.addColorStop(.3, "rgba(14,44,16,.26)"); gr.addColorStop(.6, "rgba(8,18,30,.18)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    for (const s of stars) {
      const a = .2 + .3 * Math.sin(t * s.s + s.p);
      ctx.fillStyle = `rgba(210,230,255,${a})`;
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }

    ctx.save();
    ctx.translate(cx, cy);
    // light rays from the core, turning very slowly
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU + t * .025 + Math.sin(t * .2 + i) * .05;
      const len = R * (1.9 + .4 * Math.sin(t * .3 + i * 1.7)), wid = .05 + .03 * Math.sin(t * .4 + i);
      const lg = ctx.createRadialGradient(0, 0, R * .6, 0, 0, len);
      lg.addColorStop(0, `rgba(110,230,80,${.05 + .025 * Math.sin(t * .5 + i)})`); lg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, len, a - wid, a + wid); ctx.closePath(); ctx.fill();
    }
    // back smoke
    ctx.globalCompositeOperation = "screen";
    drawSmoke(back, dt);
    // rune circle
    if (!runes) runes = runeSprite();
    ctx.globalCompositeOperation = "lighter";
    ctx.save(); ctx.rotate(t * .018); ctx.scale(1, .92);
    ctx.globalAlpha = .16 + .06 * Math.sin(t * .45);
    ctx.drawImage(runes, -runes.width / 2, -runes.height / 2);
    ctx.restore();
    ctx.globalAlpha = 1;
    // the rim
    const pulse = .9 + .1 * Math.sin(t * .7);
    for (const [rr, lw, col] of [[.86, R * .34, "rgba(40,140,20,.08)"], [.86, R * .16, "rgba(70,200,30,.13)"], [.85, R * .06, "rgba(140,255,80,.18)"], [.84, R * .014, "rgba(225,255,190,.38)"]]) {
      ctx.beginPath(); ctx.ellipse(0, 0, R * rr, R * rr * .92, 0, 0, TAU);
      ctx.strokeStyle = col; ctx.lineWidth = lw * pulse; ctx.stroke();
    }
    ctx.restore();

    // light trails: motes paint dots into the fading trail buffer
    tctx.globalCompositeOperation = "destination-out";
    tctx.fillStyle = `rgba(0,0,0,${1 - Math.pow(.93, dt * 60)})`;
    tctx.fillRect(0, 0, W, H);
    tctx.globalCompositeOperation = "lighter";
    for (const m of motes) {
      const k = R / Math.max(m.r, R * .25);
      m.a += dt * (.16 * Math.pow(k, 1.6) + .04);
      m.r -= m.drift * R * dt * (m.r < R * .7 ? 2 : 1);
      if (m.r < R * .22) { Object.assign(m, newMote(false)); m.px = null; continue; }
      const x = cx + Math.cos(m.a) * m.r, y = cy + Math.sin(m.a) * m.r * .92;
      const fade = Math.min(1, (m.r - R * .22) / (R * .35));
      if (m.px != null) {
        tctx.strokeStyle = `hsla(${m.hue},100%,${m.l}%,${.42 * fade})`;
        tctx.lineWidth = m.s * .9; tctx.lineCap = "round";
        tctx.beginPath(); tctx.moveTo(m.px, m.py); tctx.lineTo(x, y); tctx.stroke();
      }
      m.px = x; m.py = y;
    }
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(trail, 0, 0, W, H);

    ctx.save();
    ctx.translate(cx, cy);
    // void core with a faint blue heart
    ctx.globalCompositeOperation = "source-over";
    gr = ctx.createRadialGradient(0, 0, 0, 0, 0, R * .74);
    gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(.55, "rgba(1,4,3,.96)"); gr.addColorStop(.8, "rgba(4,14,8,.55)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(0, 0, R * .74, R * .68, 0, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = "lighter";
    gr = ctx.createRadialGradient(0, 0, 0, 0, 0, R * .55);
    gr.addColorStop(0, `rgba(40,110,210,${.09 + .05 * Math.sin(t * .5)})`); gr.addColorStop(.6, "rgba(20,60,140,.03)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gr; ctx.fillRect(-R, -R, R * 2, R * 2);
    // fel lightning (rare, soft, sometimes branching)
    nextBolt -= dt;
    if (nextBolt <= 0) { bolt(); nextBolt = rand(1.6, 4.5); }
    for (let i = bolts.length - 1; i >= 0; i--) {
      const b = bolts[i]; b.life += dt;
      const a = Math.pow(1 - b.life / b.max, 1.5) * (b.life < .06 ? b.life / .06 : 1);
      if (b.life >= b.max) { bolts.splice(i, 1); continue; }
      for (const pts of [b.main, b.branch]) {
        if (!pts) continue;
        const thin = pts === b.branch ? .6 : 1;
        for (const [lw, col] of [[b.w * 7, `rgba(90,255,60,${.08 * a})`], [b.w * 2.4, `rgba(150,255,110,${.38 * a})`], [b.w * .8, `rgba(240,255,230,${.8 * a})`]]) {
          ctx.beginPath(); pts.forEach((p, j) => j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
          ctx.strokeStyle = col; ctx.lineWidth = lw * thin; ctx.lineJoin = "round"; ctx.stroke();
        }
      }
    }
    // rock shards
    ctx.globalCompositeOperation = "source-over";
    for (const s of shards) {
      s.a += s.w * dt; s.rot += s.vr * dt; s.bob += dt * .5;
      const x = Math.cos(s.a) * s.r, y = Math.sin(s.a) * s.r * .55 - R * .05 + Math.sin(s.bob) * 4;
      const front = Math.sin(s.a) > 0;
      const sz = s.size * (front ? 1 : .7) * s.z;
      ctx.save(); ctx.translate(x, y); ctx.rotate(s.rot);
      ctx.beginPath(); s.pts.forEach((p, j) => j ? ctx.lineTo(p[0] * sz, p[1] * sz) : ctx.moveTo(p[0] * sz, p[1] * sz)); ctx.closePath();
      const lg = ctx.createLinearGradient(-sz, -sz, sz, sz);
      lg.addColorStop(0, front ? "#1d2c1a" : "#0d140c"); lg.addColorStop(1, "#030503");
      ctx.fillStyle = lg; ctx.fill();
      ctx.strokeStyle = front ? "rgba(150,255,100,.5)" : "rgba(90,200,60,.22)"; ctx.lineWidth = 1.1; ctx.stroke();
      ctx.restore();
    }
    // front smoke drifting across
    ctx.globalCompositeOperation = "screen";
    drawSmoke(front, dt);
    // sparkles: twinkling four-point stars
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < sparkles.length; i++) {
      const sp = sparkles[i];
      sp.life += dt / sp.max;
      if (sp.life >= 1) { sparkles[i] = newSparkle(false); continue; }
      const a = Math.pow(Math.sin(sp.life * Math.PI), 2);
      const s = sp.s * (.6 + .4 * a);
      ctx.globalAlpha = a * .85;
      ctx.drawImage(sp.blue ? DOT_B : DOT_G, sp.x - s * 1.5, sp.y - s * 1.5, s * 3, s * 3);
      ctx.strokeStyle = sp.blue ? "rgba(200,230,255,.9)" : "rgba(220,255,200,.9)"; ctx.lineWidth = .8;
      ctx.beginPath(); ctx.moveTo(sp.x - s * 2.2, sp.y); ctx.lineTo(sp.x + s * 2.2, sp.y); ctx.moveTo(sp.x, sp.y - s * 2.2); ctx.lineTo(sp.x, sp.y + s * 2.2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    // embers drifting up, wobbling
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < embers.length; i++) {
      const e = embers[i];
      e.life += dt / e.max;
      if (e.life >= 1) { embers[i] = newEmber(false); continue; }
      e.wob += dt;
      e.x += (e.vx + Math.sin(e.wob * 1.3) * 4) * dt; e.y += e.vy * dt;
      ctx.globalAlpha = Math.sin(e.life * Math.PI) * .75;
      ctx.drawImage(e.blue ? DOT_B : (Math.random() < .03 ? DOT_W : DOT_G), e.x - e.s / 2, e.y - e.s / 2, e.s, e.s);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function start() { if (!running && !reduce) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function still() { for (let i = 0; i < 240; i++) draw(1 / 30); }   // reduced motion: one settled frame

  resize();
  if (reduce) still(); else { for (let i = 0; i < 90; i++) draw(1 / 30); start(); }   // pre-roll: trails already formed
  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { resize(); runes = null; if (reduce) still(); }, 150); });
  new IntersectionObserver(es => es.forEach(e => e.isIntersecting && !document.hidden ? start() : stop())).observe(canvas);
  document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());
})();
