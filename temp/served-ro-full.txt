/* reading-order.js â€” Ø¥ØµÙ„Ø§Ø­ Ù‚Ø±Ø§Ø¡Ø© Ù…Ù†ØµÙ‘ØªÙŠ Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© ÙˆØ§Ù„ØªØ±Ø¨ÙŠØ© Ø§Ù„Ø¥Ø³Ù„Ø§Ù…ÙŠØ©:
   1) ÙŠÙÙ„ØªØ± Ø±Ù…ÙˆØ² OCR Ø§Ù„Ø²Ø§Ø¦Ø¯Ø© (Ø¹Ù„Ø§Ù…Ø§Øª ØªØ´ÙƒÙŠÙ„ Ù…ÙØ±Ø¯Ø©ØŒ Ø£ÙŠ Ø±Ù…Ø² ÙŠØ­ÙˆÙŠ Ø£Ø±Ù‚Ø§Ù…Ù‹Ø§ Ù„ØµÙØ­Ø§Øª/Ø¢ÙŠØ§ØªØŒ
      Ø®Ø·ÙˆØ·Ù‹Ø§ ÙÙ†ÙŠØ©ØŒ Ù…Ù‚Ø§Ø·Ø¹ Ø¹Ù…Ù„Ø§Ù‚Ø©) ÙÙ„Ø§ ØªÙÙ†Ø·Ù‚ ÙˆÙ„Ø§ ØªØ¸Ù‡Ø± ÙƒØ£Ø²Ø±Ø§Ø±.
   2) ÙŠØµØ­Ø­ Ø§Ù„ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ù…Ø´ÙˆÙ‘Ø´Ø© Ø§Ù„Ù…Ø¹Ø±ÙˆÙØ© (Ù…Ø«Ù„ "Ø§Ø¸Ù’Ø²ÙØ±"â†"Ø£ÙÙ†Ù’Ø¸ÙØ±Ù’") Ø¥Ù„Ù‰ ÙƒÙ„Ù…Ø§Øª Ø³Ù„ÙŠÙ…Ø©
      Ù…ÙˆØ¬ÙˆØ¯Ø© ÙÙŠ Ø®Ø±Ø§Ø¦Ø· Ø§Ù„ØµÙˆØªÙŠØ§Øª.
   3) ÙÙŠ ØµÙØ­Ø§Øª Ø¯Ø±ÙˆØ³ Ø§Ù„Ø³ÙˆØ± (Ø§Ù„Ø¥Ø³Ù„Ø§Ù…ÙŠ) ÙŠØ¨Ù†ÙŠ Ø£Ø²Ø±Ø§Ø± "Ø¢ÙŠØ© ÙƒØ§Ù…Ù„Ø©" Ù†ØµÙ‘Ù‡Ø§ Ù†ØµÙ‘ Ø§Ù„Ø¢ÙŠØ© Ù…Ù†
      tahfiz.json ØªÙ…Ø§Ù…Ù‹Ø§ â€” ÙÙŠØ¹Ø²Ù ØµÙˆØª Ø§Ù„ØªÙ„Ø§ÙˆØ© Ø§Ù„ÙƒØ§Ù…Ù„ Ù„Ù„Ø­ØµØ±ÙŠ /audio/husary/[g].mp3
      Ø¹Ø¨Ø± findAyah Ø§Ù„Ù…ÙˆØ¬ÙˆØ¯ØŒ Ø¨Ø¯Ù„Ù‹Ø§ Ù…Ù† ØªÙ‚Ø·ÙŠØ¹ Ø§Ù„Ù†Øµ Ø§Ù„Ù…Ø´ÙˆÙ‘Ø´ ÙƒÙ„Ù…Ø§Øª.
   4) ÙŠØ±ØªÙ‘Ø¨ Ø§Ù„ÙƒÙ„Ù…Ø§Øª Ø´ÙƒÙ„Ù‹Ø§ ÙØ´ÙƒÙ„Ù‹Ø§ ÙÙŠ Ø¨Ù‚ÙŠØ© Ø§Ù„ØµÙØ­Ø§Øª (ÙƒØªÙ„ Ø£ÙÙ‚ÙŠØ© Ø«Ù… Ø£Ø¹Ù…Ø¯Ø© ÙŠÙ…ÙŠÙ†â†ÙŠØ³Ø§Ø±). */
(function () {
  "use strict";
  if (!/^\/(islamic|ar)\b/.test(location.pathname)) return;

  var IS_ISLAMIC = /^\/islamic\b/.test(location.pathname);

  /* ===== ØªØ·Ø¨ÙŠØ¹ ÙŠÙØ·Ø§Ø¨Ù‚ norm ÙÙŠ speak-husary Ø­Ø±ÙÙŠÙ‹Ø§ ===== */
  function norm(s) {
    return String(s || "")
      .replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06DC\u06DF-\u06ED\u0653\u0654\u0655]/g, "")
      .replace(/[^\u0621-\u064A\u0671\s]/g, "")
      .replace(/[\u0621\u0622\u0623\u0625\u0671]/g, "\u0627")
      .replace(/\u0629/g, "\u0647")
      .replace(/\u0649/g, "\u064A")
      .replace(/\s+/g, " ")
      .trim();
  }
  function stripMarks(t) {
    return String(t || "").replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06DC\u06DF-\u06ED\u0653\u0654\u0655\u0652]/g, "");
  }

  /* ===== ØªØµØ­ÙŠØ­ ÙƒÙ„Ù…Ø§Øª OCR Ø§Ù„Ù…Ø´ÙˆÙ‘Ø´Ø© Ø§Ù„Ù…Ø¹Ø±ÙˆÙØ© ===== */
  var GARBLE = {
    "Ø§Ø¸Ø²Ø±": "Ø£ÙÙ†Ù’Ø¸ÙØ±Ù’",
    "ÙˆØ´Ø¶Ø±": "ÙˆÙŽÙÙŽÙƒÙÙ‘Ø±Ù’",
    "Ø¬Ø¹Ø±Ø©": "Ø³ÙÙˆØ±ÙŽØ©Ù",
    "Ø§Ù„Ø¸ØµØ§Ø·": "Ø§Ù„ØµÙÙ‘Ø±ÙŽØ§Ø·Ù"
  };
  function garbleKey(t) {
    return stripMarks(t).replace(/\u0640/g, "").replace(/\s+/g, "");
  }
  function garbleFix(t) {
    var k = garbleKey(t);
    if (GARBLE[k]) return GARBLE[k];
    return t;
  }

  /* ===== ÙÙ„ØªØ±Ø© ===== */
  function keepWord(t) {
    if (!t) return false;
    if (t.length > 400) return false;
    if (/[\d\u0660-\u0669\u06F0-\u06F9]/.test(t)) return false; /* Ø£ÙŠ Ø±Ù‚Ù… (ØµÙØ­Ø§Øª/Ø¢ÙŠØ§Øª/Ø¶ÙˆØ¶Ø§Ø¡) */
    var l = stripMarks(t).replace(/[^\u0621-\u064A\u0671]/g, "");
    if (!l) return false; /* Ø¹Ù„Ø§Ù…Ø§Øª ØªØ´ÙƒÙŠÙ„/ØªØ±Ù‚ÙŠÙ…/Ø®Ø·ÙˆØ· ÙÙ‚Ø· */
    return true;
  }

  /* ===== Ø¨ÙŠØ§Ù†Ø§Øª Ø¢ÙŠØ§Øª Ø§Ù„Ø³ÙˆØ± (tahfiz.json) ===== */
  var ayahData = { gText: null };
  var ayahP = null;
  function loadAyahs() {
    if (ayahP) return ayahP;
    ayahP = fetch("/books-islamic/tahfiz.json")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var gText = {};
        ((d && d.surahs) || []).forEach(function (s) {
          (s.ayahs || []).forEach(function (a) { if (!gText[a.g]) gText[a.g] = a.text; });
        });
        ayahData.gText = gText;
      })
      .catch(function () {});
    return ayahP;
  }
  loadAyahs();

  /* ===== Ù†Ø·Ø§Ù‚Ø§Øª ØµÙØ­Ø§Øª Ø¯Ø±ÙˆØ³ Ø§Ù„Ø³ÙˆØ± (Ø§Ù„ØªØ±Ø¨ÙŠØ© Ø§Ù„Ø¥Ø³Ù„Ø§Ù…ÙŠØ© ÙÙ‚Ø·) ===== */
  var SURAH_PAGES = IS_ISLAMIC ? [
    { from: 11, to: 16, gs: [1, 2, 3, 4, 5, 6, 7] },                                    /* Ø³ÙˆØ±Ø© Ø§Ù„ÙØ§ØªØ­Ø© */
    { from: 39, to: 43, gs: [6217, 6218, 6219, 6220, 6221] },                            /* Ø³ÙˆØ±Ø© Ø§Ù„Ù…Ø³Ø¯ */
    { from: 64, to: 69, gs: [6194, 6195, 6196, 6197] }                                   /* Ø³ÙˆØ±Ø© Ù‚Ø±ÙŠØ´ */
  ] : [];
  function surahFor(k) {
    var n = Number(k);
    if (isNaN(n)) return null;
    for (var i = 0; i < SURAH_PAGES.length; i++) {
      var r = SURAH_PAGES[i];
      if (n >= r.from && n <= r.to) return r.gs;
    }
    return null;
  }

  function unionBox(ws) {
    var b = null;
    for (var i = 0; i < ws.length; i++) {
      var r = ws[i].box;
      if (!r) continue;
      if (!b) b = [r[0], r[1], r[2], r[3]];
      else {
        var xe = r[0] + r[2], ye = r[1] + r[3];
        if (r[0] < b[0]) { b[2] += b[0] - r[0]; b[0] = r[0]; }
        if (xe > b[0] + b[2]) b[2] = xe - b[0];
        if (r[1] < b[1]) { b[3] += b[1] - r[1]; b[1] = r[1]; }
        if (ye > b[1] + b[3]) b[3] = ye - b[1];
      }
    }
    return b || [0, 0, 1, 1];
  }

  function surahChips(gs, box) {
    if (!ayahData.gText) return null;
    var out = [];
    for (var i = 0; i < gs.length; i++) {
      var t = ayahData.gText[gs[i]];
      if (!t) return null;
      out.push({ text: t, box: box, ayah: gs[i] });
    }
    return out;
  }

  /* ===== ØªØ±ØªÙŠØ¨ Ø§Ù„Ø£Ø´ÙƒØ§Ù„ (Ø§Ù„Ù…Ø­ÙÙˆØ¸) ===== */
  function median(a) {
    if (!a.length) return 0;
    a = a.slice().sort(function (x, y) { return x - y; });
    var m = a.length >> 1;
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }
  function cx(w) { return w.box[0] + w.box[2] / 2; }

  function orderPage(words) {
    var kept = [];
    for (var i = 0; i < words.length; i++) if (keepWord(words[i].text)) kept.push(words[i]);
    if (kept.length < 2) return kept;

    var hMed = median(kept.map(function (w) { return w.box[3]; })) || 1;
    var lineTh = Math.max(0.9, 0.7 * hMed);
    var bandGap = Math.max(2.2, 1.5 * hMed);

    var lines = [];
    for (var i = 0; i < kept.length; i++) {
      var w = kept[i], cy = w.box[1] + w.box[3] / 2;
      var L = lines.length ? lines[lines.length - 1] : null;
      if (L && Math.abs(cy - L.avg) <= lineTh) {
        L.items.push(w);
        L.avg = (L.avg * (L.items.length - 1) + cy) / L.items.length;
      } else {
        lines.push({ avg: cy, items: [w] });
      }
    }

    var bands = [];
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i], top = Infinity, bot = -Infinity;
      for (var j = 0; j < ln.items.length; j++) {
        var b = ln.items[j].box;
        if (b[1] < top) top = b[1];
        if (b[1] + b[3] > bot) bot = b[1] + b[3];
      }
      ln.top = top; ln.bot = bot;
      var B = bands.length ? bands[bands.length - 1] : null;
      if (B && ln.top - B.bot <= bandGap) {
        B.lines.push(ln);
        B.bot = Math.max(B.bot, ln.bot);
      } else {
        bands.push({ lines: [ln], top: ln.top, bot: ln.bot });
      }
    }

    var result = [], arranged = false;
    for (var bI = 0; bI < bands.length; bI++) {
      var band = bands[bI];
      var minGap = Infinity;
      for (var l = 0; l < band.lines.length; l++) {
        var ws = band.lines[l].items.slice().sort(function (a, z) { return cx(z) - cx(a); });
        for (var k = 1; k < ws.length; k++) {
          var g = cx(ws[k - 1]) - cx(ws[k]);
          if (g > 0 && g < minGap) minGap = g;
        }
      }
      var colGap = Math.max(6, minGap === Infinity ? 0 : minGap * 3);

      var cols = [];
      for (var l = 0; l < band.lines.length; l++) {
        var ws = band.lines[l].items.slice().sort(function (a, z) { return cx(z) - cx(a); });
        for (var k = 0; k < ws.length; k++) {
          var w = ws[k], x = w.box[0], xe = x + w.box[2], placed = null;
          for (var c = 0; c < cols.length; c++) {
            var cc = cols[c];
            var gap = x > cc.max ? x - cc.max : (xe < cc.min ? cc.min - xe : 0);
            if (gap <= colGap) { placed = cc; break; }
          }
          if (!placed) { placed = { items: [], min: x, max: xe }; cols.push(placed); }
          placed.items.push(w);
          if (x < placed.min) placed.min = x;
          if (xe > placed.max) placed.max = xe;
        }
      }

      if (cols.length > 1) { arranged = true; cols.sort(function (a, z) { return cx(z.items[0]) - cx(a.items[0]); }); }
      for (var c = 0; c < cols.length; c++)
        for (var i2 = 0; i2 < cols[c].items.length; i2++) result.push(cols[c].items[i2]);
    }

    if (!arranged) return kept;
    if (result.length !== kept.length) return kept;
    var changed = false;
    for (var i = 0; i < result.length; i++) if (result[i] !== kept[i]) { changed = true; break; }
    return changed ? result : kept;
  }

  /* ===== Ø§Ø¹ØªØ±Ø§Ø¶ fetch Ø§Ù„Ø®Ø§Øµ Ø¨Ù€ book-data.json ===== */
  var origFetch = window.fetch.bind(window);
  window.__yumoRODbg = function (k) {
    return { is: IS_ISLAMIC, gs: surahFor(k), gn: ayahData.gText ? Object.keys(ayahData.gText).length : -1 };
  };
  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : (input && input.url) || "";
    if (/\/book-data\.json(\?|$)/.test(url)) {
      return ayahP.then(function () {
        return origFetch(input, init).then(function (res) {
          if (!res.ok) return res;
          return res.text().then(function (txt) {
            try {
              var d = JSON.parse(txt);
              for (var k in d)
                if (d[k] && Array.isArray(d[k].words)) {
                  var src = d[k].words, kept = [];
                  for (var i = 0; i < src.length; i++) {
                    var t = garbleFix(src[i].text);
                    if (!keepWord(t)) continue;
                    var c = {};
                    for (var p in src[i]) c[p] = src[i][p];
                    c.text = t;
                    kept.push(c);
                  }
                  /* ØµÙØ­Ø§Øª Ø§Ù„Ø³ÙˆØ±: Ù†Ø³ØªØ®Ø¯Ù… Ø§Ù„ØªØ±ØªÙŠØ¨ Ø§Ù„Ø¹Ø§Ø¯ÙŠ Ù„Ù„ÙƒÙ„Ù…Ø§Øª ÙÙ‚Ø· (Ø¨Ø¯ÙˆÙ† Ø§Ø³ØªØ¨Ø¯Ø§Ù„Ù‡Ø§
                     Ø¨Ø±Ù‚Ø§Ø¦Ù‚ Ø°Ø§Øª ØµÙ†Ø§Ø¯ÙŠÙ‚ Ù…ÙˆØ­Ù‘Ø¯Ø© Ø¶Ø®Ù…Ø©) Ø­ØªÙ‰ Ù„Ø§ ÙŠØ¸Ù‡Ø± Ø£ÙŠ ØªØ¸Ù„ÙŠÙ„ Ø£Ø®Ø¶Ø± ØºÙŠØ±
                     Ù…ÙˆØ¬ÙˆØ¯ ÙÙŠ Ø§Ù„Ø£ØµÙ„ØŒ ÙˆÙŠØ¨Ù‚Ù‰ Ù†Ø·Ù‚ Ø§Ù„Ø¢ÙŠØ§Øª Ø³Ù„ÙŠÙ…Ù‹Ø§ Ø¹Ø¨Ø± ØªØµØ­ÙŠØ­ Ø§Ù„Ø£Ù„ÙØ§Ø¸. */
                  d[k].words = orderPage(kept);
                }
              window.__yumoReadingOrder = 1;
              return new Response(JSON.stringify(d), {
                status: 200,
                headers: { "content-type": "application/json" }
              });
            } catch (e) { return res; }
          });
        });
      });
    }
    return origFetch(input, init);
  };
})();