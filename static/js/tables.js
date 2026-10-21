/* Sortable and filterable tables (database, race pages, change list). */
(() => {
  "use strict";
  // sorting: click a header; numbers sort numerically (data-v), empty values last
  document.querySelectorAll("table.sortable").forEach(table => {
    const ths = [...table.tHead.rows[0].cells];
    ths.forEach((th, col) => {
      th.querySelector(".sort")?.addEventListener("click", () => {
        const dir = th.getAttribute("aria-sort") === "descending" ? "ascending" :
                    th.getAttribute("aria-sort") === "ascending" ? "descending" :
                    (th.classList.contains("n") ? "descending" : "ascending");
        ths.forEach(h => h.removeAttribute("aria-sort"));
        th.setAttribute("aria-sort", dir);
        const body = table.tBodies[0];
        const rows = [...body.rows];
        const key = r => { const c = r.cells[col]; return c ? (c.dataset.v ?? c.textContent).trim() : ""; };
        rows.sort((a, b) => {
          const x = key(a), y = key(b);
          if (x === "" && y !== "") return 1;
          if (y === "" && x !== "") return -1;
          const nx = parseFloat(x), ny = parseFloat(y);
          const c = (!isNaN(nx) && !isNaN(ny) && /^-?[\d.]+$/.test(x) && /^-?[\d.]+$/.test(y)) ? nx - ny : x.localeCompare(y, undefined, { numeric: true });
          return dir === "ascending" ? c : -c;
        });
        rows.forEach(r => body.appendChild(r));
      });
    });
  });

  // filters: chips (race / kind / new) + text, per .filters block targeting a container
  document.querySelectorAll(".filters").forEach(f => {
    const target = document.querySelector(f.dataset.target);
    if (!target) return;
    const rows = [...target.querySelectorAll("tbody tr")];
    const text = f.querySelector(".filter-text"), count = f.querySelector(".count");
    const state = { race: "", kind: "", mod: "" };
    const apply = () => {
      const t = (text?.value || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
      let n = 0;
      for (const r of rows) {
        const hay = (r.dataset.text || r.textContent).toLowerCase();
        const ok = (!state.race || r.dataset.race === state.race) && (!state.kind || r.dataset.kind === state.kind) &&
                   (!state.mod || r.dataset.mod === state.mod) && t.every(w => hay.includes(w));
        r.hidden = !ok;
        if (ok) n++;
      }
      if (count) count.textContent = `${n} of ${rows.length}`;
    };
    f.querySelectorAll(".chip").forEach(chip => chip.addEventListener("click", () => {
      const k = ["race", "kind", "mod"].find(k => k in chip.dataset);
      if (k === "mod") { state.mod = state.mod ? "" : "1"; chip.classList.toggle("on", !!state.mod); }
      else {
        state[k] = chip.dataset[k];
        f.querySelectorAll(`.chip[data-${k}]`).forEach(c => c.classList.toggle("on", c === chip));
      }
      apply();
    }));
    text?.addEventListener("input", apply);
    apply();
  });
})();
