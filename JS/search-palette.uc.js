// ==UserScript==
// @name          Search Palette (Fixed)
// @description   Alt+Q to open a command palette
// ==/UserScript==

(() => {
    const STYLE_ID = "cp-gnome-style";
    const ROOT_ID = "cp-root";
    const PANEL_ID = "cp-panel";

    function ensureStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const css = `
:root{
  --cp-radius:12px;
  --cp-font:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,Cantarell,"Noto Sans",Arial,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol";
  --cp-shadow:0 12px 30px rgba(0,0,0,.35);
  --cp-transition:130ms cubic-bezier(.2,.8,.2,1);
  --cp-font-size:18px;
  --cp-padding:14px 18px;
  --cp-ring: var(--cp-border);
}
@media (prefers-color-scheme: light){
  :root{
    --cp-overlay:linear-gradient(180deg, rgba(0,0,0,.12) 0%, rgba(0,0,0,.08) 100%);
    --cp-panel:#ffffff;
    --cp-border:#d8d8d8;
    --cp-text:#1d1d1d;
    --cp-muted:#6b7280;
    --cp-accent:#3584e4;
  }
}
@media (prefers-color-scheme: dark){
  :root{
    --cp-overlay:linear-gradient(180deg, rgba(0,0,0,.45) 0%, rgba(0,0,0,.35) 100%);
    --cp-panel:#242424;
    --cp-border:#3a3a3a;
    --cp-text:#eaeaea;
    --cp-muted:#a3a3a3;
    --cp-accent:#62a0ea;
  }
}
#${ROOT_ID}{
  position:fixed; inset:0; z-index:2147483647;
  display:grid; place-items:start center;
  padding-top:18vh;
  background:var(--cp-overlay);
  animation:cp-fade-in var(--cp-transition) both;
}
@keyframes cp-fade-in{from{opacity:0} to{opacity:1}}
@keyframes cp-scale-in{from{transform:scale(.98);opacity:0} to{transform:scale(1);opacity:1}}
#${PANEL_ID}{
  min-width:min(720px,92vw);
  border-radius:var(--cp-radius);
  background:var(--cp-panel);
  border:1.5px solid var(--cp-border);
  box-shadow:var(--cp-shadow);
  padding:var(--cp-padding);
  font: var(--cp-font-size) var(--cp-font);
  color:var(--cp-text);
  caret-color:var(--cp-accent);
  outline:none;
  animation:cp-scale-in var(--cp-transition) both;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  transition:border-color var(--cp-transition);
}
#${PANEL_ID}:focus-visible{ border-color:var(--cp-ring); }
#${PANEL_ID}[contenteditable="true"][data-placeholder]:empty::before{
  content: attr(data-placeholder);
  color:var(--cp-muted);
}`;
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = css;
        document.head.appendChild(style);
    }

    function removeExisting() {
        const old = document.getElementById(ROOT_ID);
        if (old) old.remove();
    }

    function tryOpen(url) {
        try {
            if (typeof openTrustedLinkIn === "function") openTrustedLinkIn(url, "tab");
            else window.open(url, "_blank", "noopener");
        } catch {
            window.open(url, "_blank", "noopener");
        }
    }

    // ---------- helpers ----------
    const QUICK = new Map(Object.entries({
        "youtube": "https://youtube.com",
        "yt": "https://youtube.com",
        "github": "https://github.com",
        "gitlab": "https://gitlab.com",
        "reddit": "https://reddit.com",
        "wiki": "https://wikipedia.org",
        "wikipedia": "https://wikipedia.org",
        "stackoverflow": "https://stackoverflow.com",
        "hn": "https://news.ycombinator.com",
        "x": "https://x.com",
        "twitter": "https://x.com",
        "gmail": "https://mail.google.com",
        "maps": "https://maps.google.com",
        "docs": "https://docs.google.com",
        "drive": "https://drive.google.com",
        "translate": "https://translate.google.com"
    }));

    const DOMAIN_ONLY = /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?$/i;
    const URL_LIKE = /^(?:https?:\/\/|about:|file:\/\/|moz-extension:|chrome:)/i;

    // ---- simple frequency store (for autocomplete) ----
    const FREQ_KEY = "cp-freq-v1";
    function loadFreq() {
        try { return JSON.parse(localStorage.getItem(FREQ_KEY)) || {}; }
        catch { return {}; }
    }
    function saveFreq(freq) { try { localStorage.setItem(FREQ_KEY, JSON.stringify(freq)); } catch { } }
    function hostFromUrl(url) {
        try { return new URL(/^https?:/i.test(url) ? url : "https://" + url).host.replace(/^www\./i, ""); }
        catch { return url; }
    }
    function labelFromUrl(url) {
        const h = hostFromUrl(url);
        const parts = h.split(".");
        return parts.length > 2 ? parts[parts.length - 2] : parts[0];
    }
    function bumpFreq(label, url) {
        const freq = loadFreq();
        const key = (label || labelFromUrl(url || "") || "").toLowerCase();
        if (!key) return;
        freq[key] = (freq[key] || 0) + 1;
        saveFreq(freq);
    }

    function parseEngineAndQuery(raw) {
        let text = raw.trim();
        if (text.startsWith("g ")) return { engine: "google", query: text.slice(2).trim() };
        if (text.startsWith("!g ")) return { engine: "google", query: text.slice(3).trim() };
        return { engine: "ddg", query: text };
    }

    function openSearchResults(q, engine) {
        if (engine === "google") tryOpen("https://www.google.com/search?q=" + encodeURIComponent(q));
        else tryOpen("https://duckduckgo.com/?q=" + encodeURIComponent(q));
    }

    function openLucky(q) {
        const key = q.toLowerCase().trim();
        if (QUICK.has(key)) { bumpFreq(key, QUICK.get(key)); return tryOpen(QUICK.get(key)); }
        if (URL_LIKE.test(q)) { bumpFreq(labelFromUrl(q), q); return tryOpen(q); }
        if (DOMAIN_ONLY.test(q)) {
            const u = /^https?:\/\//i.test(q) ? q : "https://" + q;
            bumpFreq(labelFromUrl(u), u);
            return tryOpen(u);
        }
        const ducky = "https://duckduckgo.com/?q=!ducky+" + encodeURIComponent(q);
        bumpFreq(key, ducky);
        return tryOpen(ducky);
    }

    function openBestFor(raw, opts = { forceLucky: false, forceSearch: false }) {
        const { engine, query } = parseEngineAndQuery(raw);
        if (!query) return;

        if (URL_LIKE.test(query) || DOMAIN_ONLY.test(query)) {
            const u = URL_LIKE.test(query) ? query : ("https://" + query);
            bumpFreq(labelFromUrl(u), u);
            return tryOpen(u);
        }

        if (opts.forceLucky) return openLucky(query);

        if (opts.forceSearch || /\s/.test(query)) {
            return openSearchResults(query, engine);
        }

        return openLucky(query);
    }

    // ===== Selection / caret helpers =====
    function getSelectionOffsets(el) {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return [0, 0];
        const range = sel.getRangeAt(0);
        if (!el.contains(range.startContainer) || !el.contains(range.endContainer)) return [0, 0];

        const preStart = document.createRange();
        preStart.selectNodeContents(el);
        preStart.setEnd(range.startContainer, range.startOffset);
        const start = preStart.toString().length;

        const preEnd = document.createRange();
        preEnd.selectNodeContents(el);
        preEnd.setEnd(range.endContainer, range.endOffset);
        const end = preEnd.toString().length;

        return [start, end];
    }
    function setCaretOffset(el, offset) {
        const range = document.createRange();
        const sel = window.getSelection();
        let pos = 0;
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
        let node;
        while ((node = walker.nextNode())) {
            const next = pos + node.nodeValue.length;
            if (offset <= next) {
                range.setStart(node, Math.max(0, offset - pos));
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
                return;
            }
            pos = next;
        }
        range.selectNodeContents(el);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    }
    function replaceRange(el, start, end, replacement) {
        const text = el.textContent;
        el.textContent = text.slice(0, start) + replacement + text.slice(end);
        setCaretOffset(el, start + replacement.length);
    }
    function deletePrevChar(el) {
        let [start, end] = getSelectionOffsets(el);
        if (start !== end) { replaceRange(el, start, end, ""); return; }
        if (start === 0) return;
        replaceRange(el, start - 1, start, "");
    }
    function deleteNextChar(el) {
        let [start, end] = getSelectionOffsets(el);
        const len = el.textContent.length;
        if (start !== end) { replaceRange(el, start, end, ""); return; }
        if (start >= len) return;
        replaceRange(el, start, start + 1, "");
    }
    function getCaretOffset(el) { return getSelectionOffsets(el)[0]; }
    function deletePrevWord(el) {
        const text = el.textContent;
        let i = getCaretOffset(el);
        if (i === 0) return;
        while (i > 0 && /\s/.test(text[i - 1])) i--;
        while (i > 0 && !/\s/.test(text[i - 1])) i--;
        const caret = getCaretOffset(el);
        replaceRange(el, i, caret, "");
    }
    function deleteNextWord(el) {
        const text = el.textContent;
        let i = getCaretOffset(el);
        let j = i;
        while (j < text.length && /\s/.test(text[j])) j++;
        while (j < text.length && !/\s/.test(text[j])) j++;
        replaceRange(el, i, j, "");
    }

    // ===== Tab autocompletion =====
    function candidates() {
        const freq = loadFreq();
        const list = [];
        for (const [label, count] of Object.entries(freq)) {
            list.push({ label, score: 1000 + count });
        }
        for (const key of QUICK.keys()) {
            if (!list.find(x => x.label === key)) list.push({ label: key, score: 500 });
        }
        for (const url of QUICK.values()) {
            const host = hostFromUrl(url);
            if (!list.find(x => x.label === host)) list.push({ label: host, score: 450 });
            const bare = labelFromUrl(url);
            if (!list.find(x => x.label === bare)) list.push({ label: bare, score: 440 });
        }
        return list;
    }

    function findCompletion(prefix) {
        const p = prefix.trim().toLowerCase();
        if (!p) return "";
        const list = candidates()
            .filter(c => c.label.toLowerCase().startsWith(p))
            .sort((a, b) => (b.score - a.score) || (a.label.length - b.label.length) || a.label.localeCompare(b.label));
        return list[0]?.label || "";
    }

    function applyCompletion(el) {
        const cur = el.textContent.trim();
        const comp = findCompletion(cur);
        if (comp && comp !== cur) {
            el.textContent = comp;
            setCaretOffset(el, comp.length);
        }
    }

    function createPalette() {
        removeExisting();
        ensureStyle();

        const root = document.createElement("div");
        root.id = ROOT_ID;
        root.setAttribute("role", "dialog");
        root.setAttribute("aria-modal", "true");
        root.addEventListener("click", e => { if (e.target === root) root.remove(); });

        const panel = document.createElement("div");
        panel.id = PANEL_ID;
        panel.setAttribute("contenteditable", "true");
        panel.setAttribute("data-placeholder", "Search anything...");
        panel.setAttribute("role", "textbox");
        panel.setAttribute("aria-label", "Search");
        panel.setAttribute("aria-multiline", "false");
        panel.setAttribute("inputmode", "search");
        panel.spellcheck = false;

        panel.addEventListener("keydown", (e) => {
            e.stopPropagation();

            if (e.key === "Enter") {
                e.preventDefault();
                const q = panel.textContent.trim();
                if (!q) { root.remove(); return; }

                const { query } = parseEngineAndQuery(q);

                if (e.shiftKey) {
                    openSearchResults(query, "google");
                } else if (e.ctrlKey || e.metaKey) {
                    openLucky(query);
                } else if (e.altKey) {
                    openSearchResults(query, "ddg");
                } else {
                    openBestFor(q);
                }

                root.remove();
                return;
            }

            if (e.key === "Escape") { e.preventDefault(); root.remove(); return; }

            if (e.key === "Tab") {
                e.preventDefault();
                applyCompletion(panel);
                return;
            }

            if (e.key === "Backspace" && !e.ctrlKey && !e.altKey && !e.metaKey) { e.preventDefault(); deletePrevChar(panel); return; }
            if (e.key === "Delete" && !e.ctrlKey && !e.altKey && !e.metaKey) { e.preventDefault(); deleteNextChar(panel); return; }
            if (e.key === "Backspace" && (e.ctrlKey || e.altKey)) { e.preventDefault(); deletePrevWord(panel); return; }
            if (e.key === "Delete" && (e.ctrlKey || e.altKey)) { e.preventDefault(); deleteNextWord(panel); return; }
        });

        ["keyup", "keypress"].forEach(type => panel.addEventListener(type, e => e.stopPropagation()));

        panel.addEventListener("paste", e => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData("text/plain");
            document.execCommand("insertText", false, text);
        });

        root.addEventListener("keydown", e => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "w") {
                e.preventDefault(); e.stopPropagation(); root.remove();
            }
        });

        root.appendChild(panel);
        document.documentElement.appendChild(root);

        panel.focus();
        setCaretOffset(panel, panel.textContent.length);
    }

    // Global hotkey: Alt+Q
    window.addEventListener("keydown", e => {
        if (document.getElementById(ROOT_ID)) return;
        if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "q") {
            e.preventDefault();
            createPalette();
        }
    }, { capture: true });

})();
