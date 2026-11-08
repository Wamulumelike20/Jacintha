(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Music playlist (never autoplays) ---------- */
  var playlist = [
    { title: "Breathless", artist: "Shayne Ward", src: "audio/breathless.mp3" },
    { title: "Dandelions", artist: "Ruth B", src: "audio/dandelions.mp3" },
    { title: "A Thousand Years", artist: "Christina Perri", src: "audio/a-thousand-years.mp3" },
    { title: "Imperfect", artist: "Abel Chungu", src: "audio/imperfect.mp3" }
  ];
  var audio = $("#audio");
  var playBtn = $("#play-btn");
  var player = $("#player");
  var trackTitle = $("#track-title");
  var trackArtist = $("#track-artist");
  var index = 0;
  var failures = 0;

  function loadTrack(i) {
    index = (i + playlist.length) % playlist.length;
    audio.src = playlist[index].src;
    trackTitle.textContent = playlist[index].title;
    trackArtist.textContent = playlist[index].artist;
  }

  function setPlayingUI(isPlaying) {
    playBtn.setAttribute("aria-pressed", String(isPlaying));
    playBtn.setAttribute("aria-label", isPlaying ? "Pause music" : "Play music");
    player.classList.toggle("is-playing", isPlaying);
  }

  function play() {
    var p = audio.play();
    if (p && typeof p.catch === "function") {
      p.catch(function () { setPlayingUI(false); });
    }
  }

  function step(delta, keepPlaying) {
    loadTrack(index + delta);
    if (keepPlaying) { play(); }
  }

  playBtn.addEventListener("click", function () {
    if (audio.paused) { play(); } else { audio.pause(); }
  });
  $("#next-btn").addEventListener("click", function () { step(1, !audio.paused); });
  $("#prev-btn").addEventListener("click", function () {
    if (audio.currentTime > 4) { audio.currentTime = 0; } else { step(-1, !audio.paused); }
  });
  audio.addEventListener("play", function () { setPlayingUI(true); failures = 0; });
  audio.addEventListener("pause", function () { setPlayingUI(false); });
  audio.addEventListener("ended", function () { step(1, true); });
  audio.addEventListener("error", function () {
    failures += 1;
    if (failures < playlist.length) { step(1, !audio.paused || player.classList.contains("is-playing")); }
  });
  loadTrack(0);

  /* ---------- Falling petals ---------- */
  var petalWrap = $("#petals");
  if (!reduceMotion) {
    var count = window.innerWidth < 620 ? 9 : 16;
    for (var i = 0; i < count; i++) {
      var petal = document.createElement("span");
      petal.className = "petal";
      petal.style.left = Math.random() * 100 + "%";
      petal.style.animationDuration = 14 + Math.random() * 14 + "s";
      petal.style.animationDelay = -Math.random() * 20 + "s";
      petal.style.transform = "scale(" + (0.7 + Math.random() * 0.8) + ")";
      petalWrap.appendChild(petal);
    }
  }

  /* ---------- Opening screen ---------- */
  var intro = $("#intro");
  var site = $("#site");
  $("#open-btn").addEventListener("click", function () {
    site.hidden = false;
    intro.classList.add("is-leaving");
    document.body.classList.remove("is-locked");
    window.scrollTo(0, 0);
    setTimeout(function () { intro.hidden = true; }, 1200);
    prepareLetter();
    observeReveals();
    observeNav();
    observeProposal();
  });

  /* ---------- Navigation ---------- */
  var nav = $("#nav");
  var toggle = $("#nav-toggle");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
  $$("#nav-menu a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { setMenu(false); } });

  function observeNav() {
    if (!("IntersectionObserver" in window)) { return; }
    var links = $$("#nav-menu a");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (l) { l.classList.toggle("is-active", l.getAttribute("href") === "#" + en.target.id); });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["letter", "flirt", "together", "know", "secrets", "imagine", "proposal"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { io.observe(el); }
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function observeReveals() {
    var targets = $$(".section__title, .section__lede, .tile, .note, .secret, .paper, .progress, .flip, .imagine__text p");
    targets.forEach(function (el) { el.classList.add("reveal"); });
    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Letter: words appear as if being written ---------- */
  function prepareLetter() {
    var body = $("#letter-body");
    var paras = $$("p", body);
    var total = paras.reduce(function (n, p) { return n + p.textContent.trim().split(/\s+/).length; }, 0);
    var gap = Math.min(0.09, 16 / total);
    var n = 0;
    paras.forEach(function (p) {
      var words = p.textContent.trim().split(/\s+/);
      p.textContent = "";
      words.forEach(function (word, k) {
        var span = document.createElement("span");
        span.className = "w";
        span.style.setProperty("--d", (n * gap).toFixed(2) + "s");
        span.textContent = word;
        p.appendChild(span);
        if (k < words.length - 1) { p.appendChild(document.createTextNode(" ")); }
        n += 1;
      });
    });
    if (reduceMotion || !("IntersectionObserver" in window)) { body.classList.add("is-writing"); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { body.classList.add("is-writing"); io.disconnect(); }
    }, { threshold: 0.2 });
    io.observe(body);
  }

  /* ---------- Flirt cards ---------- */
  var opened = new Set();
  var cards = $$(".flip__btn");
  var countEl = $("#flirt-count");
  var barEl = $("#flirt-bar");
  var finalEl = $("#flirt-final");
  cards.forEach(function (btn, i) {
    btn.addEventListener("click", function () {
      var on = btn.getAttribute("aria-pressed") === "true";
      btn.setAttribute("aria-pressed", String(!on));
      if (!on && !opened.has(i)) {
        opened.add(i);
        countEl.textContent = opened.size;
        barEl.style.width = (opened.size / cards.length) * 100 + "%";
        if (opened.size === cards.length) {
          finalEl.hidden = false;
          setTimeout(function () { finalEl.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }); }, 900);
        }
      }
    });
  });

  /* ---------- Secrets ---------- */
  $$(".secret__btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var body = document.getElementById(btn.getAttribute("aria-controls"));
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      body.hidden = open;
    });
  });

  /* ---------- Proposal ---------- */
  var stage = $("#proposal-stage");
  var yes = $("#reply-yes");
  var wait = $("#reply-wait");
  var heartsWrap = $("#hearts");

  function spawnHearts(n, fast) {
    if (reduceMotion) { return; }
    for (var i = 0; i < n; i++) {
      var h = document.createElement("span");
      h.className = "heart";
      h.style.left = Math.random() * 100 + "%";
      h.style.animationDuration = (fast ? 5 : 9) + Math.random() * 8 + "s";
      h.style.animationDelay = (fast ? Math.random() * 1.5 : -Math.random() * 12) + "s";
      var s = 0.6 + Math.random() * 1.1;
      h.style.width = h.style.height = 14 * s + "px";
      heartsWrap.appendChild(h);
      if (fast) { setTimeout(function (el) { el.remove(); }, 14000, h); }
    }
  }
  spawnHearts(window.innerWidth < 620 ? 8 : 14, false);

  function observeProposal() {
    var steps = $$(".p-step", stage);
    var times = [300, 3600, 7200, 10200];
    var started = false;
    function run() {
      if (started) { return; }
      started = true;
      steps.forEach(function (el, k) {
        setTimeout(function () { el.classList.add("is-in"); }, reduceMotion ? 0 : times[k]);
      });
    }
    if (!("IntersectionObserver" in window)) { run(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { run(); io.disconnect(); }
    }, { threshold: 0.45 });
    io.observe($("#proposal"));
  }

  function showReply(reply, celebrate) {
    stage.hidden = true;
    reply.hidden = false;
    reply.focus({ preventScroll: true });
    if (celebrate) { spawnHearts(26, true); }
  }
  $("#answer-yes").addEventListener("click", function () { showReply(yes, true); });
  $("#answer-wait").addEventListener("click", function () { showReply(wait, false); });
  $$("[data-back]").forEach(function (b) {
    b.addEventListener("click", function () {
      yes.hidden = true;
      wait.hidden = true;
      stage.hidden = false;
    });
  });
})();
