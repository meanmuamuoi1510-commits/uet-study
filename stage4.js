/**
 * MechaStudy - CHẶNG 4 (stage4.js)
 * Tạo mô hình mô phỏng động tương tác (Cơ học & Vật lý kỹ thuật) bằng AI trong khung cách ly (Sandbox Iframe)
 * Tương thích hoàn toàn với index.html (Chặng 1), stage2.js (Chặng 2) và stage3.js (Chặng 3).
 */
(function () {
  'use strict';

  /* ==========================================================================
     1. KHỞI TẠO (Trạng thái, Inject CSS s4-, Ủy quyền sự kiện & Hook __s2Data)
     ========================================================================== */

  const S4_STATE = {
    animDirCache: new Map(), // folder -> { ts: number, files: Set<string>, promise?: Promise<Set<string>> }
    observerTimer: null,
    activeSession: null      // Phiên đang mở trong hộp thoại Trình xem / Tạo mô hình
  };

  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút

  function injectStage4Styles() {
    if (document.getElementById('s4-styles')) return;
    const style = document.createElement('style');
    style.id = 's4-styles';
    style.textContent = `
      .s4-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.72);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 200;
        padding: 12px;
      }
      .s4-modal-backdrop.s4-open {
        display: flex;
      }
      .s4-modal {
        background: var(--bg-panel, #ffffff);
        color: var(--text-main, #0f172a);
        border: 1px solid var(--border, #e2e8f0);
        border-radius: var(--radius, 8px);
        width: 96vw;
        max-width: 1240px;
        height: 92vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.35);
        overflow: hidden;
      }
      .s4-modal.s4-dialog-compact {
        max-width: 560px;
        height: auto;
        max-height: 90vh;
      }
      @media (max-width: 768px) {
        .s4-modal-backdrop {
          padding: 0;
        }
        .s4-modal {
          width: 100vw;
          height: 100vh;
          border-radius: 0;
          border: none;
        }
      }
      .s4-header {
        padding: 10px 14px;
        border-bottom: 1px solid var(--border, #e2e8f0);
        background: var(--bg-sidebar, #f1f5f9);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
        flex-shrink: 0;
      }
      .s4-title-wrap {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        font-weight: 700;
        font-size: 0.98rem;
        color: var(--primary, #2563eb);
      }
      .s4-toolbar {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }
      .s4-subbar {
        padding: 8px 14px;
        border-bottom: 1px solid var(--border, #e2e8f0);
        background: var(--bg-panel, #ffffff);
        display: none;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        flex-shrink: 0;
      }
      .s4-subbar.s4-open {
        display: flex;
      }
      .s4-body {
        flex: 1;
        position: relative;
        overflow-y: auto;
        background: var(--bg-main, #f8fafc);
        display: flex;
        flex-direction: column;
      }
      .s4-iframe {
        width: 100%;
        flex: 1;
        border: none;
        background: transparent;
        min-height: 480px;
      }
      .s4-status-badge {
        font-size: 0.76rem;
        font-weight: 600;
        padding: 3px 9px;
        border-radius: 999px;
        border: 1px solid var(--border, #cbd5e1);
        background: var(--bg-panel, #ffffff);
        color: var(--text-muted, #64748b);
      }
      .s4-status-badge.s4-cloud {
        color: var(--success, #16a34a);
        border-color: var(--success, #16a34a);
        background: rgba(22, 163, 74, 0.1);
      }
      .s4-status-badge.s4-local {
        color: var(--warning, #d97706);
        border-color: var(--warning, #d97706);
        background: rgba(217, 119, 6, 0.1);
      }
      .s4-status-badge.s4-err {
        color: var(--danger, #dc2626);
        border-color: var(--danger, #dc2626);
        background: rgba(220, 38, 38, 0.1);
      }
      .s4-dialog-box {
        padding: 18px;
      }
      .s4-alert {
        padding: 12px 14px;
        border-radius: var(--radius, 8px);
        border: 1px solid var(--border, #e2e8f0);
        background: var(--bg-sidebar, #f1f5f9);
        margin-bottom: 12px;
        font-size: 0.9rem;
        line-height: 1.5;
      }
      .s4-alert-warn {
        border-color: var(--warning, #d97706);
        background: rgba(217, 119, 6, 0.12);
      }
      .s4-alert-err {
        border-color: var(--danger, #dc2626);
        background: rgba(220, 38, 38, 0.12);
      }
      .s2-btn-anim {
        font-weight: 600;
        border-color: var(--primary, #2563eb) !important;
        color: var(--primary, #2563eb) !important;
        opacity: 1 !important;
        cursor: pointer !important;
      }
      .s2-btn-anim.s4-has-anim {
        background: var(--primary, #2563eb) !important;
        color: #ffffff !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Móc vào window.MechaStage2.renderResult để tự động gắn thuộc tính __s2Data
   * lên vùng chứa kết quả mỗi khi Chặng 2 hoặc Chặng 3 vẽ thẻ bài.
   */
  function hookStage2RenderResult() {
    if (window.MechaStage2 && typeof window.MechaStage2.renderResult === 'function' && !window.MechaStage2.__s4Hooked) {
      const origRender = window.MechaStage2.renderResult;
      window.MechaStage2.renderResult = async function (containerEl, data) {
        if (containerEl && data) {
          containerEl.__s2Data = data;
        }
        const res = await origRender.apply(this, arguments);
        if (containerEl && data) {
          containerEl.__s2Data = data;
          scheduleDecorateButtons();
        }
        return res;
      };
      window.MechaStage2.__s4Hooked = true;
    }
  }

  function initStage4() {
    injectStage4Styles();
    hookStage2RenderResult();
    setupViewerModalDOM();

    // Ủy quyền sự kiện click trên toàn bộ document cho các nút .s2-btn-anim
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.s2-btn-anim');
      if (!btn) return;
      e.preventDefault();
      handleAnimButtonClick(btn);
    });

    // Phím Esc đóng hộp thoại Trình xem
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('s4-modal-backdrop');
        if (modal && modal.classList.contains('s4-open')) {
          closeViewerModal();
        }
      }
    });

    // Lắng nghe postMessage từ iframe cách ly (chỉ nhận đúng nguồn contentWindow đang mở)
    window.addEventListener('message', handleIframePostMessage);

    // Quan sát biến đổi DOM (có debounce) để gắn nhãn và kích hoạt nút mô hình động
    const observer = new MutationObserver(() => {
      hookStage2RenderResult();
      scheduleDecorateButtons();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    scheduleDecorateButtons();
  }


  /* ==========================================================================
     2. GẮN NHÃN NÚT (MutationObserver có debounce, Cache thư mục anim 5 phút)
     ========================================================================== */

  function scheduleDecorateButtons() {
    if (S4_STATE.observerTimer) clearTimeout(S4_STATE.observerTimer);
    S4_STATE.observerTimer = setTimeout(() => {
      decorateAllProblemCards().catch(() => {});
    }, 180);
  }

  /**
   * Tìm phần tử cha gần nhất có thuộc tính __s2Data
   */
  function findS2DataContainer(startEl) {
    let curr = startEl;
    while (curr && curr !== document.body && curr !== document.documentElement) {
      if (curr.__s2Data && curr.__s2Data.meta && curr.__s2Data.baitap) {
        return curr;
      }
      curr = curr.parentElement;
    }
    return null;
  }

  /**
   * Khôi phục __s2Data từ IndexedDB nếu thẻ bài đã được vẽ trước khi stage4.js kịp hook
   */
  async function ensureContainerHasS2Data(cardEl) {
    const existing = findS2DataContainer(cardEl);
    if (existing) return existing;

    const mountCandidate = cardEl.closest('#s3-detail-render-target, #s2-result-mount') || cardEl.parentElement;
    if (!mountCandidate) return null;

    try {
      const resultKeys = await dbKeys('result:');
      const probId = cardEl.getAttribute('data-prob-id');
      const matches = [];
      for (const k of resultKeys) {
        const bundle = await dbGet(k);
        if (bundle && bundle.meta && bundle.baitap && Array.isArray(bundle.baitap.danh_sach_bai)) {
          if (bundle.baitap.danh_sach_bai.some(b => String(b.id) === String(probId))) {
            matches.push(bundle);
          }
        }
      }
      // Mã bài như "b1" lặp lại giữa các file, nên chỉ chấp nhận khi khớp duy nhất để không lưu nhầm thư mục
      if (matches.length === 1) {
        mountCandidate.__s2Data = matches[0];
        return mountCandidate;
      }
    } catch (e) { /* Bỏ qua nếu không đọc được cache */ }
    return null;
  }

  /**
   * Lấy danh sách tên file (ví dụ "bai_1.html") trong folder/anim, có cache trong bộ nhớ 5 phút.
   * Mỗi vùng chứa __s2Data chỉ gọi ghListDir đúng 1 lần.
   */
  async function getAnimFileSetForFolder(folder, containerEl) {
    const cleanFolder = String(folder || '').replace(/\/+$/, '');
    if (!cleanFolder) return new Set();

    // Nếu vùng chứa này đã kiểm tra rồi và cache còn hạn 5 phút thì dùng ngay
    const now = Date.now();
    const cached = S4_STATE.animDirCache.get(cleanFolder);
    if (cached && (now - cached.ts < CACHE_TTL_MS)) {
      if (cached.promise) return cached.promise;
      return cached.files;
    }

    if (containerEl && containerEl.__s4CheckedFolder === cleanFolder && cached) {
      return cached.files || new Set();
    }
    if (containerEl) {
      containerEl.__s4CheckedFolder = cleanFolder;
    }

    const fetchPromise = (async () => {
      const fileSet = new Set();

      // 1. Kiểm tra các bản lưu cục bộ trong IndexedDB trước
      try {
        const localKeys = await dbKeys(`anim:${cleanFolder}/`);
        for (const k of (localKeys || [])) {
          const idPart = k.slice(`anim:${cleanFolder}/`.length);
          if (idPart) fileSet.add(`${idPart}.html`);
        }
      } catch (e) {}

      // 2. Nếu đã cấu hình GitHub thì gọi ghListDir(folder + '/anim') đúng 1 lần
      if (checkGitHubReady()) {
        try {
          const items = await ghListDir(`${cleanFolder}/anim`);
          if (Array.isArray(items)) {
            for (const it of items) {
              if (it && it.name && it.name.endsWith('.html')) {
                fileSet.add(it.name);
              }
            }
          }
        } catch (err) {
          // Lỗi mạng thì giữ nguyên nhãn mặc định hoặc cache cục bộ, không báo lỗi ồn ào
        }
      }

      S4_STATE.animDirCache.set(cleanFolder, { ts: Date.now(), files: fileSet });
      return fileSet;
    })();

    S4_STATE.animDirCache.set(cleanFolder, { ts: now, files: new Set(), promise: fetchPromise });
    return fetchPromise;
  }

  function markAnimExistenceInCache(folder, probId, exists) {
    const cleanFolder = String(folder || '').replace(/\/+$/, '');
    const entry = S4_STATE.animDirCache.get(cleanFolder);
    const fileName = `${probId}.html`;
    if (entry && entry.files) {
      if (exists) entry.files.add(fileName);
      else entry.files.delete(fileName);
    } else if (exists) {
      S4_STATE.animDirCache.set(cleanFolder, { ts: Date.now(), files: new Set([fileName]) });
    }
  }

  async function decorateAllProblemCards() {
    const cards = Array.from(document.querySelectorAll('.s2-prob-card[data-prob-id]'));
    if (cards.length === 0) return;

    // Nhóm các thẻ bài theo vùng chứa __s2Data để chỉ gọi ghListDir 1 lần cho mỗi vùng chứa
    const containerGroups = new Map();

    for (const card of cards) {
      const probId = card.getAttribute('data-prob-id');
      if (!probId) continue;

      // Tìm hoặc nâng cấp nút "Tạo mô hình động" do stage2 tạo sẵn thành .s2-btn-anim
      let btn = card.querySelector('.s2-btn-anim');
      if (!btn) {
        const candidates = Array.from(card.querySelectorAll('button'));
        btn = candidates.find(b => /mô hình động/i.test(b.textContent || ''));
        if (btn) {
          btn.classList.add('s2-btn-anim');
          btn.setAttribute('data-prob-id', probId);
          btn.disabled = false;
          btn.removeAttribute('disabled');
          btn.title = 'Tạo hoặc mở mô hình mô phỏng động tương tác';
          // Ẩn dòng chú thích "(sẽ có ở chặng 4)" kế bên nếu có
          const nextSpan = btn.nextElementSibling;
          if (nextSpan && /chặng 4/i.test(nextSpan.textContent || '')) {
            nextSpan.style.display = 'none';
          }
          btn.textContent = '🎞️ Tạo mô hình động';
        }
      }

      const containerEl = await ensureContainerHasS2Data(card);
      if (containerEl && containerEl.__s2Data?.meta) {
        if (!containerGroups.has(containerEl)) {
          containerGroups.set(containerEl, []);
        }
        containerGroups.get(containerEl).push({ card, btn, probId });
      }
    }

    for (const [containerEl, items] of containerGroups.entries()) {
      const meta = containerEl.__s2Data.meta || {};
      if (!meta.ngay || !meta.hash8) continue;

      let folder = '';
      try {
        folder = buildPaths(meta.ngay, meta.hash8).baseDir;
      } catch (e) {
        continue;
      }

      const fileSet = await getAnimFileSetForFolder(folder, containerEl);
      for (const { btn, probId } of items) {
        if (!btn) continue;
        const hasAnim = fileSet.has(`${probId}.html`);
        updateSingleButtonLabel(btn, hasAnim);
      }
    }
  }

  function updateSingleButtonLabel(btn, hasAnim) {
    if (!btn) return;
    btn.disabled = false;
    btn.removeAttribute('disabled');
    const newText = hasAnim ? '▶ Mở mô hình động' : '🎞️ Tạo mô hình động';
    // Chỉ ghi lại khi khác, nếu không MutationObserver sẽ bị kích hoạt liên tục (vòng lặp)
    if (btn.textContent !== newText) btn.textContent = newText;
    if (hasAnim) btn.classList.add('s4-has-anim');
    else btn.classList.remove('s4-has-anim');
  }

  function updateButtonsByProbIdInDOM(probId, hasAnim) {
    document.querySelectorAll(`.s2-btn-anim[data-prob-id="${CSS.escape(String(probId))}"]`).forEach(btn => {
      updateSingleButtonLabel(btn, hasAnim);
    });
  }


  /* ==========================================================================
     3. TẠO MÔ HÌNH (Kiểm tra bản lưu, Hộp thoại cấu hình, Gọi AI vai_tro 'hoat_anh')
     ========================================================================== */

  const SIM_API_DOC = `
Giao diện Sim.init(config) nhận 1 object cấu hình duy nhất:
- title: string (Tiêu đề mô hình tiếng Việt)
- world: {xmin, xmax, ymin, ymax} (Tọa độ thế giới thực tính bằng MÉT; tự động co giãn vừa canvas giữ đúng tỉ lệ 1:1; trục Ox sang phải, trục Oy hướng LÊN).
- params: [{id, label, min, max, step, value, unit}] (Tạo thanh trượt điều chỉnh; đối tượng tham số hiện hành p = { [id]: number }; value mặc định PHẢI khớp số liệu đề bài).
- state0: (p) => ({...}) (Hàm trả về trạng thái động lực học ban đầu s khi t = 0).
- step: (s, p, dt) => void (Cập nhật trực tiếp trạng thái s sau bước thời gian dt giây; hệ thống tự chia bước nhỏ dt <= 0.002s; bỏ qua nếu static: true).
- draw: (ctx, s, p, W) => void (Vẽ lên canvas 2D. Sử dụng bộ quy đổi tọa độ MÉT của W:
  + W.x(m), W.y(m): đổi tọa độ mét sang pixel.
  + W.len(m): đổi độ dài mét sang pixel.
  + W.line(x1, y1, x2, y2, {color, width, dash}): vẽ đoạn thẳng tọa độ mét.
  + W.circle(x, y, r_m, {fill, stroke, width}): vẽ hình tròn tâm (x,y) bán kính r_m mét.
  + W.rect(x, y, w_m, h_m, {fill, stroke, width, angle}): vẽ hình chữ nhật góc dưới-trái (x,y) hoặc xoay góc angle rad.
  + W.arrow(x1, y1, x2, y2, {color, label, width}): vẽ mũi tên vector lực/vận tốc từ (x1,y1) đến (x2,y2) mét kèm nhãn.
  + W.text(str, x, y, {color, size, align}): viết chữ tại tọa độ (x,y) mét).
- readouts: [{label, unit, digits, fn: (s,p) => number}] (Bảng số liệu thời gian thực).
- plots: [{label, unit, fn: (s,p) => number}] (Đồ thị tự cuộn theo thời gian t, tùy chọn).
- check: [{label, expected: number, unit, tol, fn: (s,p) => number}] (Bảng đối chiếu đáp số tại tham số mặc định; hiện ✓ nếu |fn(s,p) - expected| <= (tol||0.02)*|expected|).
- tmax: number (Thời gian dừng mô phỏng, tùy chọn).
- static: boolean (Đặt true cho bài Tĩnh học / Cân bằng lực: ẩn Play/Pause, tự tính lại và vẽ ngay khi kéo thanh trượt).
Tiện ích có sẵn: Sim.G = 9.81; Sim.rk4(f, yArr, t, dt) giải vi phân bậc 4 trả về mảng mới; Sim.clamp(v, a, b); Sim.deg2rad(deg).
`.trim();

  const ANIM_SYSTEM_PROMPT =
    'Bạn là kỹ sư mô phỏng cơ điện tử và giảng viên cơ học/vật lý kỹ thuật. ' +
    'Nhiệm vụ của bạn là viết mã mô phỏng tương tác chuẩn xác về mặt vật lý và toán học bằng thư viện Sim.';

  async function handleAnimButtonClick(btn) {
    const probId = btn.getAttribute('data-prob-id');
    const cardEl = btn.closest('.s2-prob-card');
    const containerEl = await ensureContainerHasS2Data(cardEl || btn);

    if (!containerEl || !containerEl.__s2Data) {
      alert('Không tìm thấy dữ liệu bài tập (__s2Data) tại vùng chứa này.');
      return;
    }

    const s2Data = containerEl.__s2Data;
    const meta = s2Data.meta || {};
    const prob = (s2Data.baitap?.danh_sach_bai || []).find(b => String(b.id) === String(probId));
    if (!prob) {
      alert(`Không tìm thấy thông tin bài tập "${probId}".`);
      return;
    }

    const folder = buildPaths(meta.ngay, meta.hash8).baseDir;
    const rawFigUrl = s2Data.figureUrls ? s2Data.figureUrls[probId] : '';

    await openOrPromptModel({
      folder,
      meta,
      probId: String(probId),
      prob,
      rawFigUrl
    });
  }

  /**
   * Kiểm tra xem bài đã có bản lưu mô hình động trong IndexedDB hoặc trên GitHub chưa.
   * Nếu có thì mở ngay không gọi AI; nếu chưa thì mở hộp thoại "Tạo mô hình động".
   */
  async function openOrPromptModel(ctx) {
    const { folder, probId } = ctx;
    const idbKey = `anim:${folder}/${probId}`;

    // 1. Kiểm tra trong IndexedDB trước
    try {
      const localHtml = await dbGet(idbKey);
      if (localHtml && typeof localHtml === 'string' && localHtml.includes('Sim.init')) {
        markAnimExistenceInCache(folder, probId, true);
        updateButtonsByProbIdInDOM(probId, true);
        openSimulationViewer({
          ...ctx,
          htmlDoc: localHtml,
          jsCode: extractAiJsFromHtmlDoc(localHtml),
          isNewUnsaved: false,
          syncBadgeState: 'local',
          syncBadgeText: 'Đã nạp từ bộ nhớ máy',
          usageInfo: null
        });
        return;
      }
    } catch (e) {}

    // 2. Kiểm tra file trên GitHub repo nếu đã cấu hình
    if (checkGitHubReady()) {
      try {
        const ghPath = `${folder}/anim/${probId}.html`;
        const ghRes = await ghGetFile(ghPath);
        if (ghRes && ghRes.content && ghRes.content.includes('Sim.init')) {
          await dbSet(idbKey, ghRes.content);
          markAnimExistenceInCache(folder, probId, true);
          updateButtonsByProbIdInDOM(probId, true);
          openSimulationViewer({
            ...ctx,
            htmlDoc: ghRes.content,
            jsCode: extractAiJsFromHtmlDoc(ghRes.content),
            isNewUnsaved: false,
            syncBadgeState: 'cloud',
            syncBadgeText: 'Đã lưu lên đám mây',
            usageInfo: null
          });
          return;
        }
      } catch (e) {
        // Nếu lỗi đọc mạng thì chuyển xuống hộp thoại Tạo mới
      }
    }

    // 3. Chưa có bản lưu -> Hiện hộp thoại "Tạo mô hình động"
    showCreateAnimDialog(ctx);
  }

  function showCreateAnimDialog(ctx) {
    const { prob, rawFigUrl } = ctx;
    const hasImageAvailable = Boolean(prob.co_hinh && rawFigUrl);
    const defaultCheckImage = Boolean(prob.co_hinh && typeof rawFigUrl === 'string' && rawFigUrl.startsWith('data:'));

    S4_STATE.activeSession = { ...ctx };

    const backdrop = document.getElementById('s4-modal-backdrop');
    const modal = document.getElementById('s4-modal-box');
    const titleEl = document.getElementById('s4-viewer-title');
    const toolbarEl = document.getElementById('s4-viewer-toolbar');
    const subbarEl = document.getElementById('s4-viewer-subbar');
    const bodyEl = document.getElementById('s4-viewer-body');

    modal.classList.add('s4-dialog-compact');
    subbarEl.classList.remove('s4-open');
    titleEl.innerHTML = `<span>🎞️ Tạo mô hình động — ${escapeHTML(prob.nhan || prob.id)}</span>`;
    toolbarEl.innerHTML = `<button type="button" class="btn-sm" id="s4-btn-close-dialog">Đóng</button>`;

    bodyEl.innerHTML = `
      <div class="s4-dialog-box">
        <div class="s4-alert s4-alert-warn">
          ⚡ <strong>Lưu ý:</strong> Thao tác này <strong>sẽ tốn 1 lượt gọi AI</strong> (vai trò <code>hoat_anh</code>) để thiết kế mô hình vật lý và cơ cấu chuyển động cho bài tập.
        </div>

        <div style="margin-bottom:12px; font-size:0.9rem;">
          <div><strong>Đề tóm tắt:</strong> ${escapeHTML(prob.de_tom_tat || '')}</div>
          ${prob.goi_y_dong ? `<div style="margin-top:4px; color:var(--text-muted);"><strong>Gợi ý chuyển động:</strong> ${escapeHTML(prob.goi_y_dong)}</div>` : ''}
        </div>

        <div class="form-group" style="margin-bottom:12px;">
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:600;">
            <input type="checkbox" id="s4-chk-send-img" style="width:auto;" ${defaultCheckImage ? 'checked' : ''} ${!hasImageAvailable ? 'disabled' : ''}>
            <span>Gửi kèm hình bài tập (${hasImageAvailable ? 'Giúp AI bám sát sơ đồ hình vẽ của đề' : 'Bài này không có hình cắt'})</span>
          </label>
        </div>

        <div class="form-group">
          <label for="s4-inp-extra-req">Yêu cầu thêm (tùy chọn)</label>
          <input type="text" id="s4-inp-extra-req" placeholder="Ví dụ: vẽ rõ các vector phản lực liên kết, thêm đồ thị vận tốc, cho phép chỉnh hệ số ma sát...">
        </div>

        <div id="s4-create-status-box"></div>

        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
          <button type="button" id="s4-btn-cancel-create">Hủy</button>
          <button type="button" class="btn-primary" id="s4-btn-confirm-create">🚀 Tạo</button>
        </div>
      </div>
    `;

    backdrop.classList.add('s4-open');

    document.getElementById('s4-btn-close-dialog').onclick = closeViewerModal;
    document.getElementById('s4-btn-cancel-create').onclick = closeViewerModal;
    document.getElementById('s4-btn-confirm-create').onclick = async () => {
      const sendImg = Boolean(document.getElementById('s4-chk-send-img')?.checked);
      const extraReq = (document.getElementById('s4-inp-extra-req')?.value || '').trim();
      await runGenerateWorkflow({
        ...ctx,
        sendImg,
        extraReq,
        previousJs: null,
        errorToFix: null
      });
    };
  }

  /**
   * Chuẩn bị JSON gọn của bài tập theo đúng yêu cầu để tiết kiệm token và giữ độ chính xác
   */
  function buildCompactProblemJson(prob) {
    return {
      nhan: prob.nhan || prob.id,
      de_tom_tat: prob.de_tom_tat || '',
      du_kien: Array.isArray(prob.du_kien) ? prob.du_kien : [],
      can_tim: Array.isArray(prob.can_tim) ? prob.can_tim : [],
      phuong_phap: prob.phuong_phap || '',
      loi_giai: Array.isArray(prob.loi_giai)
        ? prob.loi_giai.map(st => ({
            buoc: st.buoc,
            mo_ta: st.mo_ta || '',
            ket_qua: st.ket_qua || ''
          }))
        : [],
      dap_so: Array.isArray(prob.dap_so) ? prob.dap_so : [],
      goi_y_dong: prob.goi_y_dong || ''
    };
  }

  /**
   * Bóc tách mã JS từ văn bản trả về của AI:
   * - Gỡ rào ```js ... ``` nếu có
   * - Kiểm tra KHONG_PHU_HOP:
   * - Cắt bỏ phần đầu thừa trước "Sim.init" nếu AI viết lời dẫn
   */
  function parseAiSimulationOutput(rawText) {
    let cleaned = String(rawText || '').trim();

    const fenceMatch = cleaned.match(/```(?:javascript|js)?\s*([\s\S]*?)```/i);
    if (fenceMatch && fenceMatch[1]) {
      cleaned = fenceMatch[1].trim();
    } else {
      cleaned = cleaned.replace(/^```(?:javascript|js)?/i, '').replace(/```$/i, '').trim();
    }

    if (/^KHONG_PHU_HOP\s*:/i.test(cleaned)) {
      const reason = cleaned.replace(/^KHONG_PHU_HOP\s*:\s*/i, '').split('\n')[0].trim();
      return {
        unsuitable: true,
        reason: reason || 'Bài tập này không phù hợp để biểu diễn bằng mô hình động 2D.'
      };
    }

    const simIdx = cleaned.indexOf('Sim.init');
    if (simIdx > 0) {
      cleaned = cleaned.slice(simIdx).trim();
    }

    if (!cleaned.includes('Sim.init')) {
      throw new Error('Phản hồi của AI không chứa lệnh gọi Sim.init({...}) hợp lệ.');
    }

    return {
      unsuitable: false,
      jsCode: cleaned
    };
  }

  /**
   * Hàm công khai `generate` gọi AI đúng 1 lượt (vai_tro: 'hoat_anh', maxTokens: 16000)
   */
  async function generate({ prob, imageUrl = '', sendImg = false, extraReq = '', previousJs = null, errorToFix = null } = {}) {
    if (!prob) throw new Error('Thiếu dữ liệu bài tập (prob) để tạo mô hình.');

    const imagesPayload = [];
    if (sendImg && imageUrl) {
      const dataUrl = await ensureDataUrlFromImageSource(imageUrl);
      if (dataUrl) imagesPayload.push(dataUrl);
    }

    const compactProb = buildCompactProblemJson(prob);

    const promptSections = [
      'DỮ LIỆU BÀI TẬP ĐÃ GIẢI (JSON GỌN):',
      JSON.stringify(compactProb, null, 2),
      '',
      'TÀI LIỆU GIAO DIỆN SIM (API BẮT BUỘC TUÂN THỦ):',
      SIM_API_DOC,
      '',
      'YÊU CẦU:',
      'Chỉ trả về MÃ JAVASCRIPT thuần (không HTML, không giải thích, có thể bọc trong ```js) gọi Sim.init({...}) một lần. Tham số mặc định phải khớp dữ kiện đề và kết quả đã giải; thêm mục check để đối chiếu đáp số. Nếu bài không phù hợp để mô phỏng thì chỉ trả đúng một dòng: KHONG_PHU_HOP: <lý do ngắn>.'
    ];

    if (previousJs && errorToFix) {
      promptSections.push(
        '',
        'MÃ JAVASCRIPT CŨ ĐANG BỊ LỖI KHI CHẠY:',
        previousJs,
        '',
        `THÔNG BÁO LỖI CẦN SỬA NGAY: ${errorToFix}`,
        'Hãy sửa triệt để lỗi trên và trả về toàn bộ mã gọi Sim.init({...}) hoàn chỉnh.'
      );
    } else if (previousJs && extraReq) {
      promptSections.push(
        '',
        'MÃ JAVASCRIPT HIỆN TẠI:',
        previousJs,
        '',
        `YÊU CẦU CHỈNH SỬA / BỔ SUNG TỪ NGƯỜI HỌC: ${extraReq}`,
        'Hãy cập nhật mã trên theo đúng yêu cầu chỉnh sửa và trả về toàn bộ lệnh gọi Sim.init({...}).'
      );
    } else if (extraReq) {
      promptSections.push('', `YÊU CẦU THÊM TỪ NGƯỜI HỌC: ${extraReq}`);
    }

    const res = await callLLM({
      vai_tro: 'hoat_anh',
      system: ANIM_SYSTEM_PROMPT,
      text: promptSections.join('\n'),
      images: imagesPayload,
      maxTokens: 16000
    });

    const parsed = parseAiSimulationOutput(res.data);
    return {
      ...parsed,
      usage: res.usage || { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
    };
  }

  async function runGenerateWorkflow(params) {
    const { folder, meta, probId, prob, rawFigUrl, sendImg, extraReq, previousJs, errorToFix } = params;
    const statusBox = document.getElementById('s4-create-status-box') || document.getElementById('s4-viewer-body');

    const renderWaitingStatus = () => {
      const target = document.getElementById('s4-create-status-box');
      const html = `
        <div class="s4-alert" style="margin-top:12px;">
          ⏳ <strong>Đang gọi AI thiết kế mô hình động...</strong> Vui lòng chờ trong giây lát (tối đa 1 lượt gọi).
        </div>
      `;
      if (target) target.innerHTML = html;
      else if (statusBox) statusBox.innerHTML = `<div class="s4-dialog-box">${html}</div>`;
    };

    renderWaitingStatus();

    try {
      const genResult = await generate({
        prob,
        imageUrl: rawFigUrl,
        sendImg,
        extraReq,
        previousJs,
        errorToFix
      });

      if (genResult.unsuitable) {
        const msgHtml = `
          <div class="s4-alert s4-alert-warn" style="margin-top:12px;">
            <div><strong>⚠️ Bài tập không phù hợp để mô phỏng động:</strong></div>
            <div style="margin-top:4px;">${escapeHTML(genResult.reason)}</div>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:6px;">
              Hệ thống không lưu kết quả này. Token đã dùng: ${escapeHTML(formatTokenUsage(genResult.usage))}
            </div>
          </div>
        `;
        const target = document.getElementById('s4-create-status-box');
        if (target) target.innerHTML = msgHtml;
        else if (statusBox) statusBox.innerHTML = `<div class="s4-dialog-box">${msgHtml}</div>`;
        return;
      }

      const fullHtml = buildSimDocument(genResult.jsCode, `${meta?.id || ''}_${probId}`);
      openSimulationViewer({
        folder,
        meta,
        probId,
        prob,
        rawFigUrl,
        htmlDoc: fullHtml,
        jsCode: genResult.jsCode,
        isNewUnsaved: true,
        syncBadgeState: 'local',
        syncBadgeText: '⏳ Đang kiểm thử khung hình đầu (tự lưu sau 2s)...',
        usageInfo: genResult.usage
      });
    } catch (err) {
      const errHtml = `
        <div class="s4-alert s4-alert-err" style="margin-top:12px;">
          <div><strong>❌ Không thể tạo mô hình động:</strong> ${escapeHTML(err.message)}</div>
          <div style="font-size:0.82rem; margin-top:4px;">
            Lưu ý: Mỗi lần bấm <strong>Thử lại</strong> bên dưới sẽ tính là <strong>1 lượt gọi AI mới</strong>.
          </div>
          <div style="margin-top:10px; display:flex; gap:8px;">
            <button type="button" class="btn-primary btn-sm" id="s4-btn-retry-gen">↻ Thử lại (Tốn 1 lượt gọi AI)</button>
            <button type="button" class="btn-sm" id="s4-btn-close-err">Đóng</button>
          </div>
        </div>
      `;
      const target = document.getElementById('s4-create-status-box');
      if (target) {
        target.innerHTML = errHtml;
      } else if (statusBox) {
        statusBox.innerHTML = `<div class="s4-dialog-box">${errHtml}</div>`;
      }

      const retryBtn = document.getElementById('s4-btn-retry-gen');
      if (retryBtn) retryBtn.onclick = () => runGenerateWorkflow(params);
      const closeBtn = document.getElementById('s4-btn-close-err');
      if (closeBtn) closeBtn.onclick = closeViewerModal;
    }
  }


  /* ==========================================================================
     4. THƯ VIỆN SIM (Chuỗi SIM_LIB_JS nhúng độc lập trong Iframe cách ly)
     ========================================================================== */

  const SIM_LIB_JS = `
(function () {
  'use strict';

  function reportSimError(msg) {
    try {
      var banner = document.getElementById('sim-error-banner');
      if (banner) {
        banner.style.display = 'block';
        banner.textContent = '⚠️ Lỗi chạy mô phỏng: ' + String(msg);
      }
      window.parent.postMessage({ type: 'sim-error', message: String(msg) }, '*');
    } catch (e) {}
  }

  window.onerror = function (message, source, lineno, colno, error) {
    var detail = error && error.message ? error.message : String(message);
    if (lineno) detail += ' (Dòng ' + lineno + ')';
    reportSimError(detail);
    return false;
  };

  window.onunhandledrejection = function (ev) {
    var reason = ev && ev.reason ? (ev.reason.message || String(ev.reason)) : 'Lỗi Promise không xác định';
    reportSimError(reason);
  };

  var Sim = {
    G: 9.81,
    clamp: function (val, min, max) {
      return Math.max(min, Math.min(max, val));
    },
    deg2rad: function (deg) {
      return (Number(deg) * Math.PI) / 180;
    },
    rk4: function (f, y, t, dt) {
      var n = y.length;
      var k1 = f(t, y);
      var y2 = new Array(n);
      for (var i = 0; i < n; i++) y2[i] = y[i] + 0.5 * dt * k1[i];
      var k2 = f(t + 0.5 * dt, y2);
      var y3 = new Array(n);
      for (var j = 0; j < n; j++) y3[j] = y[j] + 0.5 * dt * k2[j];
      var k3 = f(t + 0.5 * dt, y3);
      var y4 = new Array(n);
      for (var k = 0; k < n; k++) y4[k] = y[k] + dt * k3[k];
      var k4 = f(t + dt, y4);
      var next = new Array(n);
      for (var m = 0; m < n; m++) {
        next[m] = y[m] + (dt / 6) * (k1[m] + 2 * k2[m] + 2 * k3[m] + k4[m]);
      }
      return next;
    }
  };

  Sim.init = function (cfg) {
    try {
      if (!cfg || typeof cfg !== 'object') {
        throw new Error('Sim.init yêu cầu một đối tượng cấu hình hợp lệ.');
      }

      var isStatic = Boolean(cfg.static) || typeof cfg.step !== 'function';
      var tmax = typeof cfg.tmax === 'number' && cfg.tmax > 0 ? cfg.tmax : Infinity;
      var worldCfg = cfg.world || { xmin: -5, xmax: 5, ymin: -5, ymax: 5 };

      var titleEl = document.getElementById('sim-title');
      if (titleEl) titleEl.textContent = cfg.title || 'Mô hình mô phỏng Cơ điện tử';

      var controlsRow = document.getElementById('sim-controls-row');
      if (controlsRow) {
        controlsRow.style.display = isStatic ? 'none' : 'flex';
      }

      // Khởi tạo tham số p và bản sao mặc định pDefault (để đối chiếu đáp số check)
      var paramsList = Array.isArray(cfg.params) ? cfg.params : [];
      var p = {};
      var pDefault = {};
      var slidersWrap = document.getElementById('sim-sliders');
      slidersWrap.innerHTML = '';

      paramsList.forEach(function (pm) {
        var initVal = Number(pm.value !== undefined ? pm.value : pm.min || 0);
        p[pm.id] = initVal;
        pDefault[pm.id] = initVal;

        var item = document.createElement('div');
        item.className = 'sim-param-item';

        var top = document.createElement('div');
        top.className = 'sim-param-top';

        var lbl = document.createElement('span');
        lbl.textContent = pm.label || pm.id;

        var valSpan = document.createElement('strong');
        valSpan.textContent = initVal + (pm.unit ? ' ' + pm.unit : '');

        top.appendChild(lbl);
        top.appendChild(valSpan);

        var input = document.createElement('input');
        input.type = 'range';
        input.min = pm.min !== undefined ? pm.min : 0;
        input.max = pm.max !== undefined ? pm.max : 100;
        input.step = pm.step !== undefined ? pm.step : 0.1;
        input.value = initVal;

        input.addEventListener('input', function () {
          var v = parseFloat(input.value);
          p[pm.id] = v;
          valSpan.textContent = v + (pm.unit ? ' ' + pm.unit : '');
          resetSimulationState();
        });

        item.appendChild(top);
        item.appendChild(input);
        slidersWrap.appendChild(item);
      });

      var canvas = document.getElementById('sim-canvas');
      var ctx = canvas.getContext('2d');
      var plotCanvas = document.getElementById('sim-plot-canvas');
      var plotWrap = document.getElementById('sim-plot-wrap');
      var plotsCfg = Array.isArray(cfg.plots) ? cfg.plots : [];
      if (plotsCfg.length > 0 && plotWrap) {
        plotWrap.style.display = 'block';
      }

      var running = !isStatic;
      var speedMultiplier = 1.0;
      var simTime = 0;
      var state = {};
      var haltedByError = false;
      var firstFrameReported = false;
      var plotHistory = []; // [{ t, values: [] }]

      function buildWorldHelper(widthPx, heightPx) {
        var xmin = Number(worldCfg.xmin);
        var xmax = Number(worldCfg.xmax);
        var ymin = Number(worldCfg.ymin);
        var ymax = Number(worldCfg.ymax);
        if (!(xmax > xmin)) { xmin = -5; xmax = 5; }
        if (!(ymax > ymin)) { ymin = -5; ymax = 5; }

        var wMeters = xmax - xmin;
        var hMeters = ymax - ymin;
        var pad = 28;
        var availW = Math.max(50, widthPx - pad * 2);
        var availH = Math.max(50, heightPx - pad * 2);
        var scale = Math.min(availW / wMeters, availH / hMeters);

        var cxMeters = 0.5 * (xmin + xmax);
        var cyMeters = 0.5 * (ymin + ymax);
        var cxPx = widthPx * 0.5;
        var cyPx = heightPx * 0.5;

        var W = {
          scale: scale,
          xmin: xmin,
          xmax: xmax,
          ymin: ymin,
          ymax: ymax,
          x: function (m) {
            return cxPx + (Number(m) - cxMeters) * scale;
          },
          y: function (m) {
            // Trục Oy hướng lên trong vật lý -> đảo chiều trên Canvas
            return cyPx - (Number(m) - cyMeters) * scale;
          },
          len: function (m) {
            return Math.abs(Number(m)) * scale;
          },
          line: function (x1, y1, x2, y2, opts) {
            opts = opts || {};
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = opts.color || getThemeStroke();
            ctx.lineWidth = opts.width || 2;
            if (Array.isArray(opts.dash)) ctx.setLineDash(opts.dash);
            ctx.moveTo(W.x(x1), W.y(y1));
            ctx.lineTo(W.x(x2), W.y(y2));
            ctx.stroke();
            ctx.restore();
          },
          circle: function (x, y, r_m, opts) {
            opts = opts || {};
            ctx.save();
            ctx.beginPath();
            ctx.arc(W.x(x), W.y(y), Math.max(1.5, W.len(r_m)), 0, Math.PI * 2);
            if (opts.fill) {
              ctx.fillStyle = opts.fill;
              ctx.fill();
            }
            if (opts.stroke || !opts.fill) {
              ctx.strokeStyle = opts.stroke || getThemeStroke();
              ctx.lineWidth = opts.width || 2;
              ctx.stroke();
            }
            ctx.restore();
          },
          rect: function (x, y, w_m, h_m, opts) {
            opts = opts || {};
            var px = W.x(x);
            var py = W.y(y + h_m);
            var pw = W.len(w_m);
            var ph = W.len(h_m);
            ctx.save();
            if (opts.angle) {
              var cx = W.x(x + 0.5 * w_m);
              var cy = W.y(y + 0.5 * h_m);
              ctx.translate(cx, cy);
              ctx.rotate(-Number(opts.angle));
              px = -0.5 * pw;
              py = -0.5 * ph;
            }
            ctx.beginPath();
            ctx.rect(px, py, pw, ph);
            if (opts.fill) {
              ctx.fillStyle = opts.fill;
              ctx.fill();
            }
            if (opts.stroke || !opts.fill) {
              ctx.strokeStyle = opts.stroke || getThemeStroke();
              ctx.lineWidth = opts.width || 2;
              ctx.stroke();
            }
            ctx.restore();
          },
          text: function (str, x, y, opts) {
            opts = opts || {};
            ctx.save();
            ctx.fillStyle = opts.color || getThemeStroke();
            ctx.font = (opts.size || 13) + 'px system-ui, sans-serif';
            ctx.textAlign = opts.align || 'center';
            ctx.textBaseline = opts.baseline || 'middle';
            ctx.fillText(String(str), W.x(x), W.y(y));
            ctx.restore();
          },
          arrow: function (x1, y1, x2, y2, opts) {
            opts = opts || {};
            var sx = W.x(x1), sy = W.y(y1);
            var ex = W.x(x2), ey = W.y(y2);
            var dx = ex - sx, dy = ey - sy;
            var len = Math.hypot(dx, dy);
            if (len < 1e-3) return;
            var angle = Math.atan2(dy, dx);
            var headLen = Math.min(12, Math.max(7, len * 0.25));
            var color = opts.color || '#ef4444';

            ctx.save();
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = opts.width || 2.2;

            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(ex, ey);
            ctx.lineTo(ex - headLen * Math.cos(angle - Math.PI / 6), ey - headLen * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(ex - headLen * Math.cos(angle + Math.PI / 6), ey - headLen * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fill();

            if (opts.label) {
              ctx.font = '600 12px system-ui, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(String(opts.label), ex + 14 * Math.cos(angle), ey + 14 * Math.sin(angle) - 4);
            }
            ctx.restore();
          }
        };
        return W;
      }

      function getThemeStroke() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          ? '#f1f5f9'
          : '#0f172a';
      }

      function resizeCanvasIfNeeded() {
        var rect = canvas.parentElement.getBoundingClientRect();
        var targetW = Math.max(280, Math.floor(rect.width));
        var targetH = Math.max(260, Math.min(440, Math.floor(targetW * 0.56)));
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
        if (plotsCfg.length > 0 && plotCanvas) {
          var pW = Math.max(260, Math.floor(plotCanvas.parentElement.getBoundingClientRect().width));
          if (plotCanvas.width !== pW || plotCanvas.height !== 150) {
            plotCanvas.width = pW;
            plotCanvas.height = 150;
          }
        }
      }

      function resetSimulationState() {
        if (haltedByError) return;
        try {
          simTime = 0;
          plotHistory = [];
          state = typeof cfg.state0 === 'function' ? (cfg.state0(Object.assign({}, p)) || {}) : {};
          if (state && typeof state === 'object' && state.t === undefined) {
            state.t = 0;
          }
          renderSingleFrame();
          renderCheckTable();
        } catch (err) {
          haltedByError = true;
          running = false;
          reportSimError(err && err.message ? err.message : String(err));
        }
      }

      function stepPhysics(dtWall) {
        if (isStatic || !running || haltedByError) return;
        var dtTarget = dtWall * speedMultiplier;
        if (simTime + dtTarget >= tmax) {
          dtTarget = Math.max(0, tmax - simTime);
          running = false;
          updatePlayPauseButton();
        }
        if (dtTarget <= 0) return;

        // Tự động chia bước con dt <= 0.002s để đảm bảo ổn định số học
        var maxSubDt = 0.002;
        var steps = Math.max(1, Math.ceil(dtTarget / maxSubDt));
        var subDt = dtTarget / steps;

        try {
          for (var i = 0; i < steps; i++) {
            cfg.step(state, p, subDt);
            simTime += subDt;
            if (state && typeof state === 'object') state.t = simTime;
          }

          if (plotsCfg.length > 0) {
            var vals = plotsCfg.map(function (pl) {
              return Number(pl.fn(state, p)) || 0;
            });
            plotHistory.push({ t: simTime, values: vals });
            if (plotHistory.length > 360) plotHistory.shift();
          }
        } catch (err) {
          haltedByError = true;
          running = false;
          reportSimError(err && err.message ? err.message : String(err));
        }
      }

      function renderSingleFrame() {
        if (haltedByError) return;
        try {
          resizeCanvasIfNeeded();
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          var W = buildWorldHelper(canvas.width, canvas.height);
          // Vẽ lưới tọa độ mờ nền
          ctx.save();
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, W.y(0));
          ctx.lineTo(canvas.width, W.y(0));
          ctx.moveTo(W.x(0), 0);
          ctx.lineTo(W.x(0), canvas.height);
          ctx.stroke();
          ctx.restore();

          if (typeof cfg.draw === 'function') {
            cfg.draw(ctx, state, p, W);
          }

          renderReadouts();
          if (plotsCfg.length > 0) renderPlots();

          if (!firstFrameReported) {
            firstFrameReported = true;
            window.parent.postMessage({ type: 'sim-ready' }, '*');
          }
        } catch (err) {
          haltedByError = true;
          running = false;
          reportSimError(err && err.message ? err.message : String(err));
        }
      }

      function renderReadouts() {
        var box = document.getElementById('sim-readouts');
        if (!box) return;
        var list = Array.isArray(cfg.readouts) ? cfg.readouts : [];
        var html = '<div class="sim-ro-card"><span>Thời gian t</span><strong>' + simTime.toFixed(2) + ' s</strong></div>';

        for (var i = 0; i < list.length; i++) {
          var ro = list[i];
          var val = Number(ro.fn(state, p));
          var digits = ro.digits !== undefined ? Number(ro.digits) : 2;
          var valStr = Number.isFinite(val) ? val.toFixed(digits) : 'NaN';
          html += '<div class="sim-ro-card"><span>' + escapeText(ro.label || '') + '</span><strong>' +
                  valStr + (ro.unit ? ' ' + escapeText(ro.unit) : '') + '</strong></div>';
        }
        box.innerHTML = html;
      }

      function renderPlots() {
        if (!plotCanvas || plotHistory.length < 2) return;
        var pctx = plotCanvas.getContext('2d');
        var w = plotCanvas.width;
        var h = plotCanvas.height;
        pctx.clearRect(0, 0, w, h);

        var colors = ['#2563eb', '#dc2626', '#16a34a', '#d97706'];
        var tMin = plotHistory[0].t;
        var tMax = Math.max(tMin + 1e-3, plotHistory[plotHistory.length - 1].t);

        var yMin = Infinity, yMax = -Infinity;
        for (var i = 0; i < plotHistory.length; i++) {
          var vs = plotHistory[i].values;
          for (var j = 0; j < vs.length; j++) {
            if (vs[j] < yMin) yMin = vs[j];
            if (vs[j] > yMax) yMax = vs[j];
          }
        }
        if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || Math.abs(yMax - yMin) < 1e-6) {
          yMin = (Number.isFinite(yMin) ? yMin : 0) - 1;
          yMax = yMin + 2;
        }

        for (var pIdx = 0; pIdx < plotsCfg.length; pIdx++) {
          pctx.save();
          pctx.strokeStyle = colors[pIdx % colors.length];
          pctx.lineWidth = 2;
          pctx.beginPath();
          for (var k = 0; k < plotHistory.length; k++) {
            var pt = plotHistory[k];
            var px = 12 + ((pt.t - tMin) / (tMax - tMin)) * (w - 24);
            var py = h - 16 - ((pt.values[pIdx] - yMin) / (yMax - yMin)) * (h - 32);
            if (k === 0) pctx.moveTo(px, py);
            else pctx.lineTo(px, py);
          }
          pctx.stroke();
          pctx.fillStyle = colors[pIdx % colors.length];
          pctx.font = '600 11px system-ui, sans-serif';
          pctx.fillText(plotsCfg[pIdx].label + (plotsCfg[pIdx].unit ? ' (' + plotsCfg[pIdx].unit + ')' : ''), 14 + pIdx * 150, 14);
          pctx.restore();
        }
      }

      function renderCheckTable() {
        var checkWrap = document.getElementById('sim-check-body');
        if (!checkWrap) return;
        var checks = Array.isArray(cfg.check) ? cfg.check : [];
        if (checks.length === 0) {
          checkWrap.innerHTML = '<tr><td colspan="4">Không có mục đối chiếu đáp số.</td></tr>';
          return;
        }

        // Tính trên trạng thái mặc định ban đầu s0(pDefault) để đối chiếu đáp số chuẩn của đề
        var sDefault = typeof cfg.state0 === 'function' ? (cfg.state0(Object.assign({}, pDefault)) || {}) : state;
        var rowsHtml = '';
        for (var i = 0; i < checks.length; i++) {
          var ck = checks[i];
          var expected = Number(ck.expected);
          var tol = ck.tol !== undefined ? Number(ck.tol) : 0.02;
          var modelVal = Number(ck.fn(sDefault, pDefault));
          var diff = Math.abs(modelVal - expected);
          var limit = tol * Math.max(1e-9, Math.abs(expected));
          var passed = diff <= limit;

          rowsHtml += '<tr>' +
            '<td>' + escapeText(ck.label || '') + '</td>' +
            '<td><strong>' + (Number.isFinite(modelVal) ? modelVal.toFixed(3) : 'NaN') + '</strong> ' + escapeText(ck.unit || '') + '</td>' +
            '<td>' + (Number.isFinite(expected) ? expected.toFixed(3) : expected) + ' ' + escapeText(ck.unit || '') + '</td>' +
            '<td style="font-weight:700; color:' + (passed ? '#16a34a' : '#d97706') + ';">' +
              (passed ? '✓ Khớp đáp số' : '△ Lệch (' + ((diff / Math.max(1e-9, Math.abs(expected))) * 100).toFixed(1) + '%)') +
            '</td>' +
          '</tr>';
        }
        checkWrap.innerHTML = rowsHtml;
      }

      function escapeText(str) {
        return String(str || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      }

      var btnPlay = document.getElementById('sim-btn-play');
      var btnReset = document.getElementById('sim-btn-reset');

      function updatePlayPauseButton() {
        if (btnPlay) {
          btnPlay.textContent = running ? '⏸ Tạm dừng' : '▶ Chạy tiếp';
        }
      }

      if (btnPlay) {
        btnPlay.addEventListener('click', function () {
          if (haltedByError) return;
          if (simTime >= tmax) {
            resetSimulationState();
          }
          running = !running;
          updatePlayPauseButton();
        });
      }

      if (btnReset) {
        btnReset.addEventListener('click', function () {
          running = !isStatic;
          updatePlayPauseButton();
          resetSimulationState();
        });
      }

      var speedBtns = document.querySelectorAll('.sim-speed-btn');
      speedBtns.forEach(function (b) {
        b.addEventListener('click', function () {
          speedBtns.forEach(function (x) { x.classList.remove('active'); });
          b.classList.add('active');
          speedMultiplier = parseFloat(b.getAttribute('data-speed')) || 1.0;
        });
      });

      window.addEventListener('resize', function () {
        renderSingleFrame();
      });

      resetSimulationState();
      updatePlayPauseButton();

      var lastTs = performance.now();
      function loop(nowTs) {
        var dtWall = Math.min(0.05, Math.max(0.001, (nowTs - lastTs) / 1000));
        lastTs = nowTs;
        if (!isStatic && running && !haltedByError) {
          stepPhysics(dtWall);
          renderSingleFrame();
        }
        if (!haltedByError) {
          requestAnimationFrame(loop);
        }
      }
      if (!isStatic) {
        requestAnimationFrame(loop);
      }
    } catch (err) {
      reportSimError(err && err.message ? err.message : String(err));
    }
  };

  window.Sim = Sim;
})();
`.trim();


  /* ==========================================================================
     5. KHUNG CÁCH LY (buildSimDocument với CSP chặt, Sandbox Iframe allow-scripts)
     ========================================================================== */

  /**
   * Dựng tài liệu HTML độc lập hoàn chỉnh cho mô hình động
   * @param {string} aiJsCode Mã JavaScript gọi Sim.init({...})
   * @param {string} [animId] Định danh bài tập để ghi vào comment đầu file
   * @returns {string} Tài liệu HTML hoàn chỉnh
   */
  function buildSimDocument(aiJsCode, animId = 'unknown') {
    const safeId = String(animId || 'unknown').replace(/-->/g, '');
    const isoNow = new Date().toISOString();
    const cleanJs = String(aiJsCode || '').replace(/<\/script>/gi, '<\\/script>');

    return `<!-- MechaStudy anim: ${safeId} | tạo lúc ${isoNow} -->
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:;">
  <title>MechaStudy Simulation</title>
  <style>
    :root {
      --bg: #f8fafc;
      --panel: #ffffff;
      --text: #0f172a;
      --muted: #64748b;
      --border: #e2e8f0;
      --primary: #2563eb;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0f172a;
        --panel: #1e293b;
        --text: #f8fafc;
        --muted: #94a3b8;
        --border: #334155;
        --primary: #3b82f6;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 12px;
      line-height: 1.45;
    }
    .sim-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 12px;
      align-items: start;
    }
    @media (max-width: 860px) {
      .sim-layout { grid-template-columns: 1fr; }
    }
    .sim-card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
    }
    #sim-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 8px;
    }
    #sim-error-banner {
      display: none;
      padding: 10px 12px;
      border-radius: 6px;
      background: rgba(220, 38, 38, 0.15);
      border: 1px solid #dc2626;
      color: #ef4444;
      font-weight: 600;
      font-size: 0.86rem;
      margin-bottom: 10px;
      white-space: pre-wrap;
    }
    .sim-canvas-wrap {
      width: 100%;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      overflow: hidden;
      text-align: center;
    }
    canvas { display: block; width: 100%; }
    .sim-controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-top: 10px;
    }
    button {
      cursor: pointer;
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--panel);
      color: var(--text);
      font-size: 0.84rem;
      font-weight: 600;
    }
    button.active, button.primary {
      background: var(--primary);
      color: #ffffff;
      border-color: var(--primary);
    }
    .sim-param-item { margin-bottom: 10px; }
    .sim-param-top {
      display: flex;
      justify-content: space-between;
      font-size: 0.82rem;
      margin-bottom: 3px;
    }
    input[type="range"] {
      width: 100%;
      accent-color: var(--primary);
      touch-action: pan-y;
      height: 22px;
    }
    .sim-ro-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 8px;
    }
    .sim-ro-card {
      padding: 7px 9px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--bg);
      display: flex;
      flex-direction: column;
      font-size: 0.78rem;
    }
    .sim-ro-card span { color: var(--muted); }
    .sim-ro-card strong { font-size: 0.92rem; margin-top: 2px; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;
      margin-top: 6px;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 6px 8px;
      text-align: left;
    }
  </style>
</head>
<body>
  <div id="sim-error-banner"></div>
  <div class="sim-layout">
    <div>
      <div class="sim-card">
        <div id="sim-title">Mô hình động Cơ điện tử</div>
        <div class="sim-canvas-wrap">
          <canvas id="sim-canvas" width="680" height="380"></canvas>
        </div>
        <div class="sim-controls" id="sim-controls-row">
          <div style="display:flex; gap:6px;">
            <button type="button" class="primary" id="sim-btn-play">⏸ Tạm dừng</button>
            <button type="button" id="sim-btn-reset">↺ Đặt lại</button>
          </div>
          <div style="display:flex; gap:4px; align-items:center;">
            <span style="font-size:0.78rem; color:var(--muted);">Tốc độ:</span>
            <button type="button" class="sim-speed-btn" data-speed="0.25">0.25x</button>
            <button type="button" class="sim-speed-btn" data-speed="0.5">0.5x</button>
            <button type="button" class="sim-speed-btn active" data-speed="1">1x</button>
            <button type="button" class="sim-speed-btn" data-speed="2">2x</button>
          </div>
        </div>
      </div>

      <div class="sim-card" id="sim-plot-wrap" style="display:none;">
        <div style="font-weight:700; font-size:0.86rem; margin-bottom:6px;">📈 Đồ thị biến thiên theo thời gian</div>
        <div class="sim-canvas-wrap">
          <canvas id="sim-plot-canvas" width="640" height="150"></canvas>
        </div>
      </div>

      <div class="sim-card">
        <div style="font-weight:700; font-size:0.86rem; margin-bottom:4px;">✅ Đối chiếu Đáp số (tại tham số mặc định)</div>
        <table>
          <thead>
            <tr><th>Đại lượng</th><th>Mô hình tính</th><th>Đáp số bài giải</th><th>Trạng thái</th></tr>
          </thead>
          <tbody id="sim-check-body"></tbody>
        </table>
      </div>
    </div>

    <div>
      <div class="sim-card">
        <div style="font-weight:700; font-size:0.88rem; margin-bottom:8px;">🎛️ Thông số điều chỉnh</div>
        <div id="sim-sliders"></div>
      </div>

      <div class="sim-card">
        <div style="font-weight:700; font-size:0.88rem; margin-bottom:8px;">📊 Số liệu thời gian thực</div>
        <div class="sim-ro-grid" id="sim-readouts"></div>
      </div>
    </div>
  </div>

  <script id="sim-lib-script">
${SIM_LIB_JS}
  </script>
  <script id="sim-ai-script">
${cleanJs}
  </script>
</body>
</html>`;
  }

  function extractAiJsFromHtmlDoc(htmlDoc) {
    if (!htmlDoc || typeof htmlDoc !== 'string') return '';
    const match = htmlDoc.match(/<script id="sim-ai-script">([\s\S]*?)<\/script>/i);
    if (match && match[1]) return match[1].trim();
    const idx = htmlDoc.indexOf('Sim.init');
    if (idx >= 0) {
      const endScript = htmlDoc.indexOf('</script>', idx);
      return endScript > idx ? htmlDoc.slice(idx, endScript).trim() : htmlDoc.slice(idx).trim();
    }
    return '';
  }


  /* ==========================================================================
     6. TRÌNH XEM (Hộp thoại gần toàn màn hình, Sửa lỗi AI, Tạo lại, Tải về, Xóa)
     ========================================================================== */

  function setupViewerModalDOM() {
    if (document.getElementById('s4-modal-backdrop')) return;
    const backdrop = document.createElement('div');
    backdrop.id = 's4-modal-backdrop';
    backdrop.className = 's4-modal-backdrop';
    backdrop.innerHTML = `
      <div class="s4-modal" id="s4-modal-box">
        <div class="s4-header">
          <div class="s4-title-wrap" id="s4-viewer-title"></div>
          <div class="s4-toolbar" id="s4-viewer-toolbar"></div>
        </div>
        <div class="s4-subbar" id="s4-viewer-subbar"></div>
        <div class="s4-body" id="s4-viewer-body"></div>
      </div>
    `;
    document.body.appendChild(backdrop);
  }

  function closeViewerModal() {
    if (S4_STATE.activeSession && S4_STATE.activeSession.saveTimer) {
      clearTimeout(S4_STATE.activeSession.saveTimer);
      S4_STATE.activeSession.saveTimer = null;
    }
    S4_STATE.activeSession = null;
    const backdrop = document.getElementById('s4-modal-backdrop');
    if (backdrop) backdrop.classList.remove('s4-open');
    const bodyEl = document.getElementById('s4-viewer-body');
    if (bodyEl) bodyEl.innerHTML = '';
  }

  function openSimulationViewer(sessionData) {
    if (S4_STATE.activeSession && S4_STATE.activeSession.saveTimer) {
      clearTimeout(S4_STATE.activeSession.saveTimer);
    }

    S4_STATE.activeSession = {
      ...sessionData,
      hasRuntimeError: false,
      lastErrorMessage: '',
      saveTimer: null,
      iframeEl: null
    };

    const backdrop = document.getElementById('s4-modal-backdrop');
    const modal = document.getElementById('s4-modal-box');
    const titleEl = document.getElementById('s4-viewer-title');
    const toolbarEl = document.getElementById('s4-viewer-toolbar');
    const subbarEl = document.getElementById('s4-viewer-subbar');
    const bodyEl = document.getElementById('s4-viewer-body');

    modal.classList.remove('s4-dialog-compact');
    subbarEl.classList.remove('s4-open');
    subbarEl.innerHTML = '';

    const probLabel = sessionData.prob?.nhan || sessionData.probId;
    const tokenText = sessionData.usageInfo ? `Token: ${formatTokenUsage(sessionData.usageInfo)}` : '';

    titleEl.innerHTML = `
      <span>🎞️ ${escapeHTML(probLabel)}</span>
      <span class="s4-status-badge ${sessionData.syncBadgeState === 'cloud' ? 's4-cloud' : 's4-local'}" id="s4-sync-badge">
        ${escapeHTML(sessionData.syncBadgeText || 'Đang chạy')}
      </span>
      ${tokenText ? `<span class="s4-status-badge" id="s4-token-badge">${escapeHTML(tokenText)}</span>` : ''}
    `;

    toolbarEl.innerHTML = `
      <button type="button" class="btn-sm" id="s4-btn-regenerate">🔄 Tạo lại</button>
      <button type="button" class="btn-primary btn-sm" id="s4-btn-ai-fix" style="display:none; background:var(--warning, #d97706); border-color:var(--warning, #d97706);">
        🛠️ Nhờ AI sửa lỗi
      </button>
      <button type="button" class="btn-sm" id="s4-btn-download">📥 Tải về .html</button>
      <button type="button" class="btn-sm" id="s4-btn-fullscreen">⛶ Toàn màn hình</button>
      <button type="button" class="btn-danger btn-sm" id="s4-btn-delete-anim">🗑️ Xóa bản này</button>
      <button type="button" class="btn-sm" id="s4-btn-close-viewer">Đóng</button>
    `;

    bodyEl.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.className = 's4-iframe';
    // Khung cách ly tuyệt đối: CHỈ allow-scripts, KHÔNG allow-same-origin
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.srcdoc = sessionData.htmlDoc;
    bodyEl.appendChild(iframe);
    S4_STATE.activeSession.iframeEl = iframe;

    backdrop.classList.add('s4-open');

    // Sự kiện nút "Tạo lại" -> mở thanh nhập "Yêu cầu chỉnh sửa"
    document.getElementById('s4-btn-regenerate').onclick = () => {
      if (subbarEl.classList.contains('s4-open')) {
        subbarEl.classList.remove('s4-open');
        return;
      }
      subbarEl.classList.add('s4-open');
      subbarEl.innerHTML = `
        <input type="text" id="s4-inp-modify-req" style="flex:1; min-width:220px;"
               placeholder="Nhập yêu cầu chỉnh sửa (VD: thêm ma sát, làm chậm lại, đổi màu vector lực)...">
        <button type="button" class="btn-primary btn-sm" id="s4-btn-submit-modify">⚡ Gửi yêu cầu sửa (Tốn 1 lượt AI)</button>
        <button type="button" class="btn-sm" id="s4-btn-cancel-modify">Hủy</button>
      `;
      document.getElementById('s4-btn-cancel-modify').onclick = () => subbarEl.classList.remove('s4-open');
      document.getElementById('s4-btn-submit-modify').onclick = async () => {
        const modReq = (document.getElementById('s4-inp-modify-req')?.value || '').trim();
        subbarEl.classList.remove('s4-open');
        await runGenerateWorkflow({
          folder: sessionData.folder,
          meta: sessionData.meta,
          probId: sessionData.probId,
          prob: sessionData.prob,
          rawFigUrl: sessionData.rawFigUrl,
          sendImg: false,
          extraReq: modReq || 'Thiết kế lại mô hình rõ ràng và trực quan hơn',
          previousJs: sessionData.jsCode,
          errorToFix: null
        });
      };
    };

    // Sự kiện nút "Nhờ AI sửa lỗi" (chỉ xuất hiện khi có sim-error)
    document.getElementById('s4-btn-ai-fix').onclick = async () => {
      if (!S4_STATE.activeSession) return;
      const errMsg = S4_STATE.activeSession.lastErrorMessage || 'Lỗi runtime trong Sim.init';
      await runGenerateWorkflow({
        folder: sessionData.folder,
        meta: sessionData.meta,
        probId: sessionData.probId,
        prob: sessionData.prob,
        rawFigUrl: sessionData.rawFigUrl,
        sendImg: false,
        extraReq: '',
        previousJs: sessionData.jsCode,
        errorToFix: errMsg
      });
    };

    // Sự kiện nút "Tải về .html"
    document.getElementById('s4-btn-download').onclick = () => {
      const blob = new Blob([sessionData.htmlDoc], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mechastudy-sim-${sessionData.probId}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };

    // Sự kiện nút "Toàn màn hình"
    document.getElementById('s4-btn-fullscreen').onclick = () => {
      if (!document.fullscreenElement) {
        modal.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    };

    // Sự kiện nút "Xóa bản này"
    document.getElementById('s4-btn-delete-anim').onclick = async () => {
      await handleDeleteSavedAnimation(sessionData.folder, sessionData.probId);
    };

    document.getElementById('s4-btn-close-viewer').onclick = closeViewerModal;
  }

  /**
   * Lắng nghe sự kiện postMessage từ iframe cách ly.
   * Chỉ chấp nhận khi event.source đúng là contentWindow của iframe đang mở.
   */
  function handleIframePostMessage(event) {
    const sess = S4_STATE.activeSession;
    if (!sess || !sess.iframeEl || event.source !== sess.iframeEl.contentWindow) {
      return;
    }

    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'sim-error') {
      sess.hasRuntimeError = true;
      sess.lastErrorMessage = String(msg.message || 'Lỗi thực thi trong mô phỏng');
      if (sess.saveTimer) {
        clearTimeout(sess.saveTimer);
        sess.saveTimer = null;
      }

      const badge = document.getElementById('s4-sync-badge');
      if (badge) {
        badge.className = 's4-status-badge s4-err';
        badge.textContent = '⚠️ Có lỗi khi chạy (Không tự lưu)';
      }

      const fixBtn = document.getElementById('s4-btn-ai-fix');
      if (fixBtn) {
        fixBtn.style.display = 'inline-block';
      }
    } else if (msg.type === 'sim-ready') {
      if (sess.isNewUnsaved && !sess.hasRuntimeError) {
        if (sess.saveTimer) clearTimeout(sess.saveTimer);
        // Chờ 2 giây sau 'sim-ready' không có 'sim-error' thì tự động lưu
        sess.saveTimer = setTimeout(() => {
          if (S4_STATE.activeSession === sess && !sess.hasRuntimeError) {
            persistValidSimulation(sess);
          }
        }, 2000);
      }
    }
  }


  /* ==========================================================================
     7. LƯU TRỮ (Tự lưu sau 2s sạch lỗi vào IndexedDB & GitHub, Xử lý xung đột 409/422)
     ========================================================================== */

  async function persistValidSimulation(sess) {
    const { folder, meta, probId, htmlDoc } = sess;
    if (!folder || !probId || !htmlDoc || sess.hasRuntimeError) return;

    sess.isNewUnsaved = false;
    const idbKey = `anim:${folder}/${probId}`;
    const badge = document.getElementById('s4-sync-badge');

    // 1. Lưu ngay vào IndexedDB
    try {
      await dbSet(idbKey, htmlDoc);
    } catch (e) {}

    markAnimExistenceInCache(folder, probId, true);
    updateButtonsByProbIdInDOM(probId, true);

    // 2. Đồng bộ lên GitHub tại buildPaths(...).anim(ID)
    if (!checkGitHubReady()) {
      if (badge) {
        badge.className = 's4-status-badge s4-local';
        badge.textContent = 'Lưu cục bộ, chưa đồng bộ được';
      }
      return;
    }

    let animRepoPath = `${folder}/anim/${probId}.html`;
    if (meta && meta.ngay && meta.hash8 && typeof buildPaths === 'function') {
      try {
        animRepoPath = buildPaths(meta.ngay, meta.hash8).anim(probId);
      } catch (e) {}
    }

    if (badge) {
      badge.className = 's4-status-badge s4-local';
      badge.textContent = '☁️ Đang lưu lên đám mây...';
    }

    try {
      await putAnimFileWithConflictRetry(animRepoPath, htmlDoc, `Lưu mô hình động ${probId}.html`);
      if (badge) {
        badge.className = 's4-status-badge s4-cloud';
        badge.textContent = 'Đã lưu lên đám mây';
      }
    } catch (err) {
      if (badge) {
        badge.className = 's4-status-badge s4-local';
        badge.textContent = 'Lưu cục bộ, chưa đồng bộ được';
      }
    }
  }

  /**
   * Ghi file HTML mô hình động lên GitHub; nếu gặp xung đột 409/422 thì đọc lại sha rồi thử lại tối đa 2 lần
   */
  async function putAnimFileWithConflictRetry(path, contentString, message) {
    let retries = 0;
    let currentSha = undefined;

    const existing = await ghGetFile(path);
    if (existing && existing.sha) {
      currentSha = existing.sha;
    }

    while (true) {
      try {
        return await ghPutFile(path, contentString, message, currentSha);
      } catch (err) {
        const isConflict = (err && (err.code === 409 || err.code === 422)) ||
                           /409|422|xung đột/i.test(String(err?.message || ''));
        if (isConflict && retries < 2) {
          retries++;
          currentSha = err.latestSha;
          if (!currentSha) {
            const latest = await ghGetFile(path);
            currentSha = latest ? latest.sha : undefined;
          }
          await sleep(300 * retries);
          continue;
        }
        throw err;
      }
    }
  }

  async function handleDeleteSavedAnimation(folder, probId) {
    if (!confirm(`⚠️ Bạn có chắc chắn muốn xóa mô hình động của bài "${probId}" khỏi đám mây và bộ nhớ máy không?`)) {
      return;
    }

    const cleanFolder = String(folder || '').replace(/\/+$/, '');
    const idbKey = `anim:${cleanFolder}/${probId}`;
    const ghPath = `${cleanFolder}/anim/${probId}.html`;

    try {
      if (checkGitHubReady()) {
        const existing = await ghGetFile(ghPath);
        if (existing && existing.sha) {
          await ghDeleteFile(ghPath, existing.sha, `Xóa mô hình động ${probId}.html`);
        }
      }
      await dbDelete(idbKey);
      markAnimExistenceInCache(cleanFolder, probId, false);
      updateButtonsByProbIdInDOM(probId, false);
      closeViewerModal();
    } catch (err) {
      alert('Lỗi khi xóa mô hình động: ' + err.message);
    }
  }


  /* ==========================================================================
     8. TIỆN ÍCH & XUẤT API (Đổi blob URL sang dataURL, Mở theo folder/probId, Xuất window.MechaStage4)
     ========================================================================== */

  function checkGitHubReady() {
    if (typeof window.isGitHubConfigured === 'function') {
      try { return Boolean(window.isGitHubConfigured()); } catch (e) {}
    }
    try {
      const s = loadSettings();
      return Boolean(s && s.github && s.github.owner && s.github.repo && s.github.token);
    } catch (e) {
      return false;
    }
  }

  /**
   * Đảm bảo ảnh gửi cho AI luôn ở dạng dataURL (nếu là blob URL thì đổi bằng fetch + FileReader)
   */
  async function ensureDataUrlFromImageSource(imgSrc) {
    if (!imgSrc || typeof imgSrc !== 'string') return null;
    if (imgSrc.startsWith('data:')) return imgSrc;

    try {
      const response = await fetch(imgSrc);
      const blob = await response.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return null;
    }
  }

  function formatTokenUsage(usage) {
    if (!usage) return '0';
    const inp = Number(usage.inputTokens) || 0;
    const out = Number(usage.outputTokens) || 0;
    const tot = Number(usage.totalTokens) || (inp + out);
    return `${tot} (In: ${inp}, Out: ${out})`;
  }

  /**
   * Hàm công khai MechaStage4.open(folder, probId)
   * Tự tìm dữ liệu bài tập từ DOM, IndexedDB hoặc GitHub rồi mở mô hình (hoặc hộp tạo mới)
   */
  async function publicOpen(folder, probId) {
    const cleanFolder = String(folder || '').replace(/\/+$/, '');
    const cleanId = String(probId || '');
    if (!cleanFolder || !cleanId) {
      throw new Error('Cần truyền đủ folder và probId vào MechaStage4.open(folder, probId).');
    }

    let meta = null;
    let prob = null;
    let rawFigUrl = '';

    // 1. Thử tìm trong cache IndexedDB của Chặng 3 hoặc Chặng 2
    const hashMatch = cleanFolder.match(/_([a-f0-9]{8})$/i);
    const hash8 = hashMatch ? hashMatch[1] : null;

    const cachedLib = await dbGet(`lib:detail:${cleanFolder}`);
    if (cachedLib && cachedLib.baitap) {
      meta = cachedLib.meta || {};
      prob = (cachedLib.baitap.danh_sach_bai || []).find(b => String(b.id) === cleanId);
      const cachedFig = await dbGet(`lib:fig:${cleanFolder}:${cleanId}`);
      if (cachedFig) rawFigUrl = cachedFig;
    }

    if (!prob && hash8) {
      const cachedS2 = await dbGet(`result:${hash8}`);
      if (cachedS2 && cachedS2.baitap) {
        meta = cachedS2.meta || {};
        prob = (cachedS2.baitap.danh_sach_bai || []).find(b => String(b.id) === cleanId);
        rawFigUrl = cachedS2.figureUrls?.[cleanId] || '';
      }
    }

    // 2. Nếu chưa có trong cache thì đọc meta.json và baitap.json từ GitHub
    if (!prob && checkGitHubReady()) {
      const [mRes, btRes] = await Promise.all([
        ghGetFile(`${cleanFolder}/meta.json`),
        ghGetFile(`${cleanFolder}/baitap.json`)
      ]);
      if (mRes && mRes.content) meta = JSON.parse(mRes.content);
      if (btRes && btRes.content) {
        const bt = JSON.parse(btRes.content);
        prob = (bt.danh_sach_bai || []).find(b => String(b.id) === cleanId);
      }
    }

    if (!prob) {
      prob = { id: cleanId, nhan: cleanId, de_tom_tat: '', du_kien: [], can_tim: [], loi_giai: [], dap_so: [] };
    }

    await openOrPromptModel({
      folder: cleanFolder,
      meta: meta || {},
      probId: cleanId,
      prob,
      rawFigUrl
    });
  }

  // Xuất duy nhất window.MechaStage4 theo đúng yêu cầu
  window.MechaStage4 = {
    open: (folder, probId) => publicOpen(folder, probId),
    generate: (opts) => generate(opts),
    buildSimDocument: (js, id) => buildSimDocument(js, id),
    SIM_LIB_JS
  };

  if (document.readyState !== 'loading') {
    initStage4();
  } else {
    document.addEventListener('DOMContentLoaded', initStage4);
  }
})();