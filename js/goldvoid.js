/* ASMI "Void & Gold" interactive background.
   A pitch-black field of gold specks that light up around the cursor (or finger),
   drift, link into faint constellations and fade back to black within a few seconds.
   Clicking/tapping empty space sends out a thin gold ring.
   - No libraries, no external requests.
   - Sleeps completely when nothing is lit (no CPU/battery use while idle).
   - Off for visitors who ask their device for reduced motion. */
(() => {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'gold-void';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d', { alpha: false });

  const GOLD = [
    [255, 215, 0],    // 24K gold
    [255, 229, 127],  // champagne gold
    [212, 175, 55],   // burnished gold
    [255, 248, 220],  // white-gold core
    [197, 155, 39]    // antique gold
  ];
  const coarse = matchMedia('(pointer: coarse)').matches;
  const cfg = {
    density: coarse ? 0.32 : 1.1,   // specks per 1750 px² of screen
    radius: coarse ? 170 : 210,    // how far around the pointer gold wakes up
    fadeMs: 3200,                  // everything is black again after this
    links: !coarse                 // constellation lines (desktop only)
  };

  let W = 0, H = 0, dpr = 1, parts = [], sparks = [], rings = [];
  const ptr = { x: -9999, y: -9999, active: false, last: 0 };
  let running = false, lastT = 0;

  class Speck {
    constructor() {
      this.x = Math.random() * W; this.y = Math.random() * H;
      this.z = Math.pow(Math.random(), 1.55) * 0.85 + 0.15;          // depth
      this.size = 0.42 + this.z * 1.38;
      const a = Math.random() * Math.PI * 2, s = (0.03 + Math.random() * 0.12) * this.z;
      this.vx = Math.cos(a) * s; this.vy = Math.sin(a) * s;
      this.ph = Math.random() * 6.283; this.phs = 0.035 + Math.random() * 0.065;
      this.c = GOLD[(Math.random() * GOLD.length) | 0];
      const r = Math.random(); this.type = r < 0.62 ? 0 : r < 0.9 ? 1 : 2;   // dot / star / diamond
      this.e = 0; this.woke = 0;
      this.rot = Math.random() * 6.283; this.rs = (Math.random() - 0.5) * 0.015;
    }
    update(k, now, src) {
      this.x += this.vx * k; this.y += this.vy * k;
      if (this.x < -15) this.x += W + 30; else if (this.x > W + 15) this.x -= W + 30;
      if (this.y < -15) this.y += H + 30; else if (this.y > H + 15) this.y -= H + 30;
      this.ph += this.phs * k; this.rot += this.rs * k;

      const R = cfg.radius * (0.62 + this.z * 0.48);
      let target = 0;
      if (src) {
        const dx = this.x - src.x, dy = this.y - src.y, d2 = dx * dx + dy * dy;
        if (d2 < R * R) {
          const d = Math.sqrt(d2), f = 1 - d / R;
          target = f * f * (3 - 2 * f) * src.p;
          if (d > 1 && d < R * 0.42) {                                     // gentle swirl
            const force = (1 - d / (R * 0.42)) * 0.055 * this.z * k * src.p;
            this.x += (dx / d) * force * 1.2 - (dy / d) * force * 0.7;
            this.y += (dy / d) * force * 1.2 + (dx / d) * force * 0.7;
          }
        }
      }
      for (const g of rings) {
        const dx = this.x - g.x, dy = this.y - g.y, band = Math.abs(Math.sqrt(dx * dx + dy * dy) - g.r);
        if (band < 42) target = Math.max(target, (1 - band / 42) * g.a * 0.95);
      }
      if (target > 0.01) {
        if (target > this.e) this.e += (target - this.e) * Math.min(1, 0.28 * k);
        this.woke = now;
      }
      if (target <= this.e) this.e -= (16.667 / cfg.fadeMs) * (1.2 + (1 - this.z) * 0.5) * k;
      if (now - this.woke >= cfg.fadeMs || this.e < 0.002) this.e = 0;
    }
    draw() {
      if (this.e <= 0.002) return;
      const shimmer = 0.62 + 0.38 * Math.sin(this.ph);
      const glint = Math.pow(Math.max(0, Math.sin(this.ph * 1.85)), 10);
      const a = Math.min(1, this.e * (0.72 + 0.28 * shimmer + glint * 0.45));
      if (a < 0.005) return;
      const [r, g, b] = this.c, s = this.size * (1 + this.e * 0.48 + glint * 0.32 * this.e);
      if (this.type === 0 || this.e < 0.14) {
        ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(this.x, this.y, s, 0, 6.283); ctx.fill();
        if (this.e > 0.58 && this.z > 0.55) {
          ctx.fillStyle = `rgba(255,253,240,${(this.e * 0.9).toFixed(3)})`;
          ctx.beginPath(); ctx.arc(this.x, this.y, s * 0.42, 0, 6.283); ctx.fill();
        }
      } else if (this.type === 1) {                                        // 4-point star
        const L = s * (1.85 + this.e * 2.4), c = Math.max(0.55, L * 0.15);
        ctx.save(); ctx.translate(this.x, this.y);
        ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
        ctx.beginPath(); ctx.moveTo(0, -L);
        ctx.quadraticCurveTo(c * .32, -c * .32, L, 0); ctx.quadraticCurveTo(c * .32, c * .32, 0, L);
        ctx.quadraticCurveTo(-c * .32, c * .32, -L, 0); ctx.quadraticCurveTo(-c * .32, -c * .32, 0, -L);
        ctx.fill();
        ctx.fillStyle = `rgba(255,254,245,${Math.min(1, a * 1.15).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(0, 0, c * 0.7, 0, 6.283); ctx.fill();
        ctx.restore();
      } else {                                                             // micro-diamond
        const R = s * (1.5 + this.e * 1.4);
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot);
        ctx.strokeStyle = `rgba(${r},${g},${b},${(a * 0.85).toFixed(3)})`; ctx.lineWidth = 0.65;
        ctx.beginPath(); ctx.moveTo(0, -R); ctx.lineTo(R * .75, 0); ctx.lineTo(0, R); ctx.lineTo(-R * .75, 0); ctx.closePath(); ctx.stroke();
        ctx.fillStyle = `rgba(255,229,127,${a.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(0, 0, Math.max(0.6, R * 0.22), 0, 6.283); ctx.fill();
        ctx.restore();
      }
    }
  }

  class Spark {
    constructor(x, y, vx, vy) {
      this.x = x + (Math.random() - .5) * 14; this.y = y + (Math.random() - .5) * 14;
      this.vx = vx * (0.06 + Math.random() * 0.1) + (Math.random() - .5) * 0.9;
      this.vy = vy * (0.06 + Math.random() * 0.1) + (Math.random() - .5) * 0.9;
      this.life = 1; this.dec = 0.024 + Math.random() * 0.03; this.s = 0.5 + Math.random() * 1.2;
      this.c = GOLD[(Math.random() * GOLD.length) | 0];
    }
    step(k) {
      this.x += this.vx * k; this.y += this.vy * k;
      this.vx *= Math.pow(0.95, k); this.vy *= Math.pow(0.95, k); this.life -= this.dec * k;
      if (this.life > 0.01) {
        const [r, g, b] = this.c;
        ctx.fillStyle = `rgba(${r},${g},${b},${(this.life * this.life).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.s * this.life, 0, 6.283); ctx.fill();
      }
    }
  }

  class Ring {
    constructor(x, y, now) { this.x = x; this.y = y; this.t0 = now; this.dur = 3200; this.max = Math.min(W, H) * 0.55; this.r = 8; this.a = 1; this.off = Math.random() * 6.283; }
    step(now) {
      const p = (now - this.t0) / this.dur;
      if (p >= 1 || p < 0) { this.a = 0; return false; }
      this.r = 8 + (this.max - 8) * (1 - Math.pow(1 - p, 3));
      this.a = Math.pow(1 - p, 2.2);
      ctx.strokeStyle = `rgba(255,215,0,${(this.a * 0.6).toFixed(3)})`; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, 6.283); ctx.stroke();
      if (this.r > 24) {
        ctx.strokeStyle = `rgba(255,229,127,${(this.a * 0.35).toFixed(3)})`; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r * 0.96, this.off, this.off + 2.67); ctx.stroke();
      }
      return this.a > 0.004;
    }
  }

  function links() {
    if (!cfg.links) return;
    const CELL = 90, cols = Math.ceil(W / CELL) + 1, grid = new Map(), lit = [];
    for (const p of parts) if (p.e > 0.18 && p.z > 0.35) {
      const key = ((p.y / CELL) | 0) * cols + ((p.x / CELL) | 0);
      (grid.get(key) || grid.set(key, []).get(key)).push(p); lit.push(p);
    }
    ctx.lineWidth = 0.45;
    for (const p of lit) {
      let n = 0; const cx = (p.x / CELL) | 0, cy = (p.y / CELL) | 0;
      for (let dy = -1; dy <= 1 && n < 2; dy++) for (let dx = -1; dx <= 1 && n < 2; dx++) {
        const cell = grid.get((cy + dy) * cols + cx + dx); if (!cell) continue;
        for (const q of cell) {
          if (q === p || q.x < p.x) continue;
          const ddx = p.x - q.x, ddy = p.y - q.y, d2 = ddx * ddx + ddy * ddy;
          if (d2 > 36 && d2 < 4900) {
            const la = (1 - Math.sqrt(d2) / 70) * Math.min(p.e, q.e) * 0.32;
            if (la > 0.015) {
              ctx.strokeStyle = `rgba(212,175,55,${la.toFixed(3)})`;
              ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
              if (++n >= 2) break;
            }
          }
        }
      }
    }
  }

  function size() {
    W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2);
    canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const want = Math.min(coarse ? 450 : 1800, Math.floor((W * H) / 1750 * cfg.density));
    while (parts.length < want) parts.push(new Speck());
    parts.length = want;
    for (const p of parts) { if (p.x > W) p.x = Math.random() * W; if (p.y > H) p.y = Math.random() * H; }
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  }

  function frame(now) {
    const k = Math.min(3, Math.max(0.2, (now - lastT) / 16.667)); lastT = now;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);

    let src = null;
    const since = now - ptr.last;
    if (ptr.active && since < cfg.fadeMs) {
      const lr = 1 - since / cfg.fadeMs, p = lr * lr * (3 - 2 * lr);
      if (p > 0.005) src = { x: ptr.x, y: ptr.y, p };
    }
    rings = rings.filter(g => g.step(now));
    let lit = 0;
    for (const p of parts) { p.update(k, now, src); if (p.e > 0) lit++; }
    links();
    for (const p of parts) p.draw();
    sparks = sparks.filter(s => (s.step(k), s.life > 0.01));

    if (src || rings.length || sparks.length || lit) requestAnimationFrame(frame);
    else running = false;                                                  // everything is black: sleep
  }
  function wake() { if (!running && !document.hidden) { running = true; lastT = performance.now(); requestAnimationFrame(frame); } }

  function move(x, y) {
    const dx = x - ptr.x, dy = y - ptr.y, sp = Math.min(60, Math.hypot(dx, dy));
    ptr.x = x; ptr.y = y; ptr.active = true; ptr.last = performance.now();
    if (sp > 4.5 && sparks.length < 90) for (let i = 0; i < Math.min(3, Math.ceil(sp / 16)); i++) sparks.push(new Spark(x, y, dx, dy));
    wake();
  }
  const interactive = 'a,button,input,select,textarea,label,summary,canvas:not(#gold-void),[role=button]';
  function burst(x, y, target) {
    if (target && target.closest && target.closest(interactive)) return;   // don't fire over buttons, links, the form or the 3D route
    if (rings.length >= 3) rings.shift();
    rings.push(new Ring(x, y, performance.now()));
    for (let i = 0; i < 20; i++) {
      const a = (6.283 * i) / 20 + (Math.random() - .5) * .25, s = 10 + Math.random() * 24;
      sparks.push(new Spark(x, y, Math.cos(a) * s, Math.sin(a) * s));
    }
    wake();
  }

  addEventListener('pointermove', e => { if (e.pointerType !== 'touch') move(e.clientX, e.clientY); }, { passive: true });
  addEventListener('pointerdown', e => { move(e.clientX, e.clientY); burst(e.clientX, e.clientY, e.target); }, { passive: true });
  addEventListener('touchmove', e => { const t = e.touches[0]; if (t) move(t.clientX, t.clientY); }, { passive: true });
  document.addEventListener('mouseleave', () => { ptr.active = false; });
  addEventListener('blur', () => { ptr.active = false; });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { size(); wake(); }, 120); });

  size();
  // a short welcome shimmer in the upper right so first-time visitors see the effect
  setTimeout(() => { ptr.x = W * 0.72; ptr.y = H * 0.35; ptr.active = true; ptr.last = performance.now() - cfg.fadeMs * 0.45; wake(); }, 600);
})();
