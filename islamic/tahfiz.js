/* يومو تحفيظ: تكرار السور آية بآية بصوت شيوخ كبار + التسميع */
(function () {
  'use strict';
  var KEY = 'yomo-tahfiz-v1';
  var CDN = 'https://cdn.islamic.network/quran/audio/128/';
  var DEF_RECITER = 'ar.husary';
  var DEF_REPEAT = 3;
  var DEF_PAUSE = 3;

  var S = { data: null, reciters: [], surahs: [], loaded: false };
  var P = loadProg();
  var A = null;
  var eng = { playing: false, mode: 'listen', surah: null, idx: 0, rep: 0, timer: null };

  var root = null;   // overlay
  var viewList = null, viewSurah = null;
  var nowView = null;

  function loadProg() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; }
  }
  function saveProg() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} }

  function prog(s) {
    if (!P[s]) P[s] = { memorized: [], stars: 0 };
    return P[s];
  }

  /* ---------- silent sync audio ---------- */
  function mkAudio() {
    var a = new Audio();
    a.preload = 'auto';
    a.__yumoOwn = 1;   /* يمنع إيقافه بواسطة غطس القراءة أيام الشرح */
    a.volume = 1;
    return a;
  }

  function url(rec, g) { return CDN + rec + '/' + g + '.mp3'; }

  function echoWait(sec, then) {
    stopTimer();
    eng.timer = setTimeout(then, sec * 1000);
  }
  function stopTimer() { if (eng.timer) { clearTimeout(eng.timer); eng.timer = null; } }

  function stopAll() {
    stopTimer();
    if (AAsync()) AAsync().pause();
  }

  /* ---------- icons / ui helpers ---------- */
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function btn(txt, fn, cls) {
    var b = el('button', 'yh-btn' + (cls ? ' ' + cls : ''), txt);
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  }

  /* ---------- styles ---------- */
  var CSS = [
    '.yh-ov{position:fixed;inset:0;z-index:99999;background:linear-gradient(160deg,#0e4a3a,#175f4a 55%,#0c3d30);overflow:auto;font-family:inherit;color:#fffaf0;direction:rtl}',
    '.yh-shell{max-width:860px;margin:0 auto;padding:18px 16px 40px}',
    '.yh-top{display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap}',
    '.yh-title{font-size:22px;font-weight:900;color:#ffd98a;margin:0;flex:1}',
    '.yh-close{border:0;border-radius:12px;background:rgba(255,255,255,.12);color:#fffaf0;font-size:15px;font-weight:700;padding:9px 16px;cursor:pointer;font-family:inherit}',
    '.yh-sub{color:#cfe8dd;font-size:14px;margin:0 0 14px}',
    '.yh-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px}',
    '.yh-card{border:0;border-radius:16px;background:rgba(255,255,255,.09);padding:14px;text-align:center;cursor:pointer;font-family:inherit;color:#fffaf0;box-shadow:0 4px 14px rgba(0,0,0,.18)}',
    '.yh-card b{display:block;font-size:19px;margin-bottom:6px}',
    '.yh-card .yh-cmeta{font-size:12.5px;color:#cfe8dd}',
    '.yh-stars{color:#ffd98a;font-size:15px;letter-spacing:3px;margin-top:8px;display:block}',
    '.yh-bar{height:8px;border-radius:99px;background:rgba(255,255,255,.18);overflow:hidden;margin-top:10px}',
    '.yh-bar i{display:block;height:100%;background:linear-gradient(90deg,#ffd98a,#f5b942);border-radius:99px;transition:width .4s}',
    '.yh-controls{display:flex;gap:10px;flex-wrap:wrap;align-items:center;background:rgba(255,255,255,.08);border-radius:16px;padding:12px;margin:14px 0}',
    '.yh-label{font-size:13px;color:#cfe8dd;white-space:nowrap}',
    '.yh-sel{border:0;border-radius:10px;padding:8px 10px;font:inherit;font-size:13.5px;background:#fffaf0;color:#0c3d30;font-weight:700;max-width:210px}',
    '.yh-nav{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:12px 0}',
    '.yh-btn{border:0;border-radius:12px;padding:12px 22px;font-family:inherit;font-size:15.5px;font-weight:800;cursor:pointer;background:linear-gradient(135deg,#ffd98a,#f5b942);color:#2d2a22;box-shadow:0 4px 14px rgba(245,185,66,.4)}',
    '.yh-btn-plain{background:rgba(255,255,255,.14);color:#fffaf0;box-shadow:none}',
    '.yh-btn-on{background:#ffd98a!important;color:#2d2a22!important;box-shadow:0 4px 14px rgba(245,185,66,.4)!important}',
    '.yh-chk{margin-top:8px;border:0;border-radius:99px;padding:6px 14px;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;background:rgba(255,255,255,.14);color:#fffaf0}',
    '.yh-chk.done{background:linear-gradient(135deg,#ffd98a,#f5b942);color:#2d2a22}',
    '.yh-ayah{background:rgba(255,255,255,.08);border-radius:16px;padding:14px 16px;margin-bottom:10px;border:2px solid rgba(255,255,255,.06)}',
    '.yh-ayah.on{border-color:#ffd98a;background:rgba(245,185,66,.18)}',
    '.yh-ayah .yh-at{font-weight:700;color:#ffd98a;margin:0 0 6px;font-size:13px}',
    '.yh-ayah .yh-at span{display:inline-block;min-width:30px;height:26px;line-height:26px;text-align:center;background:rgba(255,255,255,.16);border-radius:99px;margin-inline-end:6px;font-size:12.5px}',
    '.yh-text{font-size:clamp(17px,2.4vw,22px);line-height:2;margin:0;text-align:right}',
    '.yh-word{display:inline-block;margin-inline-end:6px;border-radius:8px;padding:0 4px;cursor:pointer}',
    '.yh-word.mask{background:rgba(0,0,0,.38);color:transparent;border-radius:8px;min-width:34px;user-select:none}',
    '.yh-word.on{background:rgba(245,185,66,.35)}',
    '.yh-flash{position:fixed;left:50%;top:26%;transform:translateX(-50%);background:#ffd98a;color:#0c3d30;font-size:20px;font-weight:900;padding:12px 26px;border-radius:99px;z-index:999999;box-shadow:0 8px 26px rgba(0,0,0,.35);display:none}',
    '.yh-list{display:grid;gap:10px}',
    '.yh-help{width:100%}'
  ].join('');
  var styleEl = null;
  function ensureCSS() {
    if (styleEl) return;
    styleEl = el('style');
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);
  }

  /* ---------- data ---------- */
  function loadData(cb) {
    fetch('/books-islamic/tahfiz.json')
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) {
        S.reciters = d.reciters || [];
        S.surahs = d.surahs || [];
        S.loaded = true;
        cb && cb();
      })
      .catch(function () {
        /* fallback: التفاصيل من صفحة index.html? نحتفظ بشاشة خطأ */
        cb && cb();
      });
  }

  function reciterName(key) {
    for (var i = 0; i < S.reciters.length; i++) if (S.reciters[i].key === key) return S.reciters[i].name;
    return key;
  }

  /* ---------- muted: reading app narration ---------- */
  function muteOn() {
    window.__yumoExplain = 1;
    try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {}
    var as = document.querySelectorAll('audio');
    for (var i = 0; i < as.length; i++) { if (!as[i].__yumoOwn) { try { as[i].pause(); } catch (e) {} } }
  }
  function muteOff() {
    window.__yumoExplain = 0;
    stopAll();
  }

  /* ---------- render: surah list ---------- */
  function renderList() {
    nowView = 'list';
    viewList.style.display = '';
    viewSurah.style.display = 'none';
    var c = viewList.querySelector('.yh-cards');
    c.textContent = '';
    S.surahs.forEach(function (s) {
      var pr = prog(s.number);
      var done = pr.memorized.length;
      var total = s.ayahs.length;
      var card = el('button', 'yh-card');
      card.type = 'button';
      var b = el('b', null, s.name);
      var m = el('span', 'yh-cmeta', 'سورة ' + s.englishName + ' • ' + total + ' آيات');
      var st = el('span', 'yh-stars', starStr(pr.stars));
      var bar = el('div', 'yh-bar');
      var inner = el('i');
      inner.style.width = Math.round((done / total) * 100) + '%';
      bar.appendChild(inner);
      var t = el('span', 'yh-cmeta', 'محفوظ ' + done + ' من ' + total);
      card.appendChild(b); card.appendChild(m); card.appendChild(bar); card.appendChild(t); card.appendChild(st);
      card.addEventListener('click', function () { viewSurahEl(s); });
      c.appendChild(card);
    });
    if (!S.surahs.length) {
      var p = el('p', 'yh-help', 'تعذّر تحميل بيانات التحفيظ. تأكد من الاتصال ثم أعد فتح النافذة.');
      c.appendChild(p);
    }
  }

  function starStr(n) {
    var s = '';
    for (var i = 0; i < 3; i++) s += i < n ? '★' : '☆';
    return s;
  }

  /* ---------- render: surah view ---------- */
  function viewSurahEl(s) {
    nowView = 'surah';
    eng.surah = s; eng.idx = firstUnplayed(s); eng.rep = 0;
    viewSurah.style.display = '';
    viewList.style.display = 'none';
    var head = viewSurah.querySelector('.yh-shead');
    head.textContent = 'سورة ' + s.name;
    var body = viewSurah.querySelector('.yh-sbody');
    body.textContent = '';
    s.ayahs.forEach(function (a, i) {
      var card = el('div', 'yh-ayah');
      var at = el('div', 'yh-at');
      at.appendChild(el('span', null, String(a.n)));
      at.appendChild(document.createTextNode('آية ' + indexToAr(i + 1)));
      card.appendChild(at);
      card.appendChild(mkAyahText(a, s, i, card));
      var chk = el('button', 'yh-chk' + (isMemorized(s, a) ? ' done' : ''), isMemorized(s, a) ? 'محفوظة ✓' : 'حفظتها ✓');
      chk.type = 'button';
      chk.addEventListener('click', function (ev) { ev.stopPropagation(); toggleMem(s, a, chk); });
      card.appendChild(chk);
      card.addEventListener('click', function () { selectAyah(s, i); });
      body.appendChild(card);
    });
    syncAyahHighlight();
    syncSelects();
  }

  function firstUnplayed(s) {
    var pr = prog(s.number);
    for (var i = 0; i < s.ayahs.length; i++) if (pr.memorized.indexOf(s.ayahs[i].g) < 0) return i;
    return 0;
  }

  function selectAyah(s, i) {
    stopAll();
    eng.surah = s; eng.idx = i; eng.rep = 0;
    syncAyahHighlight();
    var c = document.querySelectorAll('.yh-ayah')[i];
    if (c && c.scrollIntoView) { try { c.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { c.scrollIntoView(false); } }
  }

  function syncAyahHighlight() {
    if (!eng.surah) return;
    var cs = viewSurah.querySelectorAll('.yh-ayah');
    var words = viewSurah.querySelectorAll('.yh-text');
    for (var i = 0; i < cs.length; i++) {
      cs[i].classList.toggle('on', i === eng.idx);
      if (words[i]) words[i].classList.toggle('on', i === eng.idx);
    }
  }

  function syncSelects() {
    var r = viewSurah.querySelector('.yh-rs');
    if (r) r.value = settings().reciter;
    var p = viewSurah.querySelector('.yh-ps');
    if (p) p.value = String(settings().pause);
    var n = viewSurah.querySelector('.yh-ns');
    if (n) n.value = String(settings().repeat);
  }

  /* ---------- settings ---------- */
  function settings() {
    if (!P.settings) P.settings = { reciter: DEF_RECITER, repeat: DEF_REPEAT, pause: DEF_PAUSE };
    return P.settings;
  }

  /* ---------- ayah text + word masking ---------- */
  function wordsOf(a) { return a.text.split(/\s+/).filter(Boolean); }
  function maskRatio(s) {
    var pr = prog(s.number);
    return pr.stars >= 3 ? 0.75 : (pr.stars >= 2 ? 0.5 : (pr.stars >= 1 ? 0.4 : 0.25));
  }

  function mkAyahText(a, s, i, card) {
    var p = el('p', 'yh-text');
    var words = wordsOf(a);
    var mask = Math.min(1, maskRatio(s));
    var step = Math.max(2, Math.round(1 / (mask || 0.25)));
    var hidden = 0;
    words.forEach(function (w, wi) {
      var span = el('span', 'yh-word');
      var masked = (wi % step === 0) && words.length > 3 && !isMemorized(s, a);
      if (masked) { span.classList.add('mask'); span.textContent = '\u203B\u203B\u203B'; hidden++; }
      else span.textContent = w;
      if (masked) {
        span.addEventListener('click', function () {
          span.classList.remove('mask');
          span.textContent = w;
          revealCount(card, s, a);
        });
      }
      p.appendChild(span);
    });
    p.__nWords = words.length; p.__nHidden = hidden;
    return p;
  }

  function revealCount(card, s, a) {
    var ps = card.querySelectorAll('.yh-word.mask');
    if (!ps.length && !isMemorized(s, a)) {
      markMemorized(s, a);
      showFlash('أحسنت! حفظت الآية ' + a.n + ' 🌟');
    }
  }

  function isMemorized(s, a) { return prog(s.number).memorized.indexOf(a.g) >= 0; }
  function toggleMem(s, a, chk) {
    var pr = prog(s.number);
    var i = pr.memorized.indexOf(a.g);
    if (i >= 0) pr.memorized.splice(i, 1);
    else pr.memorized.push(a.g);
    pr.stars = Math.min(3, Math.round((pr.memorized.length / s.ayahs.length) * 3));
    saveProg();
    if (chk) {
      chk.classList.toggle('done', pr.memorized.indexOf(a.g) >= 0);
      chk.textContent = pr.memorized.indexOf(a.g) >= 0 ? 'محفوظة ✓' : 'حفظتها ✓';
    }
    if (isMemorized(s, a)) showFlash('أحسنت! الآية ' + a.n + ' أصبحت محفوظة 🌟');
  }
  function markMemorized(s, a) {
    var pr = prog(s.number);
    if (pr.memorized.indexOf(a.g) < 0) pr.memorized.push(a.g);
    pr.stars = Math.min(3, Math.max(pr.stars, Math.round((pr.memorized.length / s.ayahs.length) * 3)));
    saveProg();
    var cs = document.querySelectorAll('.yh-ayah');
    for (var i = 0; i < cs.length; i++) {
      var at = cs[i].querySelector('.yh-at span');
      if (at && at.textContent === String(a.n)) {
        var chk = cs[i].querySelector('.yh-chk');
        if (chk) { chk.classList.add('done'); chk.textContent = 'محفوظة ✓'; }
        break;
      }
    }
    renderSurahCardMeta(s);
  }
  function renderSurahCardMeta(s) {
    var pr = prog(s.number);
    var total = 0;
    for (var i = 0; i < S.surahs.length; i++) if (S.surahs[i].number === s.number) total = S.surahs[i].ayahs.length;
    var st = viewList.querySelectorAll('.yh-stars');
    var m = viewList.querySelectorAll('.yh-cmeta');
    /* إعادة بناء القائمة كاملة = أبسط */
    if (nowView === 'list') renderList();
  }

  function showFlash(txt) {
    var f = document.querySelector('.yh-flash');
    if (!f) { f = el('div', 'yh-flash'); document.body.appendChild(f); }
    f.textContent = txt;
    f.style.display = 'block';
    clearTimeout(showFlash.t);
    showFlash.t = setTimeout(function () { f.style.display = 'none'; }, 1800);
  }

  /* ---------- playback ---------- */
  function startPlay() {
    if (!eng.surah) return;
    stopAll();
    eng.playing = true;
    engineStep();
  }
  function engineStep() {
    if (!eng.playing) return;
    var s = eng.surah;
    if (eng.idx >= s.ayahs.length) { /* انتهت السورة */ endSurah(s); return; }
    var a = s.ayahs[eng.idx];
    syncAyahHighlight();
    var urlA = url(settings().reciter, a.g);
    if (eng.mode === 'all') {
      AAsync().onended = nextAll;
      playAudio(urlA);
      return;
    }
    AAsync().onended = onRepEnd;
    playAudio(urlA);
  }
  function nextAll() {
    eng.idx++;
    if (eng.idx >= eng.surah.ayahs.length) { endSurah(eng.surah); return; }
    echoWait(settings().pause, function () { engineStep(); });
  }
  function onRepEnd() {
    var s = eng.surah;
    if (eng.mode === 'all') return;
    var repN = settings().repeat;
    if (eng.rep < repN - 1) {
      eng.rep++;
      echoWait(settings().pause, function () { engineStep(); });
    } else if (eng.idx < s.ayahs.length - 1) {
      eng.idx++; eng.rep = 0;
      echoWait(settings().pause, function () { engineStep(); });
    } else {
      endSurah(s);
    }
  }
  function endSurah(s) {
    eng.playing = false;
    showFlash('تبارك الله! أتممت سورة ' + s.name + ' 🎉');
    try {
      var pr = prog(s.number);
      var was = pr.stars;
      pr.stars = Math.min(3, Math.max(pr.stars, Math.round((pr.memorized.length / s.ayahs.length) * 3) || 1));
      if (pr.stars < 3 && was === pr.stars && pr.stars < 3) pr.stars = Math.min(3, pr.stars + 1);
      saveProg();
    } catch (e) {}
    if (nowView === 'list') renderList();
  }

  function playAudio(u) {
    var a = AAsync();
    a.src = u;
    var pr = a.play();
    if (pr && pr.catch) pr.catch(function () { showFlash('تعذّر تشغيل الصوت. تحقق من الاتصال.'); });
  }
  function pausePlay() { eng.playing = false; stopAll(); syncSelects(); }
  function AAsync() { if (!A) A = mkAudio(); return A; }

  function setVoiceUI() {
    var sel = viewSurah.querySelector('.yh-rs');
    if (!sel) return;
    sel.textContent = '';
    S.reciters.forEach(function (r) {
      var o = el('option', null, r.name);
      o.value = r.key;
      sel.appendChild(o);
    });
    sel.value = settings().reciter;
  }

  /* ---------- build overlay ---------- */
  function buildOverlay() {
    ensureCSS();
    root = el('div', 'yh-ov');
    root.style.display = 'none';

    var shell = el('div', 'yh-shell');
    var top = el('div', 'yh-top');
    top.appendChild(el('h2', 'yh-title', '🎧 تحفيظ السور — الحفظ مع الشيوخ'));
    var cl = btn('متابعة القراءة ✕', function () { close(); }, 'yh-close');
    top.appendChild(cl);
    shell.appendChild(top);
    shell.appendChild(el('p', 'yh-sub', 'اختر سورة، استمع لصوت الشيخ ثم رتّب التكرار وردّد خلفه، واختم بالتسميع لإخفاء الكلمات وإظهارها.'));

    /* ---- view: list ---- */
    viewList = el('div');
    var cards = el('div', 'yh-cards');
    viewList.appendChild(cards);
    shell.appendChild(viewList);

    /* ---- view: surah ---- */
    viewSurah = el('div');
    viewSurah.style.display = 'none';
    var shead = el('h3', 'yh-shead yh-title');
    viewSurah.appendChild(shead);

    /* top controls */
    var ctrl = el('div', 'yh-controls');

    var l1 = el('span', 'yh-label', 'القارئ:');
    var rc = el('select', 'yh-sel yh-rs');
    var fin = function () {
      settings().reciter = rc.value;
      saveProg();
      if (eng.playing) { stopAll(); engineStep(); }
    };
    rc.addEventListener('change', fin);
    ctrl.appendChild(l1); ctrl.appendChild(rc);

    ctrl.appendChild(el('span', 'yh-label', 'التكرار:'));
    var rp = el('select', 'yh-sel yh-ns');
    [1, 2, 3, 5].forEach(function (n) {
      var o = el('option', null, String(n) + ' مرات');
      o.value = String(n);
      rp.appendChild(o);
    });
    rp.addEventListener('change', function () { settings().repeat = parseInt(rp.value, 10) || 3; saveProg(); });
    ctrl.appendChild(rp);

    ctrl.appendChild(el('span', 'yh-label', 'فترة الترديد:'));
    var pd = el('select', 'yh-sel yh-ps');
    [[1, 'قصيرة'], [3, 'متوسطة'], [6, 'طويلة']].forEach(function (x) {
      var o = el('option', null, x[1] + ' (' + x[0] + ' ث)');
      o.value = String(x[0]);
      pd.appendChild(o);
    });
    pd.addEventListener('change', function () { settings().pause = parseInt(pd.value, 10) || 3; saveProg(); });
    ctrl.appendChild(pd);
    viewSurah.appendChild(ctrl);

    var back = el('div', 'yh-nav');
    back.appendChild(btn('→ كل السور', function () { pausePlay(); renderList(); }));
    back.appendChild(btn('▶ ابدأ (تكرار الآية)', startPlay, 'yh-btn-on'));
    back.appendChild(btn('⏸ إيقاف مؤقت', pausePlay, 'yh-btn-plain'));
    viewSurah.appendChild(back);

    var body = el('div', 'yh-sbody yh-list');
    viewSurah.appendChild(body);
    shell.appendChild(viewSurah);

    root.appendChild(shell);
    document.body.appendChild(root);
  }

  /* ---------- open / close / button ---------- */
  var btn2 = null;
  function ensureButton() {
    var host = document.querySelector('.reader-top-actions');
    if (!host) return;
    if (btn2 && document.body.contains(btn2)) return;
    btn2 = el('button', null, '🎧 تحفيظ السور');
    btn2.type = 'button';
    btn2.style.cssText = 'border:0;border-radius:12px;padding:8px 13px;font-size:13.5px;font-weight:700;cursor:pointer;font-family:inherit;background:linear-gradient(135deg,#7ad0a8,#2f8f6d);color:#04241a;box-shadow:0 3px 10px rgba(47,143,109,.4)';
    btn2.addEventListener('click', open);
    host.insertBefore(btn2, host.firstChild);
  }

  function open() {
    if (S.loaded) { doOpen(); return; }
    loadData(function () { doOpen(); });
  }
  function doOpen() {
    if (!root) buildOverlay();
    muteOn();
    eng.mode = 'repeat'; eng.playing = false;
    if (!S.surahs.length) loadData(function () { renderList(); });
    root.style.display = 'block';
    nowView = 'list';
    renderList();
    setVoiceUI();
    syncSelects();
  }
  function close() {
    pausePlay();
    muteOff();
    if (root) root.style.display = 'none';
  }

  /* ---------- watch ---------- */
  var ob2 = new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) {
      var ns = ms[i].addedNodes;
      for (var j = 0; j < ns.length; j++) if (ns[j] && ns[j].nodeType === 1) ensureButton();
    }
  });
  function boot() {
    setTimeout(ensureButton, 700); setTimeout(ensureButton, 1600); setTimeout(ensureButton, 3000);
    ob2.observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);

  /* ---------- numbers in arabic ---------- */
  function indexToAr(n) {
    var m = {};
    ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'].forEach(function (c, i) { m[i] = c; });
    return String(n).replace(/\d/g, function (d) { return m[d]; });
  }
})();