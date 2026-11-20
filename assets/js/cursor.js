// A cluster of very light grey dots that clings to the mouse and trails behind its path.
// Each dot chases where the pointer was a few frames ago on a damped spring, so the
// cloud stretches out behind movement and gathers back in when the mouse stops.
// Mouse/trackpad only; skipped for touch and reduced motion. Idles when nothing moves.
(() => {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const cv = document.createElement("canvas");
  cv.className = "cursor-dots";
  cv.setAttribute("aria-hidden", "true");
  document.body.prepend(cv);
  const ctx = cv.getContext("2d");
  const dpr = Math.min(2, devicePixelRatio || 1);

  const N = 90, HIST = 28;
  const GREYS = ["#eef0f1", "#e8ebec", "#e2e6e7", "#dce0e1"];
  const BLUES = ["#c8eee7", "#b6e8df", "#a3e1d6", "#90dace"]; // site cyan-green, over anything clickable
  const STEPS = 8;
  // SHADES[i][s]: grey i blended s/(STEPS-1) of the way to its blue.
  const SHADES = GREYS.map((a, i) => {
    const A = parseInt(a.slice(1), 16), B = parseInt(BLUES[i].slice(1), 16);
    return Array.from({ length: STEPS }, (_, s) => {
      const t = s / (STEPS - 1);
      const ch = (sh) => Math.round(((A >> sh) & 255) * (1 - t) + ((B >> sh) & 255) * t);
      return `rgb(${ch(16)} ${ch(8)} ${ch(0)})`;
    });
  });
  const CLICKABLE = "a[href], button, [role='button'], input, select, textarea, label, summary";
  let tint = 0, wantTint = 0, hoverEl = null, cling = 0, lastR = null;
  const g = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
  const P = Array.from({ length: N }, () => {
    const lag = Math.floor(Math.random() ** 1.6 * (HIST - 1)); // most dots near the pointer, a tail behind
    const spread = 1 - (lag / HIST) * 0.55;                       // the tail tapers
    const r = (Math.abs(g()) * 28 + 3) * spread, a = Math.random() * Math.PI * 2;
    return {
      lag, ox: Math.cos(a) * r, oy: Math.sin(a) * r * 0.85,
      u: Math.random(), j: g() * 4, // spot on a hovered element's outline, and distance off it
      x: 0, y: 0, vx: 0, vy: 0,
      k: 0.07 + Math.random() * 0.07,  // spring stiffness
      s: [1.4, 2, 2.6][Math.floor(Math.random() * 3)],
      c: Math.floor(Math.random() * GREYS.length),
      ph: Math.random() * 6.28, sp: 0.4 + Math.random() * 0.8,
    };
  });

  const hx = new Float32Array(HIST), hy = new Float32Array(HIST);
  let head = 0, w = 0, h = 0, mx = 0, my = 0, alpha = 0, want = 0, raf = 0, lastMove = 0, placed = false;

  const size = () => {
    w = innerWidth; h = innerHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  addEventListener("resize", size, { passive: true });

  const frame = (t) => {
    head = (head + 1) % HIST;
    hx[head] = mx; hy[head] = my;
    alpha += (want - alpha) * 0.08;
    tint += (wantTint - tint) * 0.12;
    const shade = Math.round(tint * (STEPS - 1));
    // Cling: while over something clickable, dots spread onto its outline.
    let R = null;
    if (hoverEl && hoverEl.isConnected) {
      // a project title link covers its whole row, so outline the row
      const box = hoverEl.matches(".proj__t a") ? hoverEl.closest(".proj") : hoverEl;
      const b = box.getBoundingClientRect();
      if (b.width && b.height && b.width <= w) R = { x: b.left - 7, y: b.top - 6, w: b.width + 14, h: b.height + 12 };
    }
    cling += ((R ? 1 : 0) - cling) * 0.14;
    if (R) lastR = R;
    const Q = lastR, per = Q ? 2 * (Q.w + Q.h) : 0;
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = alpha * 0.55;
    let energy = 0;
    for (const p of P) {
      const i = (head - p.lag + HIST) % HIST;
      let tx = hx[i] + p.ox + Math.cos(t * 0.0009 * p.sp + p.ph) * 3;
      let ty = hy[i] + p.oy + Math.sin(t * 0.0011 * p.sp + p.ph) * 3;
      if (cling > 0.01 && Q) {
        let d = ((p.u + t * 0.00002 * p.sp) % 1) * per, ex, ey;
        if (d < Q.w) { ex = Q.x + d; ey = Q.y - p.j; }
        else if ((d -= Q.w) < Q.h) { ex = Q.x + Q.w + p.j; ey = Q.y + d; }
        else if ((d -= Q.h) < Q.w) { ex = Q.x + Q.w - d; ey = Q.y + Q.h + p.j; }
        else { d -= Q.w; ex = Q.x - p.j; ey = Q.y + Q.h - d; }
        tx += (ex - tx) * cling; ty += (ey - ty) * cling;
      }
      p.vx = (p.vx + (tx - p.x) * p.k) * 0.74;   // sticky: strong pull, heavy damping
      p.vy = (p.vy + (ty - p.y) * p.k) * 0.74;
      p.x += p.vx; p.y += p.vy;
      energy += Math.abs(p.vx) + Math.abs(p.vy);
      ctx.fillStyle = SHADES[p.c][shade];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, 6.283);
      ctx.fill();
    }
    const idle = t - lastMove > 2500 && energy < N * 0.05 && Math.abs(wantTint - tint) < 0.01 && !(hoverEl && t - lastMove < 6000);
    if ((alpha < 0.01 && want === 0) || idle) { raf = 0; if (alpha < 0.01) ctx.clearRect(0, 0, w, h); return; }
    raf = requestAnimationFrame(frame);
  };
  const run = () => { if (!raf) raf = requestAnimationFrame(frame); };

  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    mx = e.clientX; my = e.clientY;
    hoverEl = (e.target.closest && e.target.closest(CLICKABLE)) || null;
    wantTint = hoverEl ? 1 : 0;
    if (!placed) {
      placed = true;
      hx.fill(mx); hy.fill(my);
      for (const p of P) { p.x = mx + p.ox; p.y = my + p.oy; }
    }
    want = 1; lastMove = performance.now(); run();
  }, { passive: true });
  addEventListener("scroll", () => { lastMove = performance.now(); run(); }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { want = 0; run(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) { want = 0; alpha = 0; } });
})();
