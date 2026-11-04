// Thiệp cưới Hồng Quân & Khánh Linh: envelope intro, scroll reveals, music-paced auto-scroll,
// album lightbox, RSVP + wishes (Google Sheets), gift copy buttons.
(() => {
  'use strict';

  const C = Object.assign({ sheetUrl: '', intro: true, autoScroll: true, scrollSpeed: 80, animations: true, musicUrl: '', showLunar: true, sampleWishes: false }, window.THIEP_CONFIG || {}, window.THIEP_DEMO || {});
  const KEY = 'ql-thiep-hoathu';
  const WEDDING = new Date('2026-11-29T11:00:00+07:00').getTime();
  const EASE = 'cubic-bezier(.2,.7,.2,1)';
  const FX = {
    up: [{ opacity: 0, transform: 'translateY(36px)' }, { opacity: 1, transform: 'none' }],
    blur: [{ opacity: 0, transform: 'translateY(22px)', filter: 'blur(12px)' }, { opacity: 1, transform: 'none', filter: 'blur(0px)' }],
    left: [{ opacity: 0, transform: 'translateX(-70px) rotate(-2deg)' }, { opacity: 1, transform: 'none' }],
    right: [{ opacity: 0, transform: 'translateX(70px) rotate(2deg)' }, { opacity: 1, transform: 'none' }],
    zoom: [{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'none' }],
    pop: [{ opacity: 0, transform: 'scale(.3) rotate(-30deg)' }, { opacity: 1, transform: 'scale(1.15) rotate(6deg)', offset: 0.7 }, { opacity: 1, transform: 'none' }],
    kenburns: [{ opacity: 0, transform: 'scale(1.2)' }, { opacity: 1, transform: 'scale(1.08)', offset: 0.25 }, { opacity: 1, transform: 'none' }],
    fade: [{ opacity: 0 }, { opacity: 1 }],
    write: [{ clipPath: 'inset(-40% 100% -40% -10%)' }, { clipPath: 'inset(-40% -10% -40% -10%)' }],
    wipe: [{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)' }],
    flip: [{ opacity: 0, transform: 'perspective(1000px) rotateX(32deg) translateY(50px)' }, { opacity: 1, transform: 'none' }],
    char: [{ opacity: 0, transform: 'translateY(.55em) rotate(12deg)', filter: 'blur(5px)' }, { opacity: 1, transform: 'none', filter: 'blur(0px)' }],
  };
  const DUR = { kenburns: 3600, pop: 1100, blur: 1200, write: 2200, wipe: 1500, flip: 1200 };
  const PETALS = ['#5d6a57', '#8fa37f', '#34432f', '#c5d1b4'];
  const SIDES = { gai: 'Nhà gái · 28.11', trai: 'Nhà trai · 29.11', ca: 'Cả hai' };
  // Shown only in the Artifact demo (sampleWishes) while no Google Sheet is connected, under a note saying they are samples. Newest first.
  const SAMPLE_WISHES = [
    { name: 'Hoàng Long', msg: 'Trăm năm tình viên mãn, bạc đầu nghĩa phu thê. Chúc mừng hai bạn!', t: '02/11/2026' },
    { name: 'Cô Lan', msg: 'Chúc gia đình nhỏ của hai con luôn ấm áp, bình an và nhiều niềm vui.', t: '01/11/2026' },
    { name: 'Đức Mạnh', msg: 'Hẹn gặp hai bạn ở Đại Huệ Palace nhé. Chúc mừng hạnh phúc!', t: '31/10/2026' },
    { name: 'Chị Hà', msg: 'Linh xinh quá! Chúc em và Quân mãi yêu thương nhau như bây giờ nha.', t: '30/10/2026' },
    { name: 'Tuấn Anh', msg: 'Cuối cùng cũng đợi được ngày này. Chúc hai bạn luôn hạnh phúc như ngày đầu.', t: '29/10/2026' },
    { name: 'Minh Anh', msg: 'Chúc hai bạn trăm năm hạnh phúc, sớm có tin vui nhé!', t: '28/10/2026' },
  ];

  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const html = document.documentElement;
  const root = $('#thiep');
  const reducedMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const fxOn = C.animations !== false && !reducedMotion && typeof Element.prototype.animate === 'function';
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(KEY + ':' + k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(KEY + ':' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };

  if (C.showLunar === false) $$('.lunar').forEach(el => { el.hidden = true; });
  if (!fxOn) html.classList.add('no-fx'); // CSS-only motion (calendar pulse) follows the same switch

  // Section dividers: two vine branches meeting at a small diamond; the reveal draws them in.
  const VINE = '<svg viewBox="0 0 200 36">'
    + '<path class="vine-branch" d="M4 18 C 30 6, 54 30, 90 18"/><path class="vine-branch" d="M196 18 C 170 6, 146 30, 110 18"/>'
    + [[24, 12, -32], [46, 23, 28], [70, 16, -22], [176, 12, 32], [154, 23, -28], [130, 16, 22]]
      .map(([x, y, r]) => '<g transform="rotate(' + r + ' ' + x + ' ' + y + ')"><ellipse class="vine-leaf" cx="' + x + '" cy="' + y + '" rx="6.5" ry="2.6"/></g>').join('')
    + '<path class="vine-center" d="M100 12.5 L105.5 18 L100 23.5 L94.5 18 Z"/></svg>';
  $$('.ornament').forEach(o => { o.innerHTML = VINE; });

  // ---------- tip bubble ----------
  const tip = $('#tip');
  let tipTimer = 0;
  function flashTip(text) {
    tip.textContent = text;
    tip.hidden = false;
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => { tip.hidden = true; }, 2400);
  }

  // ---------- calendar + countdown ----------
  (function buildCalendar() {
    const cal = $('#cal-days');
    ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].forEach(w => {
      const d = document.createElement('div');
      d.className = 'cal-wd';
      d.textContent = w;
      cal.appendChild(d);
    });
    const lead = (new Date(2026, 10, 1).getDay() + 6) % 7;
    for (let i = 0; i < lead; i++) cal.appendChild(document.createElement('div'));
    for (let d = 1; d <= 30; d++) {
      const c = document.createElement('div');
      const tag = d === 28 ? 'Nhà gái' : d === 29 ? 'Nhà trai' : '';
      c.className = 'cal-d' + (d === 28 ? ' gai' : d === 29 ? ' trai' : '');
      c.textContent = d;
      if (tag) c.title = tag;
      if (d === 29) { // a small heart joining the two wedding days (28 and 29 sit side by side)
        const h = document.createElement('span');
        h.className = 'cal-heart';
        h.setAttribute('aria-hidden', 'true');
        h.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 21s-6.7-4.4-9.2-8.2C1 10.1 2.1 6.4 5.4 5.6c2-.5 3.9.3 5 2 .4.6.8.6 1.2 0 1.1-1.7 3-2.5 5-2 3.3.8 4.4 4.5 2.6 7.2C18.7 16.6 12 21 12 21z"/></svg>';
        c.appendChild(h);
      }
      cal.appendChild(c);
    }
  })();

  const cd = { d: $('[data-cd="d"]'), h: $('[data-cd="h"]'), m: $('[data-cd="m"]'), s: $('[data-cd="s"]') };
  const cdNote = $('#cd-note');
  let cdTicks = 0;
  // A digit that changes flips down like a desk calendar (not on the first fill).
  function setDigit(el, v) {
    if (el.textContent === v) return;
    el.textContent = v;
    if (fxOn && cdTicks && document.visibilityState === 'visible') el.animate([{ transform: 'perspective(320px) rotateX(-90deg)', opacity: 0.3 }, { transform: 'none', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.2,.7,.3,1.25)' });
  }
  function tickCountdown() {
    const now = Date.now(), ms = Math.max(0, WEDDING - now);
    const pad = n => String(n).padStart(2, '0');
    setDigit(cd.d, String(Math.floor(ms / 864e5)));
    setDigit(cd.h, pad(Math.floor(ms / 36e5) % 24));
    setDigit(cd.m, pad(Math.floor(ms / 6e4) % 60));
    setDigit(cd.s, pad(Math.floor(ms / 1e3) % 60));
    cdTicks++;
    cdNote.textContent = now >= WEDDING ? 'Chúng mình đã về chung một nhà ♥' : 'đến ngày chung đôi';
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  // ---------- music ----------
  const audio = $('#bgm');
  if (C.musicUrl) audio.src = C.musicUrl;
  const musicBtn = $('#music-btn');
  let playing = false, userPaused = false, musicPulse = null;
  function setPlaying(on) {
    playing = on;
    const label = on ? 'Tắt nhạc' : 'Bật nhạc';
    musicBtn.textContent = on ? '❙❙' : '♪';
    musicBtn.setAttribute('aria-label', label);
    musicBtn.title = label;
    if (musicPulse) { musicPulse.cancel(); musicPulse = null; }
    if (on && fxOn) musicPulse = musicBtn.animate([{ boxShadow: '0 0 0 0 rgba(93,106,87,.55)' }, { boxShadow: '0 0 0 18px rgba(93,106,87,0)' }], { duration: 1600, iterations: Infinity, easing: 'ease-out' });
  }
  audio.addEventListener('play', () => setPlaying(true));
  audio.addEventListener('pause', () => setPlaying(false));
  // play() must run inside a tap/click handler, or iOS and most browsers refuse it.
  function playMusic(showError) {
    const p = audio.play();
    if (p && p.catch) p.catch(() => { if (showError) flashTip('Không phát được file nhạc.'); });
  }
  musicBtn.addEventListener('click', () => {
    if (playing) { audio.pause(); userPaused = true; }
    else { userPaused = false; playMusic(true); }
  });
  // Fallback: start the music on the first tap anywhere (intro turned off, or the envelope tap was refused).
  const firstTap = (e) => {
    if (playing || userPaused) { document.removeEventListener('click', firstTap, true); return; }
    if (e.target.closest && e.target.closest('#music-btn')) return;
    playMusic(false);
  };
  document.addEventListener('click', firstTap, true);

  // ---------- envelope intro ----------
  const intro = $('#intro');
  const autoBtn = $('#auto-btn');
  let opening = false, sealPulse = null;

  function idleIntro() {
    html.classList.add('locked');
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    intro.addEventListener('click', openIntro);
    intro.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openIntro(); } });
    try { intro.focus({ preventScroll: true }); } catch (e) { /* old Safari */ }
    if (!fxOn) return;
    const q = k => $('[data-env-' + k + ']', intro);
    q('top').animate([{ opacity: 0, transform: 'translateY(24px)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 1400, easing: EASE, fill: 'backwards' });
    $('[data-env]', intro).animate([{ opacity: 0, transform: 'translateY(60px) scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 1300, delay: 500, easing: EASE, fill: 'backwards' });
    q('bottom').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: 1300, fill: 'backwards' });
    sealPulse = q('seal').animate([{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: 'translate(-50%,-50%) scale(1.08)' }, { transform: 'translate(-50%,-50%) scale(1)' }], { duration: 1800, delay: 1800, iterations: Infinity, easing: 'ease-in-out' });
    q('hint').animate([{ opacity: 1 }, { opacity: .35 }, { opacity: 1 }], { duration: 2000, delay: 1800, iterations: Infinity });
    petals($('[data-petals]', intro), 14);
  }

  function openIntro() {
    if (opening) return;
    opening = true;
    if (!userPaused) playMusic(false);
    const done = () => {
      intro.remove();
      html.classList.remove('locked');
      window.scrollTo(0, 0);
      autoBtn.hidden = false;
      requestAnimationFrame(() => { startFx(); startAuto(1600); });
    };
    if (!fxOn) { done(); return; }
    const q = k => $('[data-env-' + k + ']', intro);
    const ease = 'cubic-bezier(.65,0,.35,1)';
    if (sealPulse) sealPulse.cancel();
    q('seal').animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(1.35) rotate(-12deg)', opacity: 0 }], { duration: 450, easing: 'ease-in', fill: 'forwards' });
    sealBurst(q('seal'));
    q('flap').animate([{ transform: 'rotateX(0deg)', zIndex: 2 }, { transform: 'rotateX(180deg)', zIndex: 0 }], { duration: 800, delay: 250, easing: ease, fill: 'forwards' });
    q('card').animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-62%)' }], { duration: 900, delay: 850, easing: ease, fill: 'forwards' });
    [q('top'), q('bottom')].forEach(n => n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, delay: 300, fill: 'forwards' }));
    const out = intro.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.15)' }], { duration: 800, delay: 1750, easing: 'ease-in', fill: 'forwards' });
    setTimeout(startFx, 1450); // start the cover reveals while the envelope fades, so the cover is never blank
    out.onfinish = done;
  }

  // The seal breaks into leaves that fly out and drift down.
  function sealBurst(seal) {
    const box = intro.getBoundingClientRect(), r = seal.getBoundingClientRect();
    const cx = r.left + r.width / 2 - box.left, cy = r.top + r.height / 2 - box.top;
    const colors = ['#8fa37f', '#c5d1b4', '#5f7853', '#dfe7cd'];
    for (let i = 0; i < 24; i++) {
      const p = document.createElement('span');
      const sz = 8 + Math.random() * 8, a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 120, rot = (Math.random() - 0.5) * 720;
      Object.assign(p.style, { position: 'absolute', left: (cx - sz / 2) + 'px', top: (cy - sz * 0.7) + 'px', width: sz + 'px', height: (sz * 1.4) + 'px', background: colors[i % colors.length], borderRadius: '80% 0 80% 0', pointerEvents: 'none', zIndex: '4' });
      intro.appendChild(p);
      const tx = Math.cos(a) * d, ty = Math.sin(a) * d;
      p.animate([
        { transform: 'translate(0,0) rotate(0deg) scale(.4)', opacity: 1 },
        { transform: 'translate(' + (tx * 0.75).toFixed(0) + 'px,' + (ty * 0.75).toFixed(0) + 'px) rotate(' + (rot / 2).toFixed(0) + 'deg) scale(1)', opacity: 1, offset: 0.45 },
        { transform: 'translate(' + tx.toFixed(0) + 'px,' + (ty + 90).toFixed(0) + 'px) rotate(' + rot.toFixed(0) + 'deg) scale(.8)', opacity: 0 },
      ], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.15,.6,.3,1)', fill: 'forwards' });
    }
  }

  // ---------- reveals, petals, parallax, progress ----------
  let fxStarted = false;
  function startFx() { if (!fxStarted) { fxStarted = true; initFx(); } }

  function initFx() {
    const bar = $('[data-progress]');
    const slow = $$('[data-parallax="slow"]', root);
    let pending = new Map(), io = null, sweep = null;

    if (fxOn) {
      const mk = (el, kf, dur, st) => { const a = el.animate(kf, { duration: dur, easing: EASE, fill: 'both' }); a.pause(); a._st = st || 0; return a; };
      // Headings with data-split rise letter by letter.
      $$('[data-split]', root).forEach(el => {
        const anims = [];
        Array.from(el.childNodes).forEach(n => {
          if (n.nodeType !== 3 || !n.data.trim()) return;
          const frag = document.createDocumentFragment();
          n.data.normalize('NFC').split(/(\s+)/).forEach(word => {
            if (!word) return;
            if (/^\s+$/.test(word)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.style.cssText = 'display:inline-block; white-space:nowrap;';
            Array.from(word).forEach(ch => {
              const c = document.createElement('span');
              c.textContent = ch;
              c.style.display = 'inline-block';
              w.appendChild(c);
              anims.push(mk(c, FX.char, 900, anims.length * 45));
            });
            frag.appendChild(w);
          });
          el.insertBefore(frag, n);
          n.data = '';
        });
        if (anims.length) pending.set(el, anims);
      });
      $$('[data-reveal]', root).forEach(el => {
        const k = el.getAttribute('data-reveal');
        if (k === 'vine') { // draw both branches from their outer ends, then leaves and the diamond pop in
          const parts = [];
          $$('.vine-branch', el).forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; parts.push(mk(p, [{ strokeDashoffset: L }, { strokeDashoffset: 0 }], 1400)); });
          $$('.vine-leaf', el).forEach((l, i) => parts.push(mk(l, [{ opacity: 0, transform: 'scale(0)' }, { opacity: 0.85, transform: 'scale(1.2)', offset: 0.7 }, { opacity: 0.85, transform: 'none' }], 550, 250 + (i % 3) * 300)));
          $$('.vine-center', el).forEach(c => parts.push(mk(c, [{ opacity: 0, transform: 'scale(0) rotate(-90deg)' }, { opacity: 1, transform: 'none' }], 600, 1150)));
          pending.set(el, parts);
          return;
        }
        const list = [mk(el, FX[k] || FX.up, DUR[k] || 1000)];
        if (k === 'wipe') { const im = $('img', el); if (im) list.push(mk(im, [{ transform: 'scale(1.3)' }, { transform: 'none' }], 2200)); }
        pending.set(el, list);
      });
      const fire = (el, list, delay) => {
        pending.delete(el);
        if (io) io.unobserve(el);
        list.forEach(a => { a.effect.updateTiming({ delay: delay + a._st }); a.onfinish = () => a.cancel(); a.play(); });
      };
      io = new IntersectionObserver(entries => {
        let i = 0;
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          const list = pending.get(en.target);
          if (list) fire(en.target, list, +(en.target.getAttribute('data-delay') || 0) + (i++) * 110);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      pending.forEach((_, el) => io.observe(el));
      // Fast scrolling can skip past elements before the observer fires: reveal anything above the fold line.
      sweep = (all) => {
        const vh = window.innerHeight || 800;
        let i = 0;
        pending.forEach((list, el) => {
          const r = el.getBoundingClientRect();
          if (all || r.top < vh * 0.94) fire(el, list, all ? 0 : +(el.getAttribute('data-delay') || 0) + (i++) * 80);
        });
      };
      setTimeout(() => sweep(false), 1200);
      setTimeout(() => { if (document.visibilityState === 'hidden') sweep(true); }, 2500);

      $$('[data-petals]', root).forEach(c => petals(c, +c.getAttribute('data-petals') || 12));
      $$('[data-marquee]', root).forEach(m => m.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: +m.getAttribute('data-marquee') || 30000, iterations: Infinity }));
      $$('[data-spin]', root).forEach(el => el.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 16000, iterations: Infinity }));
      $$('[data-bob]', root).forEach(b => b.animate([{ transform: 'translateY(0)', opacity: 0.3 }, { transform: 'translateY(10px)', opacity: 1 }, { transform: 'translateY(0)', opacity: 0.3 }], { duration: 2200, iterations: Infinity, easing: 'ease-in-out' }));
    }

    let raf = 0;
    const run = () => {
      raf = 0;
      if (sweep && pending.size) sweep(false);
      const rr = root.getBoundingClientRect(), vh = window.innerHeight || 800;
      if (fxOn) slow.forEach(el => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        el.style.transform = 'translateY(' + ((r.top + r.height / 2 - vh / 2) * -0.14).toFixed(1) + 'px)';
      });
      bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, -rr.top / Math.max(1, rr.height - vh))).toFixed(4) + ')';
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(run); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    run();
  }

  function petals(c, n) {
    if (!c || !fxOn) return;
    const H = c.clientHeight || 800;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      const sz = 7 + Math.random() * 9;
      Object.assign(p.style, { position: 'absolute', top: '-28px', left: (Math.random() * 100).toFixed(1) + '%', width: sz + 'px', height: (sz * 1.35) + 'px', background: PETALS[i % PETALS.length], borderRadius: '80% 0 80% 0', opacity: String(0.4 + Math.random() * 0.4) });
      c.appendChild(p);
      const dx = (Math.random() - 0.5) * 180, dur = 10000 + Math.random() * 9000, rot = 300 + Math.random() * 400;
      p.animate([
        { transform: 'translate(0,0) rotate(0deg)' },
        { transform: 'translate(' + (dx * 0.6).toFixed(0) + 'px,' + (H * 0.5).toFixed(0) + 'px) rotate(' + (rot / 2).toFixed(0) + 'deg)', offset: 0.5 },
        { transform: 'translate(' + dx.toFixed(0) + 'px,' + (H + 60).toFixed(0) + 'px) rotate(' + rot.toFixed(0) + 'deg)' },
      ], { duration: dur, delay: -Math.random() * dur, iterations: Infinity, easing: 'linear' });
    }
  }

  function burst() {
    if (!fxOn) return;
    const btn = $('[data-submit]');
    const r = btn.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const layer = document.createElement('div');
    Object.assign(layer.style, { position: 'fixed', left: '0', top: '0', right: '0', bottom: '0', pointerEvents: 'none', zIndex: '90', overflow: 'hidden' });
    document.body.appendChild(layer);
    const n = 40;
    let finished = 0;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      const sz = 8 + Math.random() * 10;
      Object.assign(p.style, { position: 'absolute', left: (cx - sz / 2) + 'px', top: (cy - sz / 2) + 'px', width: sz + 'px', height: (sz * 1.3) + 'px', background: PETALS[i % PETALS.length], borderRadius: i % 3 ? '80% 0 80% 0' : '50%' });
      layer.appendChild(p);
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3, dist = 100 + Math.random() * 180;
      const tx = Math.cos(ang) * dist, ty = Math.sin(ang) * dist, rot = (Math.random() - 0.5) * 900;
      p.animate([
        { transform: 'translate(0,0) scale(.3) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + tx.toFixed(0) + 'px,' + ty.toFixed(0) + 'px) scale(1) rotate(' + (rot / 2).toFixed(0) + 'deg)', opacity: 1, offset: 0.4 },
        { transform: 'translate(' + (tx * 1.25).toFixed(0) + 'px,' + (ty + 260).toFixed(0) + 'px) scale(.8) rotate(' + rot.toFixed(0) + 'deg)', opacity: 0 },
      ], { duration: 1500 + Math.random() * 700, easing: 'cubic-bezier(.15,.6,.3,1)', fill: 'forwards' }).onfinish = () => { if (++finished === n) layer.remove(); };
    }
  }

  // ---------- auto-scroll paced to the song ----------
  let auto = null;
  function setAutoUI(on, paused) {
    const label = on ? (paused ? 'Tự cuộn đang tạm dừng' : 'Dừng tự cuộn') : 'Bật tự cuộn';
    autoBtn.textContent = on && !paused ? '❙❙' : '⇣';
    autoBtn.setAttribute('aria-label', label);
    autoBtn.title = label;
  }
  function onUserScroll(e) {
    if (!auto || !auto.on) return;
    if (e && e.target && e.target.closest && e.target.closest('#auto-btn, #music-btn')) return;
    if (e && e.type === 'keydown' && !/^(Arrow|Page|Home|End| )/.test(e.key)) return;
    auto.resumeAt = performance.now() + 6000; // resume after 6 s without input
    auto.acc = null;
    if (!auto.paused) { auto.paused = true; setAutoUI(true, true); }
  }
  const USER_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
  const speed = Math.min(400, Math.max(20, +C.scrollSpeed || 80)); // px per second
  function startAuto(delay) {
    if (C.autoScroll === false) return;
    stopAuto(true);
    auto = { on: true, paused: false, last: 0, acc: null, resumeAt: performance.now() + (delay || 0), raf: 0 };
    setAutoUI(true, false);
    USER_EVENTS.forEach(t => window.addEventListener(t, onUserScroll, { passive: true, capture: true }));
    const se = document.scrollingElement || html;
    const tick = (now) => {
      const A = auto;
      if (!A || !A.on) return;
      A.raf = requestAnimationFrame(tick);
      const dt = A.last ? Math.min(0.1, (now - A.last) / 1000) : 0;
      A.last = now;
      const ae = document.activeElement;
      const busy = lbIndex >= 0 || (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName));
      if (busy || now < A.resumeAt) { A.acc = null; return; }
      if (A.paused) { A.paused = false; setAutoUI(true, false); }
      const max = se.scrollHeight - window.innerHeight, y = window.scrollY || se.scrollTop;
      if (A.acc === null) A.acc = y;
      if (max - A.acc <= 1) { stopAuto(); return; }
      // One fixed speed for the whole page, so the scroll stays even.
      A.acc = Math.min(max, A.acc + speed * dt);
      window.scrollTo(0, A.acc);
    };
    auto.raf = requestAnimationFrame(tick);
  }
  function stopAuto(silent) {
    if (auto) { cancelAnimationFrame(auto.raf); auto.on = false; }
    USER_EVENTS.forEach(t => window.removeEventListener(t, onUserScroll, { capture: true }));
    if (!silent) setAutoUI(false, false);
  }
  autoBtn.addEventListener('click', () => {
    if (auto && auto.on) { stopAuto(); return; }
    const se = document.scrollingElement || html;
    if (se.scrollHeight - window.innerHeight - (window.scrollY || 0) < 40) window.scrollTo(0, 0);
    startAuto(0);
  });

  // Floating RSVP pill: hidden while the form is on screen; after sending it reopens the form to edit.
  const dockRsvp = $('#dock-rsvp');
  dockRsvp.addEventListener('click', e => {
    e.preventDefault();
    if (!$('#rsvp-thanks').hidden) $('#rsvp-edit').click();
    $('#hoi-am').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => entries.forEach(en => dockRsvp.classList.toggle('is-away', en.isIntersecting)),
      { rootMargin: '0px 0px -35% 0px' }).observe($('#hoi-am'));
  }

  // "Thêm vào lịch": iPhone and iPad open the .ics in the Calendar app; other devices use Google Calendar.
  if (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    $$('[data-ics]').forEach(a => { a.href = a.getAttribute('data-ics'); a.removeAttribute('target'); });
  }

  // ---------- album lightbox ----------
  const tiles = $$('#album [data-full]');
  const PHOTOS = tiles.map(t => t.getAttribute('data-full'));
  const lightbox = $('#lightbox'), lbImg = $('#lb-img'), lbCount = $('#lb-count');
  let lbIndex = -1, lbReturn = null;
  function showPhoto(i) {
    const first = lbIndex < 0;
    lbIndex = (i + PHOTOS.length) % PHOTOS.length;
    lbImg.src = PHOTOS[lbIndex];
    lbCount.textContent = (lbIndex + 1) + ' / ' + PHOTOS.length;
    if (first) {
      lbReturn = document.activeElement;
      lightbox.hidden = false;
      try { $('#lb-close').focus({ preventScroll: true }); } catch (e) { /* old Safari */ }
    }
    if (fxOn) lbImg.animate([{ opacity: 0, transform: 'scale(.95)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: EASE });
  }
  function closeLightbox() {
    if (lbIndex < 0) return;
    lbIndex = -1;
    lightbox.hidden = true;
    if (lbReturn && lbReturn.focus) try { lbReturn.focus({ preventScroll: true }); } catch (e) { /* old Safari */ }
  }
  tiles.forEach((t, i) => t.addEventListener('click', () => showPhoto(i)));
  lightbox.addEventListener('click', closeLightbox);
  lbImg.addEventListener('click', e => e.stopPropagation());
  $('#lb-prev').addEventListener('click', e => { e.stopPropagation(); showPhoto(lbIndex - 1); });
  $('#lb-next').addEventListener('click', e => { e.stopPropagation(); showPhoto(lbIndex + 1); });
  $('#lb-close').addEventListener('click', e => { e.stopPropagation(); closeLightbox(); });
  let swipeX = null;
  lightbox.addEventListener('touchstart', e => { swipeX = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    if (swipeX === null) return;
    const dx = e.changedTouches[0].clientX - swipeX;
    swipeX = null;
    if (Math.abs(dx) > 50) { e.preventDefault(); showPhoto(lbIndex + (dx < 0 ? 1 : -1)); }
  });
  window.addEventListener('keydown', e => {
    if (lbIndex < 0) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowRight') showPhoto(lbIndex + 1);
    else if (e.key === 'ArrowLeft') showPhoto(lbIndex - 1);
  });

  // ---------- RSVP + wishes ----------
  // Each browser keeps one guest ID: sending again from the same browser edits the same rows in the sheet.
  const guestId = (() => {
    let id = store.get('id');
    if (typeof id !== 'string' || !/^[A-Za-z0-9][\w-]{7,63}$/.test(id)) {
      id = window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
      store.set('id', id);
    }
    return id;
  })();
  const form = $('#rsvp-form'), nameIn = $('#rsvp-name'), msgIn = $('#rsvp-msg'), errEl = $('#rsvp-err');
  const submitBtn = $('[data-submit]', form), thanks = $('#rsvp-thanks');
  const rsvp = { attend: 'yes', side: 'trai', guests: 1, sending: false, sent: false };
  let wishes = [];

  function today() {
    const d = new Date(), pad = n => String(n).padStart(2, '0');
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
  }
  function renderForm() {
    $$('[data-attend]', form).forEach(b => b.setAttribute('aria-pressed', String(b.getAttribute('data-attend') === rsvp.attend)));
    $$('[data-side]', form).forEach(b => b.setAttribute('aria-pressed', String(b.getAttribute('data-side') === rsvp.side)));
    $('#rsvp-attending').hidden = rsvp.attend !== 'yes';
    $('#rsvp-guests').textContent = rsvp.guests;
    submitBtn.textContent = rsvp.sending ? 'Đang gửi…' : rsvp.sent ? 'Cập nhật hồi âm' : 'Gửi hồi âm';
    submitBtn.disabled = rsvp.sending;
    dockRsvp.textContent = rsvp.sent ? 'Sửa hồi âm' : 'Xác nhận tham dự';
  }
  function setErr(text) { errEl.textContent = text; errEl.hidden = !text; }
  function showThanks(r, animate) {
    $('#thanks-title').textContent = r.attend === 'yes' ? 'Yay! Hẹn gặp ' + r.name + ' nhé.' : 'Cảm ơn ' + r.name + ' đã báo tin.';
    $('#thanks-body').textContent = r.attend === 'yes' ? r.guests + ' người · ' + (SIDES[r.side] || '') : 'Chúng mình đã nhận được lời nhắn của bạn.';
    $('#thanks-note').textContent = (r.msg ? 'Lời chúc của bạn đã hiện trong khung lời chúc bên dưới. ' : '') + 'Nếu cần đổi gì, bạn bấm "Sửa hồi âm" trên trình duyệt này nhé.';
    form.hidden = true;
    thanks.hidden = false;
    if (animate && fxOn) thanks.animate(FX.blur, { duration: 900, easing: EASE });
  }

  form.addEventListener('click', e => {
    const b = e.target.closest('button[type="button"]');
    if (!b) return;
    if (b.hasAttribute('data-attend')) rsvp.attend = b.getAttribute('data-attend');
    else if (b.hasAttribute('data-side')) rsvp.side = b.getAttribute('data-side');
    else if (b.hasAttribute('data-step')) rsvp.guests = Math.min(10, Math.max(1, rsvp.guests + +b.getAttribute('data-step')));
    else if (b.hasAttribute('data-emoji')) { insertEmoji(b.getAttribute('data-emoji')); return; }
    renderForm();
  });
  // Quick emoji buttons (phone keyboards have emoji anyway; this helps on computers).
  let caret = null; // where the guest last left the cursor in the wish box
  ['keyup', 'click', 'select', 'input'].forEach(t => msgIn.addEventListener(t, () => { caret = [msgIn.selectionStart, msgIn.selectionEnd]; }));
  function insertEmoji(emoji) {
    const [a, b] = caret || [msgIn.value.length, msgIn.value.length];
    if (msgIn.value.length - (b - a) + emoji.length > msgIn.maxLength) return;
    msgIn.setRangeText(emoji, a, b, 'end');
    caret = [msgIn.selectionStart, msgIn.selectionEnd];
  }
  nameIn.addEventListener('input', () => setErr(''));
  $('#rsvp-edit').addEventListener('click', () => { thanks.hidden = true; form.hidden = false; nameIn.focus(); });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = nameIn.value.trim();
    if (!name) { setErr('Bạn cho chúng mình xin tên nhé.'); nameIn.focus(); return; }
    const msg = msgIn.value.trim();
    const r = { name, attend: rsvp.attend, side: rsvp.side, guests: rsvp.guests, msg };
    const done = () => {
      const edited = rsvp.sent;
      rsvp.sent = true;
      store.set('rsvp', r);
      setErr('');
      if (!edited) burst();
      showThanks(r, true);
      setMine(msg ? { name, msg, t: today() } : null);
      renderForm();
    };
    // No sheet configured: keep everything in this browser (for trying the card out).
    if (!C.sheetUrl) { done(); return; }
    if (rsvp.sending) return;
    rsvp.sending = true;
    setErr('');
    renderForm();
    // Apps Script answers with a redirect, so the POST is fire-and-forget (opaque response): network success = sent.
    fetch(C.sheetUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ id: guestId, hp: $('#rsvp-hp').value, ms: Math.round(performance.now()) }, r)) })
      .then(() => { rsvp.sending = false; done(); })
      .catch(() => {
        rsvp.sending = false;
        renderForm();
        setErr('Chưa gửi được, bạn kiểm tra mạng rồi thử lại nhé.');
      });
  });

  // Wishes: a white guestbook, newest first. Each wish is a small card "placed down" as it scrolls into view.
  const book = $('#wishes'), bookList = $('#wishes-track'), moreBtn = $('#wishes-more');
  const PAGE = 6;
  const EMOJI = /(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}|\p{Emoji_Modifier})*)/u;
  let shown = PAGE;

  function el(cls, text) {
    const d = document.createElement('div');
    d.className = cls;
    if (text) d.textContent = text;
    return d;
  }
  function noteEl(w) {
    const card = document.createElement('article');
    card.className = 'note' + (w.mine ? ' is-mine' : '');
    card.setAttribute('role', 'listitem');
    let h = 0;
    for (const ch of w.name + w.msg) h = (h * 31 + ch.codePointAt(0)) >>> 0;
    card._tilt = ((h % 13) - 6) / 10; // a steady -0.6°..0.6° tilt, like cards laid by hand
    card.style.transform = 'rotate(' + card._tilt + 'deg)';
    if (w.mine) card.appendChild(el('note-mine', 'Lời chúc của bạn'));
    const msg = document.createElement('p');
    msg.className = 'note-msg';
    msg.append('“');
    String(w.msg).split(EMOJI).forEach((part, k) => {
      if (!part) return;
      if (k % 2) { const e = document.createElement('span'); e.className = 'emo'; e.textContent = part; msg.appendChild(e); }
      else msg.append(part);
    });
    msg.append('”');
    const foot = el('note-foot');
    foot.append(el('note-date', w.t || ''), el('note-sig', w.name));
    card.append(msg, foot);
    return card;
  }
  function placeNote(card, delay) {
    card.classList.remove('is-pending');
    if (!fxOn) return;
    const r = card._tilt;
    card.animate([{ opacity: 0, transform: 'translateY(36px) rotate(' + (r - 4) + 'deg) scale(.96)' }, { opacity: 1, transform: 'rotate(' + r + 'deg)' }], { duration: 900, delay, easing: EASE, fill: 'backwards' });
  }
  const noteIO = fxOn && 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    let i = 0;
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      noteIO.unobserve(en.target);
      placeNote(en.target, (i++) * 180);
    });
  }, { threshold: 0.15 }) : null;
  function addNote(w) {
    const card = noteEl(w);
    if (noteIO) { card.classList.add('is-pending'); noteIO.observe(card); }
    bookList.appendChild(card);
  }
  const showSamples = !C.sheetUrl && C.sampleWishes;
  function allWishes() { return showSamples ? wishes.concat(SAMPLE_WISHES) : wishes; }
  function updateMore(total) {
    const rest = total - Math.min(shown, total);
    moreBtn.hidden = rest <= 0;
    moreBtn.textContent = 'Xem thêm ' + Math.min(PAGE, rest) + ' lời chúc';
  }
  function renderWishes() {
    const list = allWishes();
    book.hidden = !list.length;
    $('#wishes-demo').hidden = !showSamples;
    $('#wishes-count').textContent = list.length + ' lời chúc';
    bookList.textContent = '';
    list.slice(0, shown).forEach(addNote);
    updateMore(list.length);
  }
  moreBtn.addEventListener('click', () => {
    const list = allWishes();
    list.slice(shown, shown + PAGE).forEach(addNote);
    shown += PAGE;
    updateMore(list.length);
  });
  // The guest's own wish is tagged "Lời chúc của bạn"; sending again edits or removes it.
  function setMine(w) {
    const i = wishes.findIndex(x => x.mine);
    if (w) {
      w.mine = true;
      if (i >= 0) wishes[i] = Object.assign({}, wishes[i], { name: w.name, msg: w.msg });
      else { wishes.unshift(w); shown++; } // the new card takes a slot at the top
    } else if (i >= 0) {
      wishes.splice(i, 1);
      if (i < shown) shown--;
    }
    if (!C.sheetUrl) store.set('wishes', wishes);
    const total = allWishes().length;
    book.hidden = !total;
    $('#wishes-count').textContent = total + ' lời chúc';
    updateMore(total);
    const old = $('.note.is-mine', bookList);
    if (!w) { if (old) old.remove(); return; }
    const card = noteEl(wishes[i >= 0 ? i : 0]);
    if (old) old.replaceWith(card);
    else bookList.prepend(card);
    placeNote(card, 0);
  }

  function loadWishes() {
    if (!C.sheetUrl) {
      const saved = store.get('wishes');
      wishes = Array.isArray(saved) ? saved : [];
      renderWishes();
      return;
    }
    fetch(C.sheetUrl + (C.sheetUrl.indexOf('?') < 0 ? '?' : '&') + 'action=wishes&me=' + encodeURIComponent(guestId) + '&_=' + Date.now())
      .then(r => r.json())
      .then(list => {
        if (!Array.isArray(list)) return;
        wishes = list.filter(w => w && w.name && w.msg).slice(0, 300);
        renderWishes();
      })
      .catch(() => { /* wishes are a bonus; the card works without them */ });
  }

  const saved = store.get('rsvp');
  if (saved && saved.name) {
    rsvp.attend = saved.attend === 'no' ? 'no' : 'yes';
    rsvp.side = SIDES[saved.side] ? saved.side : 'trai';
    rsvp.guests = Math.min(10, Math.max(1, +saved.guests || 1));
    rsvp.sent = true;
    nameIn.value = saved.name;
    msgIn.value = saved.msg || '';
    showThanks(Object.assign({}, rsvp, { name: saved.name, msg: saved.msg || '' }), false);
  }
  renderForm();
  loadWishes();

  // ---------- gift: copy account number ----------
  $$('[data-copy]').forEach(btn => btn.addEventListener('click', () => {
    const num = btn.getAttribute('data-copy');
    const done = () => {
      btn.textContent = 'Đã sao chép ✓';
      clearTimeout(btn._t);
      btn._t = setTimeout(() => { btn.textContent = 'Sao chép số TK'; }, 2400);
    };
    const selectNumber = () => {
      const el = $('.gift-num', btn.parentElement);
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { /* unsupported */ }
      if (ok) done(); else flashTip('Đã chọn số tài khoản, bạn bấm Sao chép nhé.');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(num).then(done, selectNumber);
    else selectNumber();
  }));

  // ---------- boot ----------
  if (C.intro === false) {
    intro.remove();
    autoBtn.hidden = false;
    startFx();
  } else {
    idleIntro();
  }
})();
