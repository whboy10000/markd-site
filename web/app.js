/* Markd product site — interactions. All rendered text goes through text nodes. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------------------------------------------------------- language */
  var LANG_KEY = "markd-lang";
  var langListeners = [];

  function currentLang() { return root.getAttribute("data-lang") === "en" ? "en" : "zh"; }
  function t(zh, en) { return currentLang() === "en" ? en : zh; }

  function setLang(lang) {
    root.setAttribute("data-lang", lang);
    root.setAttribute("lang", lang === "en" ? "en" : "zh-Hans");
    document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.langBtn === lang));
    });
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    langListeners.forEach(function (fn) { fn(lang); });
  }

  document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
    btn.addEventListener("click", function () { setLang(btn.dataset.langBtn); });
  });

  var stored = null;
  try { stored = localStorage.getItem(LANG_KEY); } catch (e) {}
  var fromUrl = new URLSearchParams(location.search).get("lang");
  if (fromUrl === "en" || fromUrl === "zh") stored = fromUrl;
  if (stored !== "en" && stored !== "zh") stored = root.getAttribute("data-lang") === "en" ? "en" : "zh";
  setLang(stored);

  /* ---------------------------------------------------------- mobile nav */
  var menuBtn = document.getElementById("menu-btn");
  var nav = document.getElementById("primary-nav");
  if (menuBtn && nav) {
    function setMenu(open) {
      if (open) nav.setAttribute("data-open", "true");
      else nav.removeAttribute("data-open");
      menuBtn.setAttribute("aria-expanded", String(open));
    }
    menuBtn.addEventListener("click", function () {
      setMenu(nav.getAttribute("data-open") !== "true");
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  /* ---------------------------------------------------------- header shadow */
  var head = document.querySelector(".site-head");
  function onScroll() {
    if (head) head.setAttribute("data-scrolled", String(window.scrollY > 12));
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------------------------------------------------------- nav highlight */
  var navLinks = {};
  document.querySelectorAll(".primary-nav a").forEach(function (a) {
    var id = (a.getAttribute("href") || "").slice(1);
    if (id) navLinks[id] = a;
  });
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var link = navLinks[en.target.id];
        if (!link || !en.isIntersecting) return;
        Object.keys(navLinks).forEach(function (k) { navLinks[k].removeAttribute("aria-current"); });
        link.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(navLinks).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* ---------------------------------------------------------- reveal + counters */
  var candidates = document.querySelectorAll(
    ".section-head, .card, .perf, .side-item, .stats li, .layer, .keys li, .pipeline li, " +
    ".table-wrap, .bars, .demo, .glyph-plate, .diagram-block, .dl-panels, .dl-build, .hero-frame-wrap"
  );
  Array.prototype.forEach.call(candidates, function (el) { el.setAttribute("data-reveal", ""); });

  function statTarget(node) {
    var en = currentLang() === "en";
    return {
      target: Number(en && node.dataset.countEn ? node.dataset.countEn : node.dataset.count),
      prefix: node.dataset.prefix || "",
      suffix: (en && node.dataset.suffixEn ? node.dataset.suffixEn : node.dataset.suffix) || "",
      raw: node.dataset.raw || node.textContent
    };
  }
  function setStat(node, value) {
    var s = statTarget(node);
    node.textContent = s.prefix + value + s.suffix;
  }
  function animateCount(node) {
    var s = statTarget(node);
    if (!s.target) { node.textContent = s.raw; return; }
    if (reduceMotion.matches) { setStat(node, s.target); return; }
    var dur = 900;
    var start = performance.now();
    function step(now) {
      var p = Math.min(1, (now - start) / dur);
      setStat(node, Math.round(s.target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function settleStats() {
    document.querySelectorAll(".stat-num").forEach(function (node) {
      var host = node.closest("[data-reveal]");
      if (!host || !host.classList.contains("is-in")) return;
      var s = statTarget(node);
      if (s.target) setStat(node, s.target); else node.textContent = s.raw;
    });
  }

  var revealed = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
        en.target.querySelectorAll(".stat-num").forEach(animateCount);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    revealed.forEach(function (el) { io.observe(el); });
  } else {
    revealed.forEach(function (el) { el.classList.add("is-in"); });
    document.querySelectorAll(".stat-num").forEach(animateCount);
  }
  langListeners.push(settleStats);

  /* ---------------------------------------------------------- hero screenshot */
  var shots = { dark: "assets/app-dark.png", light: "assets/app-light.png" };
  var shotImg = document.getElementById("hero-shot");
  var shotBtns = document.querySelectorAll("[data-shot]");
  shotBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.dataset.shot;
      if (shotImg) {
        shotImg.src = shots[key];
        shotImg.alt = t(
          "Markd " + (key === "dark" ? "深色" : "浅色") + "主题界面：左侧文件树与大纲，中间富文本 Markdown 文档，下方终端面板",
          "Markd in the " + key + " theme: file tree and outline at left, rich Markdown in the middle, terminal panel below"
        );
      }
      shotBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
    });
  });

  /* ---------------------------------------------------------- tab groups */
  function wireTabs(tabSel, panelSel, key) {
    var tabs = document.querySelectorAll(tabSel);
    var panels = document.querySelectorAll(panelSel);
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (other) {
          if (other.getAttribute("role") === "tab") other.setAttribute("aria-selected", String(other === tab));
        });
        panels.forEach(function (panel) {
          panel.classList.toggle("active", panel.dataset[key] === tab.dataset[key]);
        });
      });
    });
  }
  wireTabs("[data-diagram]", "figure[data-diagram]", "diagram");
  wireTabs(".dl-tabs [data-os]", ".dl-panel[data-os]", "os");

  /* ---------------------------------------------------------- Hybrid View demo */
  var DOCS = {
    zh: [
      "# Hybrid View",
      "> 当前块显示源码，其余块实时渲染。",
      "点任意段落即进入编辑态 —— **星号、缩进、空行**全部可见，可精确到单个字符；失焦后立刻回到 ==富文本==，源文件里 `==` 与 `~~` 的顺序不会被改写。",
      "- [x] 每帧只克隆**活动块**源码，其余块只读排版\n- [ ] 估算高度的虚拟滚动 —— 已放弃，改用全量渲染\n- [x] 粘贴空行拆分多块时才回退一次全文解析",
      "| 路径 | 实测成本 |\n| --- | --- |\n| 打开文档 | ~11 ms，仅一次 |\n| 单块编辑 | ~3 µs |",
      "```rust\nmatch focus {\n    Some(id) => editor.show_source(id),  // 增量解析当前块\n    None => editor.render_all(),         // 只读排版，不克隆\n}\n```",
      "$$\\int_{0}^{\\infty} e^{-x^{2}}\\,dx = \\frac{\\sqrt{\\pi}}{2}$$"
    ],
    en: [
      "# Hybrid View",
      "> The active block shows source; every other block renders live.",
      "Click any paragraph to edit raw Markdown — **asterisks, indentation, blank lines** stay visible, editable down to a single character. Blur and it is rich text again; the order of `==` and `~~` in your file is never rewritten.",
      "- [x] Only the **active block** is cloned each frame; the rest lay out read-only\n- [ ] Estimated-height virtual scrolling — dropped in favour of full rendering\n- [x] A full reparse runs only when a pasted blank line splits a block",
      "| Path | Measured |\n| --- | --- |\n| Open document | ~11 ms, once |\n| Edit one block | ~3 µs |",
      "```rust\nmatch focus {\n    Some(id) => editor.show_source(id),  // reparse the active block\n    None => editor.render_all(),         // read-only layout, no clone\n}\n```",
      "$$\\int_{0}^{\\infty} e^{-x^{2}}\\,dx = \\frac{\\sqrt{\\pi}}{2}$$"
    ]
  };

  var demoBody = document.getElementById("demo-body");
  var stateEl = document.getElementById("demo-state");
  var doc = DOCS[currentLang()].slice();

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function setState(text) { if (stateEl) stateEl.textContent = text; }

  var SYMBOLS = {
    int: "∫", iint: "∬", oint: "∮", infty: "∞", pi: "π", cdot: "·", times: "×",
    sum: "∑", prod: "∏", sqrt: "√", le: "≤", ge: "≥", ne: "≠", approx: "≈",
    alpha: "α", beta: "β", gamma: "γ", delta: "δ", lambda: "λ", mu: "μ", sigma: "σ",
    omega: "ω", theta: "θ", partial: "∂", nabla: "∇", to: "→", rightarrow: "→",
    in: "∈", forall: "∀", exists: "∃", pm: "±", mp: "∓", ldots: "…", quad: " "
  };

  /* matched-brace reader: returns the group body and the index after it */
  function readGroup(s, i) {
    if (s[i] !== "{") {
      if (i < s.length && s[i] === "\\") {
        var m = /^\\([a-zA-Z]+|.)/.exec(s.slice(i));
        return { text: m ? m[0] : s[i], next: i + (m ? m[0].length : 1) };
      }
      return { text: i < s.length ? s[i] : "", next: i + 1 };
    }
    var depth = 0;
    for (var j = i; j < s.length; j++) {
      if (s[j] === "{") depth++;
      else if (s[j] === "}") { depth--; if (depth === 0) return { text: s.slice(i + 1, j), next: j + 1 }; }
    }
    return { text: s.slice(i + 1), next: s.length };
  }

  /* small LaTeX subset — an approximation, never claimed as the app's output */
  function texInto(target, src) {
    var i = 0;
    while (i < src.length) {
      var ch = src[i];
      if (ch === "_" || ch === "^") {
        var arg = readGroup(src, i + 1);
        var tag = node(ch === "_" ? "sub" : "sup");
        texInto(tag, arg.text);
        target.appendChild(tag);
        i = arg.next;
      } else if (ch === "\\") {
        var m = /^\\([a-zA-Z]+|.)/.exec(src.slice(i));
        var name = m ? m[1] : "";
        if (name === "frac") {
          var a = readGroup(src, i + m[0].length);
          var b = readGroup(src, a.next);
          target.appendChild(document.createTextNode("("));
          texInto(target, a.text);
          target.appendChild(document.createTextNode(")/("));
          texInto(target, b.text);
          target.appendChild(document.createTextNode(")"));
          i = b.next;
        } else if (name === "text" || name === "mathrm" || name === "operatorname") {
          var plain = readGroup(src, i + m[0].length);
          target.appendChild(document.createTextNode(plain.text));
          i = plain.next;
        } else {
          target.appendChild(document.createTextNode(SYMBOLS[name] !== undefined ? SYMBOLS[name] : (name === "," ? " " : name)));
          i += m ? m[0].length : 1;
        }
      } else if (ch === "{") {
        var grp = readGroup(src, i);
        texInto(target, grp.text);
        i = grp.next;
      } else if (ch === "}") {
        i++;
      } else {
        var j = i;
        while (j < src.length && "_^{\\".indexOf(src[j]) === -1) j++;
        target.appendChild(document.createTextNode(src.slice(i, j)));
        i = j;
      }
    }
  }

  function tex(src) {
    var frag = document.createDocumentFragment();
    texInto(frag, src);
    return frag;
  }

  var INLINE =
    /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(~~([^~]+)~~)|(==([^=]+)==)|(\$([^$]+)\$)|(\[([^\]]+)\]\(([^)\s]*)\))/;

  function inline(text) {
    var frag = document.createDocumentFragment();
    var rest = String(text);
    var m;
    while ((m = rest.match(INLINE))) {
      if (m.index > 0) frag.appendChild(document.createTextNode(rest.slice(0, m.index)));
      var made;
      if (m[1] != null) made = node("strong", "i-b", m[2]);
      else if (m[3] != null) made = node("em", "i-i", m[4]);
      else if (m[5] != null) made = node("code", "i-code", m[6]);
      else if (m[7] != null) made = node("span", "i-strike", m[8]);
      else if (m[9] != null) made = node("span", "i-hl", m[10]);
      else if (m[11] != null) { made = node("span", "i-math"); texInto(made, m[12]); }
      else {
        made = node("a", "i-link", m[14]);
        made.setAttribute("rel", "noopener noreferrer");
        var url = m[15] || "";
        if (/^(https?:\/\/|mailto:|#|\/|\.)/i.test(url)) made.setAttribute("href", url);
      }
      frag.appendChild(made);
      rest = rest.slice(m.index + m[0].length);
    }
    if (rest) frag.appendChild(document.createTextNode(rest));
    return frag;
  }

  function highlight(code) {
    var frag = document.createDocumentFragment();
    var re = /(\/\/[^\n]*)|(\b(?:match|fn|let|mut|struct|impl|enum|for|return|use|pub|if|else|Some|None)\b)|(\[[^\]]*\])|("#[^"\n]*")|("(?:[^"\\\n]|\\.)*")|(\b\d[\dxX_.]*\b)/;
    var rest = code;
    var m;
    while ((m = rest.match(re))) {
      if (m.index > 0) frag.appendChild(document.createTextNode(rest.slice(0, m.index)));
      var cls = m[1] ? "c" : m[2] ? "k" : m[3] ? "t" : m[4] ? "k" : m[5] ? "t" : "t";
      frag.appendChild(node("span", cls, m[0]));
      rest = rest.slice(m.index + m[0].length);
    }
    if (rest) frag.appendChild(document.createTextNode(rest));
    return frag;
  }

  function contentFor(src) {
    var lines = src.split("\n").filter(function (l) { return l.trim() !== ""; });
    var first = lines.length ? lines[0] : "";
    var box = node("div", "r-body");

    if (/^```/.test(first)) {
      var pre = node("pre", "r-code");
      pre.appendChild(highlight(src.replace(/^```[^\n]*\n?/, "").replace(/\n?\s*```\s*$/, "")));
      box.appendChild(pre);
      return { cls: "is-code", box: box };
    }
    if (/^\$\$/.test(src.trim())) {
      var math = node("div", "r-mathblock");
      texInto(math, src.trim().replace(/^\$\$/, "").replace(/\$\$$/, "").trim());
      box.appendChild(math);
      return { cls: "is-math", box: box };
    }
    if (/^\|/.test(first)) {
      var table = node("table", "r-table");
      var thead = node("thead");
      var hrow = node("tr");
      lines[0].split("|").filter(function (c) { return c.trim() !== ""; })
        .forEach(function (c) { hrow.appendChild(node("th", null, c.trim())); });
      thead.appendChild(hrow);
      table.appendChild(thead);
      var tbody = node("tbody");
      lines.slice(2).forEach(function (line) {
        var tr = node("tr");
        line.split("|").filter(function (c) { return c.trim() !== ""; })
          .forEach(function (c) { tr.appendChild(node("td", null, c.trim())); });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      box.appendChild(table);
      return { cls: "is-table", box: box };
    }
    if (/^>\s?/.test(first)) {
      var quote = node("blockquote", "r-quote");
      lines.forEach(function (line) {
        var p = node("p");
        p.appendChild(inline(line.replace(/^>\s?/, "")));
        quote.appendChild(p);
      });
      box.appendChild(quote);
      return { cls: "is-quote", box: box };
    }
    if (/^#{1,6}\s/.test(first)) {
      var level = (first.match(/^#+/) || ["#"])[0].length;
      lines.forEach(function (line) {
        var h = node("div");
        h.appendChild(inline(line.replace(/^#{1,6}\s/, "")));
        box.appendChild(h);
      });
      return { cls: "is-h" + Math.min(3, level), box: box };
    }
    if (/^([-*]|\d+\.)\s/.test(first)) {
      var list = node("ul", "r-list" + (/^\d+\./.test(first) ? " ord" : ""));
      lines.forEach(function (line) {
        var task = line.match(/^[-*]\s+\[([ xX])\]\s+(.*)$/);
        var li = node("li");
        if (task) {
          li.className = "task";
          var checkbox = node("span", "r-task");
          if (task[1] !== " ") checkbox.setAttribute("data-done", "");
          li.appendChild(checkbox);
          var span = node("span");
          span.appendChild(inline(task[2]));
          li.appendChild(span);
        } else {
          li.appendChild(inline(line.replace(/^([-*]|\d+\.)\s+/, "")));
        }
        list.appendChild(li);
      });
      box.appendChild(list);
      return { cls: "is-list", box: box };
    }
    lines.forEach(function (line) {
      var p = node("p");
      p.appendChild(inline(line));
      box.appendChild(p);
    });
    return { cls: "is-p", box: box };
  }

  function buildBlock(index) {
    var wrap = node("div", "blk");
    var renderBox = node("div", "blk-render");
    var srcBox = node("div", "blk-src");
    var area = node("textarea");
    area.setAttribute("spellcheck", "false");
    area.setAttribute("aria-label", t("第 " + (index + 1) + " 块的 Markdown 源码", "Markdown source of block " + (index + 1)));
    srcBox.appendChild(area);
    wrap.appendChild(renderBox);
    wrap.appendChild(srcBox);

    function paintRender() {
      var made = contentFor(doc[index]);
      wrap.className = "blk " + made.cls;
      renderBox.textContent = "";
      renderBox.appendChild(made.box);
    }

    function enter() {
      if (wrap.classList.contains("editing")) return;
      paintRender();
      area.value = doc[index];
      wrap.classList.add("editing");
      area.focus();
      setState(t("编辑中 · 只有第 " + (index + 1) + " 块显示源码", "editing · only block " + (index + 1) + " shows source"));
    }

    function commit() {
      if (!wrap.classList.contains("editing")) return;
      doc[index] = area.value;
      wrap.classList.remove("editing");
      paintRender();
      setState(t("渲染中 · " + doc.length + " 块 / 每帧只克隆活动块", "rendered · " + doc.length + " blocks / one clone per frame"));
    }

    paintRender();
    renderBox.addEventListener("click", enter);
    area.addEventListener("blur", commit);
    area.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); commit(); }
    });
    return wrap;
  }

  function paintDemo() {
    if (!demoBody) return;
    demoBody.textContent = "";
    doc.forEach(function (_, i) { demoBody.appendChild(buildBlock(i)); });
    setState(t("渲染中 · " + doc.length + " 块 / 每帧只克隆活动块", "rendered · " + doc.length + " blocks / one clone per frame"));
  }

  var resetBtn = document.getElementById("demo-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      doc = DOCS[currentLang()].slice();
      paintDemo();
    });
  }
  langListeners.push(function (lang) {
    doc = DOCS[lang].slice();
    paintDemo();
  });
  paintDemo();
})();
