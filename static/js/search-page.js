/* search.html: full result list for ?q= */
(() => {
  "use strict";
  const input = document.getElementById("q2"), out = document.getElementById("search-page-results");
  if (!input || !out) return;
  const run = () => {
    const S = window.TNSearch;
    if (!S) return setTimeout(run, 50);
    const v = input.value.trim();
    history.replaceState(null, "", v ? "?q=" + encodeURIComponent(v) : location.pathname);
    if (!v) { out.innerHTML = ""; return; }
    S.load().then(() => {
      const hits = S.search(v, 150), ts = S.terms(v);
      out.innerHTML = `<p class="note">${hits.length}${hits.length === 150 ? "+" : ""} results</p>` +
        (hits.length ? hits.map(h => S.item(h, ts)).join("") : `<div class="sr-empty">Nothing found.</div>`);
    });
  };
  input.value = new URLSearchParams(location.search).get("q") || "";
  input.addEventListener("input", run);
  input.focus();
  run();
})();
