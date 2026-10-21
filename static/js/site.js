/* Twisting Nether: menu, instant search (header dropdown + search page), table-of-contents highlight. */
(() => {
  "use strict";

  // ---------------- menu
  const toggle = document.querySelector(".menu-toggle"), nav = document.querySelector(".mainnav");
  toggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });

  // ---------------- search engine (shared with the search page)
  const KIND_W = { "Unit": 12, "Structure": 9, "Race": 10, "Ability": 8, "Research": 8, "Feature": 6, "Patch notes": 5,
                   "Balance": 4, "Lore": 3, "Doc": 1, "Page": 0 };
  let DATA = null, loading = null;
  const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  function load() {
    if (DATA) return Promise.resolve(DATA);
    if (!loading) loading = fetch("/static/data/search.json").then(r => r.json()).then(d => {
      for (const e of d) { e.tl = norm(e.t); }
      return (DATA = d);
    });
    return loading;
  }
  function terms(q) { return norm(q).split(/[^a-z0-9@_]+/).filter(Boolean); }
  function search(q, limit = 12) {
    const ts = terms(q);
    if (!ts.length || !DATA) return [];
    const res = [];
    const phrase = ts.join(" ");
    for (const e of DATA) {
      let score = 0, ok = true;
      for (const t of ts) {
        const ti = e.tl.indexOf(t), xi = e.x.indexOf(t);
        if (ti < 0 && xi < 0) { ok = false; break; }
        if (ti === 0) score += 40;
        else if (ti > 0) score += /[^a-z0-9]/.test(e.tl[ti - 1]) ? 28 : 12;
        if (xi >= 0) {
          score += 3;
          if (xi === 0 || /[^a-z0-9]/.test(e.x[xi - 1])) score += 4;
          let n = 0, i = xi;
          while (i >= 0 && n < 6) { n++; i = e.x.indexOf(t, i + t.length); }
          score += n;
        }
      }
      if (!ok) continue;
      if (e.tl === phrase) score += 80;
      else if (e.tl.startsWith(phrase)) score += 30;
      else if (e.x.includes(phrase)) score += 10;
      score += KIND_W[e.k] || 0;
      score -= e.t.length * .04;
      res.push([score, e]);
    }
    res.sort((a, b) => b[0] - a[0]);
    return res.slice(0, limit).map(r => r[1]);
  }
  const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function mark(text, ts) {
    let h = esc(text);
    for (const t of ts.sort((a, b) => b.length - a.length)) {
      if (t.length < 2) continue;
      h = h.replace(new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"), "\u0001$1\u0002");
    }
    return h.replace(/\u0001/g, "<mark>").replace(/\u0002/g, "</mark>");
  }
  function item(e, ts, cls = "sr-item") {
    return `<a class="${cls}" href="${e.u}" role="option"><span class="sr-title"><span class="sr-t">${mark(e.t, ts.slice())}</span><span class="sr-kind">${esc(e.k)}</span></span>` +
           (e.s ? `<span class="sr-snip">${mark(e.s.slice(0, 220), ts.slice())}</span>` : "") + "</a>";
  }
  window.TNSearch = { load, search, item, terms };

  // ---------------- header dropdown
  const q = document.getElementById("q"), box = document.getElementById("search-results");
  if (q && box) {
    let sel = -1;
    const render = () => {
      const v = q.value.trim();
      if (!v) { box.hidden = true; return; }
      load().then(() => {
        const hits = search(v, 14), ts = terms(v);
        sel = -1;
        box.innerHTML = hits.length
          ? hits.map(h => item(h, ts)).join("") + `<a class="sr-all" href="/search.html?q=${encodeURIComponent(v)}">All results for “${esc(v)}”</a>`
          : `<div class="sr-empty">Nothing found for “${esc(v)}”.</div>`;
        box.hidden = false;
      });
    };
    q.addEventListener("input", render);
    q.addEventListener("focus", () => { load(); if (q.value.trim()) render(); });
    q.addEventListener("keydown", ev => {
      const items = [...box.querySelectorAll(".sr-item")];
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
        ev.preventDefault();
        if (!items.length) return;
        sel = (sel + (ev.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        items.forEach((it, i) => it.classList.toggle("sel", i === sel));
        items[sel].scrollIntoView({ block: "nearest" });
      } else if (ev.key === "Enter") {
        ev.preventDefault();
        const target = items[sel >= 0 ? sel : 0];
        if (target) location.href = target.href;
        else if (q.value.trim()) location.href = "/search.html?q=" + encodeURIComponent(q.value.trim());
      } else if (ev.key === "Escape") { box.hidden = true; q.blur(); }
    });
    document.addEventListener("click", ev => { if (!ev.target.closest(".search")) box.hidden = true; });
    document.addEventListener("keydown", ev => {
      if (ev.key === "/" && !/^(input|textarea|select)$/i.test(document.activeElement.tagName)) { ev.preventDefault(); q.focus(); q.select(); }
    });
  }

  // ---------------- in-game clips: load and play only while on screen (saves bandwidth and CPU)
  const vids = document.querySelectorAll("video[data-src]");
  if (vids.length) {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const vio = new IntersectionObserver(es => es.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) {
        if (!v.src) { v.src = v.dataset.src; }
        if (!reduce) { v.play().catch(() => {}); }
      } else if (!v.paused) { v.pause(); }
    }), { rootMargin: "200px 0px" });
    vids.forEach(v => vio.observe(v));
  }

  // ---------------- table of contents: highlight the section in view
  const toc = document.querySelectorAll(".toc a[href^='#']");
  if (toc.length) {
    const map = new Map();
    toc.forEach(a => { const el = document.getElementById(decodeURIComponent(a.hash.slice(1))); if (el) map.set(el, a); });
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) { toc.forEach(a => a.classList.remove("on")); map.get(e.target)?.classList.add("on"); }
      });
    }, { rootMargin: "-80px 0px -70% 0px" });
    map.forEach((_, el) => io.observe(el));
  }

  // ---------------- feedback window (sent through Web3Forms to the team inbox)
  const fb = document.getElementById("feedback");
  if (fb && fb.showModal) {
    const form = fb.querySelector("form"), status = fb.querySelector(".fb-status"), send = form.querySelector("[type=submit]");
    const say = (msg, cls = "") => { status.textContent = msg; status.className = "fb-status " + cls; };
    document.querySelectorAll(".fb-open").forEach(b => b.addEventListener("click", ev => {
      ev.preventDefault();
      if (!fb.open) { say(""); fb.showModal(); form.message.focus(); }
    }));
    fb.querySelectorAll(".fb-x, .fb-cancel").forEach(b => b.addEventListener("click", () => fb.close()));
    fb.addEventListener("click", ev => { if (ev.target === fb) fb.close(); });  // click on the backdrop
    if (location.hash === "#feedback") fb.showModal();
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const msg = form.message.value.trim();
      if (msg.length < 3) { say("Please write a message first.", "err"); form.message.focus(); return; }
      if (form.email.value && !form.email.checkValidity()) { say("That email address doesn't look right.", "err"); form.email.focus(); return; }
      send.disabled = true; say("Sending…");
      const name = form.name.value.trim();
      const body = { access_key: form.dataset.key, subject: "Twisting Nether feedback" + (name ? " from " + name : ""),
                     from_name: "Twisting Nether website", name: name || "Anonymous", email: form.email.value.trim() || undefined,
                     message: msg, page: location.href, botcheck: form.botcheck.checked };
      try {
        const r = await fetch("https://api.web3forms.com/submit", { method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(body) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok || !d.success) throw new Error(d.message || r.status);
        form.reset(); say("Thanks! Your feedback was sent.", "ok");
        setTimeout(() => { if (status.classList.contains("ok")) fb.close(); }, 2500);
      } catch (e) {
        say("Sending failed. Please try again later, or reach us on Discord.", "err");
      } finally { send.disabled = false; }
    });
  }
})();
