// Smooth, interruptible scroll between linked skills and projects.
(() => {
  const hd = document.querySelector(".hd");
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  let raf = 0;

  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  ["wheel", "touchstart", "keydown"].forEach((e) => addEventListener(e, stop, { passive: true }));

  const flash = (el) => {
    el.classList.remove("flash");
    void el.offsetWidth;
    el.classList.add("flash");
  };

  // Where to put a target: centred in the space under the header when it fits,
  // otherwise its top a comfortable gap below the header (room for the highlight).
  const targetY = (el) => {
    const head = hd && getComputedStyle(hd).position === "sticky" ? hd.offsetHeight : 0;
    const r = el.getBoundingClientRect();
    const room = innerHeight - head;
    const gap = r.height < room * 0.85 ? (room - r.height) / 2 : Math.min(64, room * 0.08);
    return Math.max(0, Math.round(r.top + scrollY - head - gap));
  };

  const go = (el) => {
    const to = targetY(el);
    const from = scrollY;
    const dist = to - from;
    stop();
    const done = () => {
      el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
      if (el.matches(".proj, .skill")) flash(el);
    };
    if (still.matches || Math.abs(dist) < 2) { scrollTo(0, to); return done(); }
    const dur = Math.min(1100, 420 + Math.abs(dist) * 0.22);
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      const k = t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2; // ease-in-out quart
      scrollTo(0, from + dist * k);
      if (t < 1) raf = requestAnimationFrame(step);
      else { raf = 0; done(); }
    };
    raf = requestAnimationFrame(step);
  };

  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href*="#"]');
    if (!a) return;
    const url = new URL(a.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!el) return;
    e.preventDefault();
    go(el);
  });

  addEventListener("popstate", () => {
    const el = location.hash && document.getElementById(location.hash.slice(1));
    el ? go(el) : scrollTo({ top: 0 });
  });

  // Arriving from another page with a hash: land on it, highlight it, then drop the # from the address.
  if (location.hash) {
    const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    addEventListener("load", () => {
      if (el && !el.matches(".tools li")) scrollTo(0, targetY(el));
      if (el && el.matches(".proj, .skill")) flash(el);
      if (el && el.matches(".tools li")) el.classList.add("tool-flash");
      history.replaceState(null, "", location.pathname + location.search);
    }, { once: true });
  }

  // Hairline under the header once the page scrolls.
  if (hd) {
    const s = document.createElement("div");
    s.style.cssText = "position:absolute;top:0;height:1px;width:1px";
    document.body.prepend(s);
    new IntersectionObserver(([en]) => hd.classList.toggle("is-stuck", !en.isIntersecting)).observe(s);
  }

  // Scroll reveal. Elements entering together pop in one after another.
  const items = document.querySelectorAll(
    ".sec__head, .about > *, .proj, .xp li, .skill, .contact__big, .prose, .gallery > *, .next, .spec > div, .pg-media"
  );
  document.querySelectorAll(".tools, .used, .tags").forEach((ul) =>
    [...ul.children].forEach((li, i) => li.style.setProperty("--i", i))
  );
  const io = new IntersectionObserver(
    (entries) => {
      entries
        .filter((en) => en.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        .forEach((en, n) => {
          en.target.style.setProperty("--rd", n * 90 + "ms");
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );
  items.forEach((el) => io.observe(el));
})();
