// Dot sculptures on <canvas data-shape="...">.
// Each shape is a flat silhouette given a wavy, scattered depth, so it only reads
// correctly from the front. The cloud turns continuously, easing as the front view
// comes around; dragging adds spin either way, and it eases back to its normal pace.
(() => {
  const canvases = document.querySelectorAll("canvas[data-shape]");
  if (!canvases.length) return;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Silhouettes drawn on a 400×400 canvas (y down). Filled pixels become dots;
  // thin cut-outs (panel lines, hinges, rings) show up as gaps in the dots.
  const cut = (g, f) => { g.save(); g.globalCompositeOperation = "destination-out"; f(); g.restore(); };
  const mirror = (g, f) => { f(); g.save(); g.translate(400, 0); g.scale(-1, 1); f(); g.restore(); };
  const poly = (g, ...p) => { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  const line = (g, w, ...p) => { g.lineWidth = w; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke(); };
  const ell = (g, x, y, rx, ry, r = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, r, 0, 7); g.fill(); };

  const SHAPES = {
    at(g) { // contact: @
      g.font = "600 330px 'STIX Two Text', 'Times New Roman', serif";
      g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText("@", 200, 214);
    },

    jet(g) { // home: twin-engine airliner, top view, nose up
      mirror(g, () => {
        poly(g, 212, 148, 378, 240, 380, 254, 264, 229, 212, 215);   // swept wing, cranked trailing edge
        poly(g, 211, 318, 286, 350, 286, 361, 211, 347);             // horizontal stabilizer
        ell(g, 266, 168, 10, 27);                                   // engine nacelle ahead of the wing
        poly(g, 376, 240, 382, 222, 386, 223, 382, 252);             // winglet
      });
      g.beginPath();                                                // fuselage with tapered tail cone
      g.moveTo(200, 20); g.bezierCurveTo(212, 24, 214, 52, 214, 82);
      g.lineTo(214, 300); g.bezierCurveTo(214, 332, 206, 360, 202, 380);
      g.lineTo(198, 380); g.bezierCurveTo(194, 360, 186, 332, 186, 300);
      g.lineTo(186, 82); g.bezierCurveTo(186, 52, 188, 24, 200, 20); g.fill();
      cut(g, () => {
        mirror(g, () => {
          line(g, 3, 217, 206, 264, 219, 372, 245);   // flap / aileron hinge line
          line(g, 3, 300, 228, 300, 236);              // flap–aileron split
          line(g, 3, 216, 338, 282, 353);              // elevator hinge
          line(g, 2.5, 257, 149, 275, 149);            // engine intake lip
        });
        g.lineWidth = 4; g.beginPath(); g.arc(200, 64, 11, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); // windshield
      });
    },

    quad(g) { // UAV: the finished quad, traced from a top-down photo; coordinates are photo pixels
      g.save();
      g.translate(200 - 420 * 0.47, 200 - 425 * 0.47); g.scale(0.47, 0.47);
      const blade = (hx, hy, ex, ey, w) => {                               // swept, tapered prop blade
        const dx = ex - hx, dy = ey - hy, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, px = -uy, py = ux;
        const P = [[0.1, 0.35], [0.35, 0.85], [0.65, 1], [0.9, 0.75], [1, 0.3]];
        g.beginPath();
        P.forEach(([t, k], i) => { const x = hx + dx * t + px * w * k, y = hy + dy * t + py * w * k; i ? g.lineTo(x, y) : g.moveTo(x, y); });
        for (let i = P.length - 1; i >= 0; i--) { const [t, k] = P[i]; g.lineTo(hx + dx * t - px * w * k * 0.35, hy + dy * t - py * w * k * 0.35); }
        g.closePath(); g.fill();
      };
      const M = [[205, 195], [650, 210], [195, 645], [630, 640]];          // motor centers
      const PROP = [-100, 20, 140].map((d) => (d * Math.PI) / 180);        // same blade angles on every motor
      // arms, wider at the body
      poly(g, 190, 175, 230, 172, 372, 362, 330, 392);
      poly(g, 630, 190, 672, 200, 520, 395, 478, 362);
      poly(g, 172, 630, 214, 662, 352, 512, 318, 478);
      poly(g, 612, 662, 652, 626, 520, 482, 482, 515);
      // center body: a plain upright rectangle, longer front to back, like the real frame
      g.beginPath(); g.roundRect(318, 290, 206, 262, 10); g.fill();
      for (const [cx, cy] of M) {
        ell(g, cx, cy, 40, 40);                                            // motor bell
        for (const a of PROP) blade(cx, cy, cx + Math.cos(a) * 160, cy + Math.sin(a) * 160, 30);
      }
      cut(g, () => {
        for (const [cx, cy] of M) {
          g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, 26, 0, 7); g.stroke();
          ell(g, cx - 10, cy, 5, 5); ell(g, cx + 10, cy, 5, 5);            // prop screws
        }
      });
      g.restore();
    },

    arm(g) { // SkillsUSA: Yaskawa GP7-class 6-axis robot, true side view in its reference pose.
      // Proportions from Yaskawa's GP7 dimension drawing (mm): base→L axis 330, L→U 385 (lower arm upright),
      // U→top of forearm 62, U→wrist 40 + 340 forward, wrist→flange 80, overall height 777.
      g.save();
      g.translate(200 - 195 * 0.44, 200 + 395 * 0.44); g.scale(0.44, -0.44); // millimetres, y up, L axis at (0, 330)
      const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); };
      rr(-128, 0, 256, 22, 4);                                             // mounting plate
      poly(g, -112, 22, 112, 22, 98, 150, -98, 150);                       // S-axis base
      rr(-96, 146, 186, 186, 34);                                          // turret up to the L axis
      ell(g, 6, 330, 84, 84);                                              // L-axis motor housing
      poly(g, -56, 330, 64, 330, 56, 715, -50, 715);                       // lower arm, upright, slight taper
      ell(g, 0, 715, 70, 70);                                              // U-axis housing
      g.beginPath();                                                       // forearm: U motor at the back, tapering forward to the wrist
      g.moveTo(-118, 700); g.quadraticCurveTo(-122, 777, -60, 777);
      g.lineTo(300, 777); g.quadraticCurveTo(352, 776, 360, 752);
      g.lineTo(360, 684); g.quadraticCurveTo(340, 672, 300, 676);
      g.lineTo(60, 652); g.quadraticCurveTo(-110, 640, -118, 700);
      g.closePath(); g.fill();
      rr(344, 680, 80, 78, 18);                                            // B-axis wrist
      rr(424, 690, 32, 58, 6);                                             // T-axis flange (Ø60)
      rr(456, 682, 26, 74, 4);                                             // gripper body
      g.fillRect(482, 732, 46, 14); g.fillRect(482, 692, 46, 14);          // fingers
      cut(g, () => {
        const ring = (x, y, r, w) => { g.lineWidth = w; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); };
        ring(6, 330, 52, 9); ell(g, 6, 330, 16, 16);                       // L axis
        ring(0, 715, 42, 8); ell(g, 0, 715, 13, 13);                       // U axis
        ring(384, 719, 22, 7);                                             // B axis
        line(g, 7, -110, 150, 110, 150);                                   // base / turret seam
        line(g, 6, 344, 680, 344, 758);                                    // forearm / wrist joint
      });
      g.restore();
      cut(g, () => {                                                       // name on the forearm (drawn unflipped)
        g.font = "800 13px 'Martian Mono', ui-monospace, monospace"; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText("YASKAWA", 200 + (130 - 195) * 0.44, 200 + (395 - 716) * 0.44);
      });
    },

    tow(g) { // DBF: the RCAT aircraft, top view, nose up, towing the sensor
      // fuselage: round nose cone, body, tapering tail boom
      g.beginPath();
      g.moveTo(178, 70); g.bezierCurveTo(178, 26, 222, 26, 222, 70);
      g.lineTo(222, 150); g.bezierCurveTo(220, 200, 210, 250, 207, 300);
      g.lineTo(193, 300); g.bezierCurveTo(190, 250, 180, 200, 178, 150); g.closePath(); g.fill();
      // high wing: straight, slightly tapered, rounded tips
      g.beginPath();
      g.moveTo(40, 120); g.lineTo(360, 120); g.quadraticCurveTo(376, 122, 374, 136);
      g.lineTo(366, 158); g.lineTo(220, 168); g.lineTo(180, 168); g.lineTo(34, 158);
      g.lineTo(26, 136); g.quadraticCurveTo(24, 122, 40, 120); g.closePath(); g.fill();
      // twin wing-mounted motors with props
      for (const x of [132, 268]) {
        ell(g, x, 112, 11, 34);                                            // nacelle, well ahead of the wing
        ell(g, x, 76, 7, 7);                                               // spinner
        ell(g, x, 74, 44, 5);                                              // prop, seen from above
      }
      // tail: horizontal stabilizer and fin
      poly(g, 200, 278, 266, 286, 266, 302, 200, 306, 134, 302, 134, 286);
      g.fillRect(197, 262, 6, 46);
      // tow line and sensor
      g.setLineDash([9, 6]); g.lineCap = "butt";
      g.lineWidth = 3; g.beginPath(); g.moveTo(200, 308); g.quadraticCurveTo(202, 340, 220, 356); g.stroke();
      g.setLineDash([]);
      ell(g, 228, 370, 9, 20, -0.45);
      line(g, 4, 234, 383, 246, 394); line(g, 4, 228, 387, 224, 398);
      cut(g, () => {
        line(g, 3, 180, 72, 220, 72);                                      // nose cone seam
        line(g, 3, 40, 150, 120, 154); line(g, 3, 280, 154, 360, 150);     // ailerons
        line(g, 3, 140, 296, 260, 296);                                    // elevator
        line(g, 3, 186, 120, 186, 168); line(g, 3, 214, 120, 214, 168);    // wing–fuselage joint
        for (const x of [132, 268]) line(g, 3, x - 12, 120, x + 12, 120); // nacelle meets the wing
      });
    },

    joystick(g) { // Arcade: the Mini Galaga cabinet, traced from the render (3/4 view); coordinates are render pixels
      g.save();
      g.translate(200 - 632 * 0.43, 200 - 465 * 0.43); g.scale(0.43, 0.43);
      // cabinet silhouette: marquee box on top, recessed screen, control ledge, lower body
      poly(g, 355, 105, 710, 45, 900, 85, 900, 192, 868, 198, 868, 430, 910, 470, 905, 795, 548, 885, 370, 720);
      cut(g, () => {
        line(g, 7, 355, 105, 528, 150); line(g, 7, 528, 150, 900, 85);     // top face edges
        line(g, 9, 528, 256, 900, 190);                                    // underside of the marquee
        line(g, 7, 528, 150, 528, 256);                                    // marquee corner
        line(g, 7, 548, 552, 548, 885);                                    // body corner
        poly(g, 540, 268, 812, 222, 812, 378, 545, 432);                   // screen: left open so it reads as a window
        line(g, 12, 528, 256, 510, 505);                                   // side panel front edge (recess)
        line(g, 12, 510, 505, 860, 432); line(g, 12, 560, 552, 910, 474); line(g, 10, 510, 505, 560, 552); // ledge
      });
      for (const [x, y] of [[607, 507], [685, 488], [803, 461]]) {         // red, blue and green domed buttons
        cut(g, () => ell(g, x, y, 42, 27));
        ell(g, x, y, 31, 19);
        g.beginPath(); g.ellipse(x, y - 2, 31, 25, 0, Math.PI, 0); g.fill();
      }
      g.restore();
    },

    boat(g) { // Odysseus's Ship Showdown: the game's ship, traced from the CAD, side view, bow right
      const sheer = () => {                       // high stern, dip amidships, rising to the bow knob
        g.moveTo(24, 196);
        g.bezierCurveTo(60, 198, 110, 244, 145, 248);
        g.bezierCurveTo(182, 252, 214, 236, 238, 234);
        g.bezierCurveTo(264, 232, 292, 226, 312, 216);
      };
      g.lineCap = "butt";
      g.fillRect(105, 138, 7, 96);                                         // mizzen mast
      g.fillRect(180, 92, 8, 160);                                         // main mast
      // hull: round, deep and chunky like the CAD
      g.beginPath(); sheer();
      g.quadraticCurveTo(324, 210, 330, 218);                              // bow knob
      g.quadraticCurveTo(326, 258, 296, 292);                              // stem
      g.bezierCurveTo(254, 318, 140, 324, 78, 300);                        // keel
      g.bezierCurveTo(36, 284, 18, 236, 24, 196);                          // tall rounded stern
      g.closePath(); g.fill();
      poly(g, 314, 228, 384, 230, 384, 237, 312, 236);                     // bowsprit
      // square sails seen side-on, edges eased by the billow
      g.beginPath(); g.moveTo(140, 98); g.lineTo(232, 98);
      g.quadraticCurveTo(272, 166, 226, 234); g.lineTo(150, 234);
      g.quadraticCurveTo(176, 166, 140, 98); g.fill();
      g.beginPath(); g.moveTo(76, 142); g.lineTo(146, 142);
      g.quadraticCurveTo(176, 178, 142, 212); g.lineTo(84, 212);
      g.quadraticCurveTo(102, 178, 76, 142); g.fill();
      g.fillRect(134, 90, 104, 8); g.fillRect(146, 234, 46, 6);            // main yards (short foot yard, as in the CAD)
      g.fillRect(70, 135, 82, 7); g.fillRect(80, 212, 36, 5);              // mizzen yards
      cut(g, () => {
        line(g, 3, 132, 99, 240, 99); line(g, 3, 68, 143, 154, 143);       // yard seams
        g.lineWidth = 3;
        g.beginPath(); g.moveTo(186, 102); g.quadraticCurveTo(222, 166, 186, 230); g.stroke(); // sail panels
        g.beginPath(); g.moveTo(112, 146); g.quadraticCurveTo(138, 178, 112, 208); g.stroke();
        g.save(); g.translate(0, 12); g.beginPath(); sheer(); g.stroke(); g.restore(); // rub rail
        g.beginPath(); g.moveTo(148, 266); g.quadraticCurveTo(142, 292, 152, 318); g.stroke(); // plank seam
        g.beginPath(); g.arc(62, 250, 15, 0, 7); g.stroke();               // porthole
        line(g, 3, 47, 250, 77, 250); line(g, 3, 62, 235, 62, 265);
      });
    },
  };

  const COLORS = ["#0e9c88", "#2fc4ad", "#7fdccd", "#a9b3b5", "#6f7a7c", "#3d4547"];
  const SIZES = [1.3, 1.9, 2.6];
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.8;

  function build(name, n) {
    const c = document.createElement("canvas");
    c.width = c.height = 400;
    const g = c.getContext("2d");
    g.fillStyle = g.strokeStyle = "#000";
    (SHAPES[name] || SHAPES.jet)(g);
    const a = g.getImageData(0, 0, 400, 400).data;
    const filled = [];
    for (let i = 0; i < 160000; i += 2) if (a[i * 4 + 3] > 140) filled.push(i);
    const pts = new Float32Array(n * 3), col = new Uint8Array(n);
    const k1 = 1.6 + Math.random(), k2 = 2.2 + Math.random(), ph = Math.random() * 6;
    for (let i = 0; i < n; i++) {
      const p = filled[(Math.random() * filled.length) | 0];
      const X = ((p % 400) + Math.random() * 2 - 200) / 200;
      const Z = (200 - ((p / 400) | 0) - Math.random()) / 200;
      // depth: a smooth wave plus scatter, so side-on it is a rippled cloud
      const stray = Math.random() < 0.08;
      const Y = 0.42 * Math.sin(k1 * X + ph) + 0.3 * Math.cos(k2 * Z - ph) + gauss() * (stray ? 0.55 : 0.22);
      pts[i * 3] = X + (stray ? gauss() * 0.04 : 0);
      pts[i * 3 + 1] = Y;
      pts[i * 3 + 2] = Z + (stray ? gauss() * 0.04 : 0);
      const t = (Y + 0.9) / 1.8;
      col[i] = Math.max(0, Math.min(COLORS.length - 1, Math.floor(t * COLORS.length + gauss() * 0.8)));
    }
    return { pts, col, n };
  }

  const PACKED = COLORS.map((c) => {
    const v = parseInt(c.slice(1), 16);
    return ((0xe0 << 24) | ((v & 0xff) << 16) | (v & 0xff00) | (v >> 16)) >>> 0;
  });
  const stamps = (dpr) => SIZES.map((s) => {
    const r = s * dpr, R = Math.ceil(r), out = [];
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) if (x * x + y * y <= r * r) out.push(x, y);
    return Int16Array.from(out);
  });

  // Always turning. One lap takes ~14 s, easing to under half speed as the
  // readable front view comes around so it lingers there briefly.
  const TAU = Math.PI * 2, V0 = TAU / 14000; // rad per ms
  const speed = (yaw) => {
    let d = ((yaw % TAU) + TAU) % TAU;
    d = Math.min(d, TAU - d);
    return V0 * (1 - 0.58 * Math.exp(-((d / 0.5) ** 2)));
  };


  const start = (cv) => {
    const ctx = cv.getContext("2d");
    const dpr = Math.min(1.5, devicePixelRatio || 1);
    const data = build(cv.dataset.shape, innerWidth < 760 ? 6000 : 11000);
    const st = stamps(dpr);
    const cx = parseFloat(cv.dataset.cx || "0.5");
    let w = 0, h = 0, img = null, buf = null, raf = 0, last = 0, seen = false;
    // yaw: current angle; extra: spin added by dragging, which fades away.
    let yaw = 0, extra = 0, dir = 1, dragging = false, lastX = 0;

    const geo = () => {
      const narrow = innerWidth < 760; // small canvas beside the heading: center the shape in it
      return { S: Math.min(w, h) * 0.42, ox: w * (narrow ? 0.5 : cx), oy: h * (narrow ? 0.5 : 0.47) };
    };

    const draw = () => {
      if (!w || !h) return;
      buf.fill(0);
      const tilt = 0.32 * Math.sin(yaw / 2) ** 2; // level when readable, tipped while turning
      const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(tilt), sp = Math.sin(tilt);
      const { S, ox, oy } = geo();
      const { pts, col, n } = data;
      for (let i = 0; i < n; i++) {
        const x = pts[i * 3], y = pts[i * 3 + 1], z = pts[i * 3 + 2];
        const x1 = x * cyw - y * syw, y1 = x * syw + y * cyw;
        const y2 = y1 * cp - z * sp, z2 = y1 * sp + z * cp;
        const px = (ox + x1 * S) | 0, py = (oy - z2 * S) | 0;
        const s = st[y2 > 0.3 ? 2 : y2 > -0.3 ? 1 : 0], c = PACKED[col[i]];
        for (let k = 0; k < s.length; k += 2) {
          const qx = px + s[k], qy = py + s[k + 1];
          if (qx >= 0 && qx < w && qy >= 0 && qy < h) buf[qy * w + qx] = c;
        }
      }
      ctx.putImageData(img, 0, 0);
      if (!seen) { seen = true; cv.classList.add("is-drawn"); }
    };

    const frame = (t) => {
      const dt = last ? Math.min(50, t - last) : 16;
      last = t;
      extra *= Math.pow(0.9975, dt);
      // Spins either way: a strong enough push the other way flips the direction,
      // and it never drops below a slow minimum, so it never stops.
      let v = dir * speed(yaw) + extra;
      if (Math.sign(v) === -dir && Math.abs(v) > V0 * 0.2) dir = -dir;
      if (Math.abs(v) < V0 * 0.35) v = dir * V0 * 0.35;
      yaw += v * dt;
      draw();
      raf = requestAnimationFrame(frame);
    };
    const play = () => { if (!raf && !still) { last = 0; raf = requestAnimationFrame(frame); } };
    const pause = () => { cancelAnimationFrame(raf); raf = 0; };

    new ResizeObserver(() => {
      w = cv.width = Math.round(cv.clientWidth * dpr);
      h = cv.height = Math.round(cv.clientHeight * dpr);
      if (w && h) { img = ctx.createImageData(w, h); buf = new Uint32Array(img.data.buffer); }
      draw();
    }).observe(cv);

    let visible = false;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible && !document.hidden ? play() : pause(); }).observe(cv);
    document.addEventListener("visibilitychange", () => (document.hidden || !visible ? pause() : play()));

    // Click and drag the shape sideways to spin it; let go and it coasts.
    const host = cv.parentElement;
    const onShape = (e) => {
      if (e.target.closest("a, button, input, select, textarea, label")) return false;
      const r = cv.getBoundingClientRect(), { S, ox, oy } = geo();
      return Math.hypot(e.clientX - (r.left + ox / dpr), e.clientY - (r.top + oy / dpr)) < (S / dpr) * 1.05;
    };
    host.addEventListener("pointerdown", (e) => {
      if (e.button || !onShape(e)) return;
      e.preventDefault();
      dragging = true; lastX = e.clientX;
      host.setPointerCapture(e.pointerId);
      host.classList.add("is-spinning");
      play();
    });
    host.addEventListener("pointermove", (e) => {
      if (!dragging) { host.classList.toggle("can-spin", onShape(e)); return; }
      const dx = e.clientX - lastX; lastX = e.clientX;
      if (still) { yaw += dx * 0.011; draw(); return; }
      // push either way; enough push the other way reverses it (see frame())
      extra = Math.max(-V0 * 14, Math.min(V0 * 14, extra + dx * 0.000035));
    });
    const release = () => { if (!dragging) return; dragging = false; host.classList.remove("is-spinning"); };
    host.addEventListener("pointerup", release);
    host.addEventListener("pointercancel", release);
    host.addEventListener("pointerleave", () => host.classList.remove("can-spin"));
  };

  // The @ uses the site serif, so wait for it before sampling.
  const ready = document.fonts ? document.fonts.load("600 330px 'STIX Two Text'").catch(() => {}) : Promise.resolve();
  ready.then(() => canvases.forEach(start));
})();
