/* صوت الشيخ محمود خليل الحصري: صوت افتراضي للعربية والتربية الإسلامية — تلاوة الآيات من ملفات local */
(function () {
  'use strict';

  if (window.location.pathname.indexOf('/en') === 0) return;   /* الإنجليزية دون تغيير */
  if (!('speechSynthesis' in window)) return;

  var HUS = 'yomo-husary';
  var KEY = 'yomo-voice-v2';
  var BASE = '/audio/husary/';
  var map = null;      /* [{g, norm}] */
  var pA = null;       /* audio */
  var wrapped = false;
  var optTried = 0;

  function norm(s) {
    return String(s || '')
      .replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06DC\u06DF-\u06ED\u0653\u0654\u0655]/g, '')
      .replace(/[^\u0621-\u064A\u0671\s]/g, '')
      .replace(/[\u0621\u0622\u0623\u0625\u0671]/g, '\u0627')
      .replace(/\u0629/g, '\u0647')
      .replace(/\u0649/g, '\u064A')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function loadMap() {
    if (map) return;
    fetch('/books-islamic/tahfiz.json')
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) {
        var list = [];
        (d.surahs || []).forEach(function (s) {
          (s.ayahs || []).forEach(function (a) { list.push({ g: a.g, norm: norm(a.text) }); });
        });
        list.sort(function (a, b) { return b.norm.length - a.norm.length; });
        map = list;
      })
      .catch(function () {});
  }

  function findAyah(text) {
    var n = norm(text);
    if (!n) return null;
    for (var i = 0; i < map.length; i++) {
      if (n === map[i].norm) return map[i];
      if (n.indexOf(map[i].norm) === 0 && n.length - map[i].norm.length <= 6) return map[i];
    }
    return null;
  }

  function currentKey() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }

  function husActive() { var k = currentKey(); return k === '' || k === HUS; }

  function hasDeviceArabic() {
    var vs = window.speechSynthesis.getVoices() || [];
    for (var i = 0; i < vs.length; i++) if (/^ar($|-|_)/i.test(vs[i].lang || '')) return true;
    return false;
  }

  function fireEnd(utt) { try { if (utt && utt.onend) utt.onend({ utterance: utt }); } catch (e) {} }
  function fireError(utt) { try { if (utt && utt.onerror) utt.onerror({ error: 'network', utterance: utt }); } catch (e) {} }

  function stopAyah() {
    if (pA) { try { pA.pause(); } catch (e) {} pA = null; }
  }

  function playAyah(g, utt) {
    stopAyah();
    var a = new Audio(BASE + g + '.mp3');
    a.__yumoOwn = 1;
    a.playbackRate = utt && typeof utt.rate === 'number' && utt.rate ? Math.min(2, Math.max(0.5, utt.rate)) : 1;
    a.volume = utt && typeof utt.volume === 'number' ? utt.volume : 1;
    pA = a;
    a.addEventListener('ended', function () { if (pA === a) { pA = null; fireEnd(utt); } });
    a.addEventListener('error', function () { if (pA === a) { pA = null; fallback(utt); } });
    a.play().then(function () {}).catch(function () { if (pA === a) { pA = null; fallback(utt); } });
  }

  var fallbacking = null;
  function fallback(utt) {
    if (fallbacking === utt) return;
    fallbacking = utt;
    try { window.__yumoSpeakRaw(utt); } catch (e) { try { window.speechSynthesis.speak(utt); } catch (e2) {} }
    setTimeout(function () { fallbacking = null; }, 100);
  }

  /* fallback TTS عبر /api/tts بصوت عربي نسائي (زيارية) عند اختيار الحصري لنص غير قرآني بلا صوت جهاز عربي */
  var webA = null;
  function playWebZariyah(text, utt) {
    if (webA) { try { webA.pause(); } catch (e) {} }
    var url = '/api/tts?text=' + encodeURIComponent(text) + '&voice=ar-SA-ZariyahNeural';
    var a = new Audio(url);
    a.__yumoOwn = 1;
    if (utt && typeof utt.volume === 'number') a.volume = utt.volume;
    webA = a;
    a.addEventListener('ended', function () { if (webA === a) { webA = null; fireEnd(utt); } });
    a.addEventListener('error', function () { if (webA === a) { webA = null; fireError(utt); } });
    a.play().then(function () {}).catch(function () { if (webA === a) { webA = null; fireError(utt); } });
  }

  function wireSpeak() {
    if (wrapped) return;
    var ss = window.speechSynthesis;
    if (!ss || typeof ss.speak !== 'function') return;
    var raw = ss.speak;
    if (raw.__husaryWrap) { wrapped = true; return; }
    window.__yumoSpeakRaw = raw;
    function speakWrap(utt) {
      if (husActive()) {
        var t = utt && utt.text ? utt.text : '';
        if (t && map) {
          var hit = findAyah(t);
          if (hit) { playAyah(hit.g, utt); return; }
        }
        if (!t) {}
        if (currentKey() === HUS && t) { playWebZariyah(t, utt); return; }
      }
      return raw(utt);
    }
    speakWrap.__husaryWrap = 1;
    ss.speak = speakWrap;

    var oc = ss.cancel;
    if (oc && !oc.__husaryCancel) {
      var cancelWrap = function () {
        stopAyah();
        if (webA) { try { webA.pause(); } catch (e) {} webA = null; }
        return oc.call(ss);
      };
      cancelWrap.__husaryCancel = 1;
      ss.cancel = cancelWrap;
    }
    wrapped = true;
  }

  function ensureOption() {
    var sel = document.getElementById('voice-select');
    if (!sel) return;
    if (!sel.querySelector('option[value="yomo-husary"]')) {
      var opt = document.createElement('option');
      opt.value = HUS;
      opt.textContent = 'الشيخ محمود الحصري 🎙️ تلاوة (الافتراضي)';
      sel.insertBefore(opt, sel.options[1] || null);
    }
    if (husActive() && sel.value !== HUS) { sel.value = HUS; }
    if (!sel.__husaryChange) {
      sel.__husaryChange = 1;
      sel.addEventListener('change', function () {
        if (sel.value === HUS) { try { localStorage.removeItem(KEY); } catch (e) {} }
        else { window.speechSynthesis.cancel(); }
      });
    }
  }

  function tick() {
    wireSpeak();
    ensureOption();
    if (optTried++ < 10) setTimeout(tick, 1200);
  }

  loadMap();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { if (map === null) loadMap(); setTimeout(tick, 300); });
  } else {
    setTimeout(tick, 300);
  }
})();