/* ==========================================================================
   MechaStudy - CHẶNG 5: LỚP GIAO DIỆN (màu sắc, nút bấm, hiệu ứng)
   - Chỉ thay đổi hình thức; KHÔNG sửa logic của các chặng khác.
   - Nếu muốn quay về giao diện cũ: xóa dòng <script src="stage5.js"> trong index.html,
     hoặc chọn bảng màu "Xanh gốc" ở nút 🎨 trên thanh đầu trang.
   ========================================================================== */
(function () {
  'use strict';

  const PALETTE_KEY = 'mecha_palette';
  const DEFAULT_PALETTE = 'warm';
  const PALETTES = [
    { id: 'warm',    name: 'Giấy ấm',   swatch: '#c2562f' },
    { id: 'forest',  name: 'Rêu xanh',  swatch: '#2f7d57' },
    { id: 'coral',   name: 'Hoàng hôn', swatch: '#d6456b' },
    { id: 'ocean',   name: 'Biển',      swatch: '#0e8a9a' },
    { id: 'classic', name: 'Xanh gốc',  swatch: '#2563eb' }
  ];

  /* ------------------------------------------------------------------------
     1. BẢNG MÀU (ghi đè các biến CSS mà mọi chặng đều dùng)
     ------------------------------------------------------------------------ */
  const CSS_PALETTES = `
    /* --- Giấy ấm: kem, nâu, đất nung --- */
    :root[data-palette="warm"] {
      --bg-main:#fbf6ef; --bg-panel:#fffdfa; --bg-sidebar:#f5ece0; --text-main:#3a2e28; --text-muted:#85756a;
      --border:#e8dccb; --primary:#c2562f; --primary-hover:#a64524; --danger:#c0392b; --success:#4d8b4a; --warning:#c9811a;
      --shadow:0 8px 22px -12px rgba(94,60,30,.35); --radius:12px;
    }
    :root[data-palette="warm"][data-theme="dark"] {
      --bg-main:#1d1713; --bg-panel:#28201a; --bg-sidebar:#221b16; --text-main:#f6ece1; --text-muted:#b9a797;
      --border:#43352b; --primary:#e57e53; --primary-hover:#f0966f; --danger:#ef6b5b; --success:#7fc27b; --warning:#e7a53f;
      --shadow:0 8px 22px -12px rgba(0,0,0,.6);
    }
    /* --- Rêu xanh --- */
    :root[data-palette="forest"] {
      --bg-main:#f3f7f1; --bg-panel:#fbfdf9; --bg-sidebar:#e8f0e4; --text-main:#20301f; --text-muted:#667a62;
      --border:#d7e3d1; --primary:#2f7d57; --primary-hover:#256646; --danger:#c0392b; --success:#2f7d57; --warning:#b9801a;
      --shadow:0 8px 22px -12px rgba(30,70,45,.35); --radius:12px;
    }
    :root[data-palette="forest"][data-theme="dark"] {
      --bg-main:#121a15; --bg-panel:#1a241e; --bg-sidebar:#161f19; --text-main:#e9f3ea; --text-muted:#9db39f;
      --border:#2c3d31; --primary:#52b585; --primary-hover:#6fc79c; --danger:#ef6b5b; --success:#6fcf97; --warning:#e5a83c;
      --shadow:0 8px 22px -12px rgba(0,0,0,.6);
    }
    /* --- Hoàng hôn: hồng san hô --- */
    :root[data-palette="coral"] {
      --bg-main:#fdf5f6; --bg-panel:#fffafb; --bg-sidebar:#f9e9ed; --text-main:#3b2430; --text-muted:#8a6b77;
      --border:#efd6dd; --primary:#d6456b; --primary-hover:#b8345a; --danger:#c0392b; --success:#3f8f62; --warning:#c9811a;
      --shadow:0 8px 22px -12px rgba(120,40,70,.35); --radius:12px;
    }
    :root[data-palette="coral"][data-theme="dark"] {
      --bg-main:#1c1418; --bg-panel:#271c22; --bg-sidebar:#21171c; --text-main:#f8e9ee; --text-muted:#bda3ad;
      --border:#43303a; --primary:#f06b90; --primary-hover:#f58aa8; --danger:#ef6b5b; --success:#76c795; --warning:#e7a53f;
      --shadow:0 8px 22px -12px rgba(0,0,0,.6);
    }
    /* --- Biển: xanh ngọc --- */
    :root[data-palette="ocean"] {
      --bg-main:#f1f8f9; --bg-panel:#fbfeff; --bg-sidebar:#e3f0f2; --text-main:#17323a; --text-muted:#5f7f88;
      --border:#d2e5e8; --primary:#0e8a9a; --primary-hover:#0a6f7d; --danger:#c0392b; --success:#2f8f62; --warning:#c9811a;
      --shadow:0 8px 22px -12px rgba(10,80,95,.35); --radius:12px;
    }
    :root[data-palette="ocean"][data-theme="dark"] {
      --bg-main:#0f191c; --bg-panel:#16242a; --bg-sidebar:#122026; --text-main:#e6f4f6; --text-muted:#98b5bc;
      --border:#274149; --primary:#35b8c9; --primary-hover:#5acbd9; --danger:#ef6b5b; --success:#6fcf97; --warning:#e5a83c;
      --shadow:0 8px 22px -12px rgba(0,0,0,.6);
    }
  `;

  /* ------------------------------------------------------------------------
     2. NÚT BẤM, Ô NHẬP, THẺ, HỘP THOẠI, HIỆU ỨNG
     ------------------------------------------------------------------------ */
  const CSS_COMPONENTS = `
    :root { --s5-ease: cubic-bezier(.2,.8,.2,1); }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'Be Vietnam Pro', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      transition: background-color .3s var(--s5-ease), color .3s var(--s5-ease);
    }
    * { scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--text-muted) 45%, transparent) transparent; }
    *::-webkit-scrollbar { width: 9px; height: 9px; }
    *::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--text-muted) 40%, transparent); border-radius: 9px; }
    *::-webkit-scrollbar-track { background: transparent; }
    ::selection { background: color-mix(in srgb, var(--primary) 30%, transparent); }

    /* Thanh đầu trang */
    header {
      background: color-mix(in srgb, var(--bg-panel) 85%, transparent);
      -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
      box-shadow: 0 1px 0 var(--border), 0 10px 24px -18px rgba(0,0,0,.35);
    }
    .brand { font-weight: 800; letter-spacing: .2px; }
    .status-pill {
      position: relative;
      transition: border-color .2s, box-shadow .2s;
      background: color-mix(in srgb, var(--bg-sidebar) 80%, var(--bg-panel));
    }
    .status-pill:hover { box-shadow: 0 4px 12px -8px rgba(0,0,0,.4); }
    .status-pill.s5-quota { padding-bottom: 8px; }
    .status-pill.s5-quota::after {
      content: ''; position: absolute; left: 12px; right: 12px; bottom: 3px; height: 3px; border-radius: 3px;
      background: linear-gradient(90deg, var(--s5-q-color, var(--primary)) calc(var(--s5-q, 0) * 100%),
        color-mix(in srgb, var(--border) 85%, transparent) 0);
      transition: background .4s var(--s5-ease);
    }

    /* Nút bấm */
    button {
      font-family: inherit; font-weight: 600; border-radius: 10px;
      transition: transform .15s var(--s5-ease), box-shadow .2s, background .2s, border-color .2s, color .2s, opacity .2s;
    }
    button:not(:disabled):hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 16px -10px rgba(0,0,0,.45);
      border-color: var(--primary);
    }
    button:not(:disabled):active { transform: translateY(0) scale(.97); box-shadow: none; }
    button:focus-visible, a:focus-visible, summary:focus-visible {
      outline: 2px solid var(--primary); outline-offset: 2px;
    }
    button:disabled { opacity: .55; cursor: not-allowed; }
    button.btn-primary, .s2-btn-anim.s4-has-anim {
      background: linear-gradient(135deg, var(--primary), var(--primary-hover));
      border-color: transparent; color: #fff;
      box-shadow: 0 6px 14px -8px color-mix(in srgb, var(--primary) 80%, #000);
    }
    button.btn-primary:not(:disabled):hover, .s2-btn-anim.s4-has-anim:not(:disabled):hover {
      border-color: transparent; filter: brightness(1.06);
      box-shadow: 0 10px 20px -10px color-mix(in srgb, var(--primary) 85%, #000);
    }
    button.btn-danger { box-shadow: 0 6px 14px -8px color-mix(in srgb, var(--danger) 80%, #000); }
    .s2-btn-anim:not(.s4-has-anim) {
      background: color-mix(in srgb, var(--primary) 12%, var(--bg-panel));
      color: var(--primary); border-color: color-mix(in srgb, var(--primary) 40%, var(--border));
    }

    /* Ô nhập */
    input, select, textarea { font-family: inherit; transition: border-color .2s, box-shadow .2s, background .2s; }
    input:focus, select:focus, textarea:focus {
      outline: none; border-color: var(--primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 22%, transparent);
    }
    input::placeholder, textarea::placeholder { color: color-mix(in srgb, var(--text-muted) 70%, transparent); }

    /* Thẻ */
    .card, .s2-card, .s3-panel {
      border-radius: 16px; box-shadow: var(--shadow);
      transition: box-shadow .25s var(--s5-ease), transform .25s var(--s5-ease), border-color .25s;
    }
    .s3-item-card { border-radius: 14px; transition: transform .2s var(--s5-ease), box-shadow .2s, border-color .2s; }
    .s3-item-card:hover {
      transform: translateY(-2px); box-shadow: var(--shadow);
      border-color: color-mix(in srgb, var(--primary) 45%, var(--border));
    }
    @keyframes s5-fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
    main#main-content .card, main#main-content .s2-card, main#main-content .s3-panel, main#main-content .s3-item-card {
      animation: s5-fade-up .4s var(--s5-ease) both;
    }

    /* Khu vực kéo thả file */
    .s2-dropzone { border-radius: 16px; transition: background .2s, border-color .2s, transform .2s var(--s5-ease); }
    .s2-dropzone:hover { background: color-mix(in srgb, var(--primary) 6%, var(--bg-panel)); border-color: var(--primary); }
    .s2-dropzone.s2-dragover { transform: scale(1.01); border-color: var(--primary);
      background: color-mix(in srgb, var(--primary) 12%, var(--bg-panel)); }

    /* Thanh bên: chương, môn, thẻ */
    .s3-chap-item { border-radius: 10px; transition: background .15s, transform .15s var(--s5-ease), box-shadow .15s; }
    .s3-chap-item:not(.s3-active):hover { transform: translateX(3px); }
    .s3-subj-group { border-radius: 14px; overflow: hidden; }
    .s3-subj-header { transition: background .15s, color .15s; }
    .s3-chip, .s3-badge, .s2-badge {
      border-radius: 999px; transition: background .15s, transform .15s var(--s5-ease), border-color .15s;
    }
    .s3-chip:hover { transform: translateY(-1px); border-color: var(--primary); }
    .s3-tab-btn, .s3-subtab-btn { border-radius: 999px; }
    .s2-progress-bar, .s3-progress-bar {
      background: linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 55%, #fff)) !important;
      border-radius: 999px; transition: width .35s var(--s5-ease);
    }
    .s2-progress-wrap, .s3-progress-wrap { border-radius: 999px; overflow: hidden; }
    .s2-collapse-header { transition: background .15s; }
    .s2-collapse-header:hover { background: color-mix(in srgb, var(--primary) 7%, var(--bg-sidebar)); }

    /* Hộp thoại */
    @keyframes s5-pop { from { opacity: 0; transform: translateY(10px) scale(.97); } to { opacity: 1; transform: none; } }
    .modal-backdrop, .s3-modal-backdrop, .s4-modal-backdrop { -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }
    .modal-backdrop.open .modal, .s3-modal, .s4-modal { border-radius: 18px; animation: s5-pop .28s var(--s5-ease) both; }

    /* Thông báo nổi (toast) */
    #s5-toasts { position: fixed; right: 16px; bottom: 16px; z-index: 100000; display: flex; flex-direction: column; gap: 10px; max-width: min(380px, calc(100vw - 32px)); }
    .s5-toast {
      background: var(--bg-panel); color: var(--text-main); border: 1px solid var(--border);
      border-left: 4px solid var(--primary); border-radius: 12px; padding: 11px 14px; font-size: .88rem; line-height: 1.45;
      box-shadow: 0 14px 30px -14px rgba(0,0,0,.5); white-space: pre-line; cursor: pointer;
      animation: s5-toast-in .35s var(--s5-ease) both;
    }
    .s5-toast.s5-err { border-left-color: var(--danger); }
    .s5-toast.s5-ok { border-left-color: var(--success); }
    .s5-toast.s5-out { animation: s5-toast-out .25s ease forwards; }
    @keyframes s5-toast-in { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }
    @keyframes s5-toast-out { to { opacity: 0; transform: translateX(24px); } }

    /* Nút chọn bảng màu */
    #s5-palette-wrap { position: relative; display: inline-flex; }
    #s5-palette-pop {
      position: absolute; right: 0; top: calc(100% + 8px); background: var(--bg-panel); border: 1px solid var(--border);
      border-radius: 14px; box-shadow: 0 18px 36px -16px rgba(0,0,0,.5); padding: 10px; min-width: 190px; display: none; z-index: 60;
      animation: s5-pop .22s var(--s5-ease) both;
    }
    #s5-palette-pop.s5-open { display: block; }
    #s5-palette-pop .s5-pal-title { font-size: .72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .6px; margin: 2px 4px 8px; }
    .s5-pal-item { display: flex; width: 100%; align-items: center; gap: 10px; padding: 7px 8px; margin: 2px 0; border: 1px solid transparent; background: transparent; text-align: left; }
    .s5-pal-item:hover { background: color-mix(in srgb, var(--primary) 8%, transparent); }
    .s5-pal-item.s5-active { border-color: var(--primary); background: color-mix(in srgb, var(--primary) 10%, transparent); }
    .s5-swatch { width: 18px; height: 18px; border-radius: 50%; box-shadow: inset 0 0 0 2px rgba(255,255,255,.55), 0 0 0 1px rgba(0,0,0,.15); flex-shrink: 0; }

    /* Nút lên đầu trang */
    #s5-top {
      position: fixed; right: 18px; bottom: 18px; width: 44px; height: 44px; border-radius: 50%; padding: 0; z-index: 50;
      display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
      background: linear-gradient(135deg, var(--primary), var(--primary-hover)); color: #fff; border-color: transparent;
      opacity: 0; pointer-events: none; transform: translateY(12px);
    }
    #s5-top.s5-show { opacity: 1; pointer-events: auto; transform: none; }
    #s5-toasts:not(:empty) ~ #s5-top { bottom: 90px; }

    /* Phần thông tin kỹ thuật gấp gọn */
    details.s5-tech { margin-top: 8px; border: 1px dashed var(--border); border-radius: 14px; padding: 8px 14px; background: color-mix(in srgb, var(--bg-sidebar) 55%, transparent); }
    details.s5-tech > summary { cursor: pointer; font-weight: 600; color: var(--text-muted); font-size: .88rem; padding: 4px 0; user-select: none; }
    details.s5-tech[open] > summary { margin-bottom: 10px; }

    @media (pointer: coarse) {
      button:not(.s3-mini-del):not(.btn-sm) { min-height: 40px; }
      button.btn-sm { min-height: 34px; }
    }
    @media (max-width: 768px) {
      #s5-toasts { left: 12px; right: 12px; bottom: 12px; max-width: none; }
      #s5-top { right: 12px; bottom: 76px; }
      /* Thanh đầu trang gọn lại cho điện thoại */
      header { padding: 0 10px; }
      .header-left, .header-right { gap: 6px; }
      .header-right { flex-shrink: 0; }
      .brand { white-space: nowrap; font-size: .98rem; }
      #sync-text, #btn-reset-quota { display: none; }
      .status-pill { padding: 3px 8px; }
      #btn-open-settings { font-size: 0; padding: 7px 11px; }
      #btn-open-settings::before { content: '⚙'; font-size: 1.05rem; }
    }
    @media (max-width: 480px) {
      .header-left, .header-right { gap: 4px; }
      .brand { font-size: .85rem; }
      #sync-indicator { padding: 0 2px; border: none; background: none; box-shadow: none; }
      .status-pill { padding: 3px 7px; }
      #btn-theme, #s5-palette-btn, #btn-toggle-sidebar, #btn-open-settings { padding: 6px 8px; }
    }
    @media (max-width: 380px) {
      .brand { font-size: 0; }
      .brand::before { content: '⚙️'; font-size: 1.15rem; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; scroll-behavior: auto !important; }
    }
  `;

  /* ------------------------------------------------------------------------
     3. NẠP CSS VÀ PHÔNG CHỮ
     ------------------------------------------------------------------------ */
  let styleEl = null;

  function injectStyles() {
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 's5-style';
      styleEl.textContent = CSS_PALETTES + CSS_COMPONENTS;
      document.head.appendChild(styleEl);
    }
    if (!document.getElementById('s5-font')) {
      const link = document.createElement('link');
      link.id = 's5-font';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap';
      document.head.appendChild(link);
    }
  }

  // Các chặng khác nạp CSS muộn; giữ <style> của chặng 5 luôn nằm cuối để thắng khi trùng độ ưu tiên
  function keepStyleLast() {
    let timer = null;
    new MutationObserver(() => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        if (styleEl && document.head.lastElementChild !== styleEl) document.head.appendChild(styleEl);
      }, 120);
    }).observe(document.head, { childList: true });
  }

  /* ------------------------------------------------------------------------
     4. BẢNG MÀU: lưu lựa chọn và nút 🎨 trên thanh đầu trang
     ------------------------------------------------------------------------ */
  function getSavedPalette() {
    try {
      const v = localStorage.getItem(PALETTE_KEY);
      if (v && PALETTES.some(p => p.id === v)) return v;
    } catch (e) { /* bỏ qua */ }
    return DEFAULT_PALETTE;
  }

  function applyPalette(id) {
    const valid = PALETTES.some(p => p.id === id) ? id : DEFAULT_PALETTE;
    document.documentElement.setAttribute('data-palette', valid);
    try { localStorage.setItem(PALETTE_KEY, valid); } catch (e) { /* bỏ qua */ }
    document.querySelectorAll('.s5-pal-item').forEach(el => {
      el.classList.toggle('s5-active', el.getAttribute('data-id') === valid);
    });
  }

  function buildPaletteButton() {
    const themeBtn = document.getElementById('btn-theme');
    if (!themeBtn || document.getElementById('s5-palette-wrap')) return;

    const wrap = document.createElement('span');
    wrap.id = 's5-palette-wrap';
    wrap.innerHTML = `
      <button type="button" id="s5-palette-btn" title="Đổi bảng màu" aria-haspopup="true">🎨</button>
      <div id="s5-palette-pop" role="menu">
        <div class="s5-pal-title">Bảng màu</div>
        ${PALETTES.map(p => `
          <button type="button" class="s5-pal-item" data-id="${p.id}" role="menuitem">
            <span class="s5-swatch" style="background:${p.swatch}"></span><span>${p.name}</span>
          </button>`).join('')}
      </div>`;
    themeBtn.parentNode.insertBefore(wrap, themeBtn);

    const pop = wrap.querySelector('#s5-palette-pop');
    wrap.querySelector('#s5-palette-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      pop.classList.toggle('s5-open');
    });
    pop.addEventListener('click', (e) => {
      const item = e.target.closest('.s5-pal-item');
      if (!item) return;
      applyPalette(item.getAttribute('data-id'));
      pop.classList.remove('s5-open');
    });
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) pop.classList.remove('s5-open');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') pop.classList.remove('s5-open');
    });
    applyPalette(getSavedPalette());
  }

  /* ------------------------------------------------------------------------
     5. THÔNG BÁO NỔI (thay cho hộp alert chặn màn hình)
     ------------------------------------------------------------------------ */
  function ensureToastHost() {
    let host = document.getElementById('s5-toasts');
    if (!host) {
      host = document.createElement('div');
      host.id = 's5-toasts';
      host.setAttribute('aria-live', 'polite');
      document.body.appendChild(host);
    }
    return host;
  }

  function showToast(message, kind) {
    const host = ensureToastHost();
    const text = String(message == null ? '' : message);
    const type = kind || (/lỗi|không thể|thất bại|không tìm thấy|chưa thể|cần cấu hình/i.test(text) ? 'err'
      : /thành công|đã lưu|đã xóa|xong/i.test(text) ? 'ok' : 'info');
    const el = document.createElement('div');
    el.className = 's5-toast' + (type === 'err' ? ' s5-err' : type === 'ok' ? ' s5-ok' : '');
    el.textContent = text; // textContent: không chèn HTML
    host.appendChild(el);
    const close = () => {
      if (!el.parentNode) return;
      el.classList.add('s5-out');
      setTimeout(() => el.remove(), 260);
    };
    el.addEventListener('click', close);
    setTimeout(close, type === 'err' ? 9000 : 5500);
    while (host.children.length > 4) host.firstElementChild.remove();
  }

  function overrideAlert() {
    if (window.__s5AlertPatched) return;
    window.__s5AlertPatched = true;
    window.__nativeAlert = window.alert.bind(window);
    window.alert = function (msg) { showToast(msg); };
  }

  /* ------------------------------------------------------------------------
     6. BỘ ĐẾM LƯỢT AI DẠNG THANH TIẾN ĐỘ, NÚT LÊN ĐẦU TRANG, PHÍM TẮT
     ------------------------------------------------------------------------ */
  function setupQuotaMeter() {
    const textEl = document.getElementById('ai-quota-text');
    if (!textEl) return;
    const pill = textEl.closest('.status-pill');
    if (!pill) return;
    pill.classList.add('s5-quota');
    const update = () => {
      const m = String(textEl.textContent || '').match(/(\d+)\s*\/\s*(\d+)/);
      if (!m) return;
      const used = Number(m[1]), max = Math.max(1, Number(m[2]));
      const ratio = Math.min(1, used / max);
      pill.style.setProperty('--s5-q', String(ratio));
      pill.style.setProperty('--s5-q-color', ratio >= 0.95 ? 'var(--danger)' : ratio >= 0.8 ? 'var(--warning)' : 'var(--primary)');
    };
    new MutationObserver(update).observe(textEl, { childList: true, characterData: true, subtree: true });
    update();
  }

  function setupBackToTop() {
    const main = document.getElementById('main-content');
    if (!main || document.getElementById('s5-top')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 's5-top';
    btn.title = 'Lên đầu trang';
    btn.setAttribute('aria-label', 'Lên đầu trang');
    btn.textContent = '↑';
    document.body.appendChild(btn);
    btn.addEventListener('click', () => main.scrollTo({ top: 0, behavior: 'smooth' }));
    main.addEventListener('scroll', () => {
      btn.classList.toggle('s5-show', main.scrollTop > 400);
    }, { passive: true });
  }

  function setupShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target && e.target.tagName) || '';
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || (e.target && e.target.isContentEditable)) return;
      const input = document.getElementById('s3-search-input');
      if (input) { e.preventDefault(); input.focus(); input.select(); }
    });
  }

  /* ------------------------------------------------------------------------
     7. GỌN TRANG CHỦ: gom hai thẻ thông tin kỹ thuật của chặng 1 vào một mục thu gọn
     ------------------------------------------------------------------------ */
  function tidyHomeCards() {
    const main = document.getElementById('main-content');
    if (!main || main.querySelector('details.s5-tech')) return;
    const cards = Array.from(main.querySelectorAll(':scope > .card')).filter(c => {
      const h = c.querySelector('h2');
      return h && /Khung Nền Tảng|Bảng Kiểm Tra Nhanh/i.test(h.textContent || '');
    });
    if (cards.length === 0) return;
    const details = document.createElement('details');
    details.className = 's5-tech';
    const summary = document.createElement('summary');
    summary.textContent = '🔧 Thông tin kỹ thuật (dành cho người làm app)';
    details.appendChild(summary);
    cards.forEach(c => details.appendChild(c)); // di chuyển, giữ nguyên các nút và id bên trong
    main.appendChild(details);
  }

  /* ------------------------------------------------------------------------
     8. KHỞI TẠO
     ------------------------------------------------------------------------ */
  // Áp bảng màu ngay khi script chạy để tránh nháy màu
  document.documentElement.setAttribute('data-palette', getSavedPalette());

  function initStage5() {
    injectStyles();
    keepStyleLast();
    buildPaletteButton();
    overrideAlert();
    setupQuotaMeter();
    setupBackToTop();
    setupShortcuts();
    tidyHomeCards();
  }

  window.MechaStage5 = {
    applyPalette,
    showToast,
    palettes: PALETTES.map(p => ({ id: p.id, name: p.name }))
  };

  if (document.readyState !== 'loading') {
    initStage5();
  } else {
    document.addEventListener('DOMContentLoaded', initStage5);
  }
})();
