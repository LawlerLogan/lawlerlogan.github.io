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

    arm(g) { // SkillsUSA: CSI's Yaskawa 6-axis robot, traced from a photo with its rounded castings (coordinates are traced pixels)
      g.save();
      const k = 0.377; g.translate(200 - 478 * k, 200 - 522 * k); g.scale(k, k);
      poly(g, 250, 915, 640, 895, 690, 985, 270, 1000);                    // mounting plate
      poly(g, 338, 800, 575, 795, 600, 955, 330, 962);                     // S-axis base
      g.beginPath();                                                       // waist: curves out from under the shoulder, then straight down
      g.moveTo(410, 514); g.quadraticCurveTo(340, 518, 340, 600); g.lineTo(342, 802);
      g.lineTo(578, 800); g.lineTo(574, 560); g.quadraticCurveTo(560, 520, 500, 512); g.closePath(); g.fill();
      ell(g, 505, 610, 95, 100);                                           // L-axis shoulder cover
      g.beginPath();                                                       // lower arm: curved front edge, big round elbow housing
      g.moveTo(492, 500); g.quadraticCurveTo(562, 432, 588, 322); g.lineTo(600, 274);
      g.bezierCurveTo(660, 222, 746, 262, 744, 400);
      g.bezierCurveTo(742, 482, 690, 548, 600, 562); g.lineTo(540, 592); g.closePath(); g.fill();
      g.beginPath();                                                       // forearm: rounded rear cap and a rounded nose into the elbow
      g.moveTo(300, 60); g.lineTo(568, 166);
      g.bezierCurveTo(636, 192, 640, 262, 596, 296);
      g.lineTo(262, 216);
      g.bezierCurveTo(196, 204, 196, 74, 300, 60); g.fill();
      g.beginPath(); g.roundRect(252, 222, 104, 86, 22); g.fill();         // wrist
      g.beginPath(); g.roundRect(228, 326, 165, 58, 8); g.fill();          // gripper body
      g.beginPath(); g.roundRect(276, 384, 22, 88, 6); g.fill(); g.beginPath(); g.roundRect(306, 384, 22, 88, 6); g.fill(); // fingers
      cut(g, () => {
        line(g, 12, 262, 222, 596, 302);                                   // forearm underside
        line(g, 12, 236, 318, 396, 318);                                   // wrist / gripper
        line(g, 10, 338, 800, 580, 798);                                   // waist / base
        g.lineWidth = 12; g.beginPath(); g.arc(505, 610, 60, 0, 7); g.stroke(); ell(g, 505, 610, 18, 18); // shoulder axis
        g.lineWidth = 10; g.beginPath(); g.arc(668, 300, 30, 0, 7); g.stroke();                            // elbow axis
        g.save(); g.translate(438, 132); g.rotate(0.37);
        g.font = "800 50px 'Martian Mono', ui-monospace, monospace"; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText("YASKAWA", 0, 0); g.restore();
      });
      g.restore();
    },

    tow(g) { // DBF: the RCAT aircraft, top-down, proportioned from the team render. Nose up.
      // fuselage: long ogive nose cone, carbon body, tapering tail boom
      g.beginPath();
      g.moveTo(200, 28);
      g.bezierCurveTo(214, 30, 223, 70, 223, 112);
      g.lineTo(223, 196);
      g.bezierCurveTo(222, 250, 210, 312, 207, 352);
      g.lineTo(193, 352);
      g.bezierCurveTo(190, 312, 178, 250, 177, 196);
      g.lineTo(177, 112);
      g.bezierCurveTo(177, 70, 186, 30, 200, 28);
      g.fill();
      // high wing: straight leading edge, slight taper, rounded tips
      g.beginPath();
      g.moveTo(34, 154); g.lineTo(366, 154);
      g.quadraticCurveTo(382, 155, 382, 168); g.lineTo(380, 186); g.quadraticCurveTo(378, 198, 364, 198);
      g.lineTo(224, 208); g.lineTo(176, 208); g.lineTo(36, 198);
      g.quadraticCurveTo(22, 198, 20, 186); g.lineTo(18, 168); g.quadraticCurveTo(18, 155, 34, 154);
      g.fill();
      // twin wing-mounted motors with two-blade props
      for (const x of [122, 278]) {
        ell(g, x, 146, 10, 28);                                            // nacelle, ahead of the wing
        ell(g, x, 116, 6, 6);                                              // spinner
        ell(g, x, 114, 46, 4.5);                                           // prop, seen from above
      }
      // tail: tapered horizontal stabilizer and the fin
      poly(g, 200, 316, 262, 322, 270, 330, 268, 344, 200, 348, 132, 344, 130, 330, 138, 322);
      g.fillRect(197, 296, 6, 60);
      cut(g, () => {
        line(g, 3, 179, 110, 221, 110);                                    // nose cone seam
        line(g, 3, 40, 186, 140, 191); line(g, 3, 260, 191, 360, 186);     // aileron hinges
        line(g, 3, 140, 186, 140, 200); line(g, 3, 260, 186, 260, 200);    // aileron / flap split
        line(g, 3, 150, 192, 178, 194); line(g, 3, 222, 194, 250, 192);    // flap hinges
        line(g, 3, 138, 336, 262, 336);                                    // elevator hinge
        for (const x of [122, 278]) line(g, 3, x - 12, 156, x + 12, 156);  // nacelle meets the wing
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
    let st = stamps(dpr);
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

    // Phones: on project pages, sit the shape beside the first two lines of the title
    // (measured, since titles wrap differently) instead of floating above it.
    const place = () => {
      const sec = cv.closest(".pg-hero"), h1 = sec && sec.querySelector("h1");
      if (!h1) return;
      if (innerWidth >= 760) { cv.style.top = cv.style.height = ""; return; }
      const lh = parseFloat(getComputedStyle(h1).lineHeight) || h1.getBoundingClientRect().height / 3;
      cv.style.top = Math.round(h1.getBoundingClientRect().top - sec.getBoundingClientRect().top) + "px";
      const tall = Math.min(h1.getBoundingClientRect().height, lh * 3);
      cv.style.height = Math.round(Math.max(lh * 2, tall)) + "px";
    };
    place();
    addEventListener("resize", place, { passive: true });
    if (document.fonts) document.fonts.ready.then(place);

    new ResizeObserver(() => {
      st = stamps(dpr * Math.max(0.45, Math.min(1, Math.min(cv.clientWidth, cv.clientHeight) / 320)));
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
