/**
 * MechaStudy - CHẶNG 3 (stage3.js)
 * Thư viện Môn → Chương, Dòng thời gian, Tìm kiếm sâu, Quản lý & Sao lưu dữ liệu
 * Tương thích hoàn toàn với index.html (Chặng 1) và stage2.js (Chặng 2).
 */
(function () {
  'use strict';

  /* ==========================================================================
     1. KHỞI TẠO (Trạng thái cục bộ, Inject CSS s3-, Khung giao diện Sidebar & Khu chính)
     ========================================================================== */

  const S3_STATE = {
    sidebarTab: 'tree', // 'tree' | 'timeline'
    mainView: 'none',   // 'none' | 'chapter' | 'timeline' | 'search' | 'detail'
    prevMainView: 'none',
    subjects: { mon_hoc: [] },
    monthFiles: [],            // Danh sách [{ month: 'YYYY-MM', path: 'index/YYYY-MM.json', sha, loaded }]
    indexByMonth: {},          // { 'YYYY-MM': [ item, ... ] }
    allItems: [],              // Mảng phẳng gộp từ các tháng đã tải, sắp xếp mới nhất trước
    collapsedSubjects: {},     // { 'Tên môn': boolean }
    selectedChapter: null,     // { mon_hoc, so, ten }
    chapterTab: 'lecture',     // 'lecture' | 'exercises'
    chapterDetailCache: {},    // { '<duong_dan>': { meta, kienthuc, baitap } }
    searchQuery: '',
    activeHashtags: [],        // Mảng các hashtag đang chọn lọc (AND)
    dateFrom: '',
    dateTo: '',
    deepSearchRunning: false,
    deepSearchAbort: false,
    deepSearchMatches: null,   // Map duong_dan -> mảng chuỗi khớp trong bài tập
    offlineMode: false,
    offlineReason: '',
    katexPromise: null,
    activeBlobUrls: [],
    paginationLimit: 30
  };

  /**
   * Khung chương trình chuẩn ngành Kỹ thuật Cơ điện tử - ĐHQGHN (VNU-UET)
   */
  const VNU_MECHATRONICS_CURRICULUM = [
    {
      ten: 'Cơ kỹ thuật & Cơ học máy',
      chuong: [
        { so: 1, ten: 'Tĩnh học & Cân bằng hệ lực (FBD, Phản lực liên kết)' },
        { so: 2, ten: 'Động học điểm & Vật rắn (Chuyển động phẳng, Vận tốc góc)' },
        { so: 3, ten: 'Cơ cấu 4 khâu bản lề & Con trượt thanh truyền' },
        { so: 4, ten: 'Động lực học & Phương trình vi phân Lagrange' },
        { so: 5, ten: 'Dao động cơ học (Hệ lò xo - giảm chấn, Cộng hưởng)' }
      ]
    },
    {
      ten: 'Kỹ thuật Điện tử & Mạch',
      chuong: [
        { so: 1, ten: 'Mạch điện RLC & Quá độ cấp 1, cấp 2' },
        { so: 2, ten: 'Diode, Transistor BJT & MOSFET công tắc' },
        { so: 3, ten: 'Khuếch đại thuật toán (Op-Amp) & Lọc tích cực' },
        { so: 4, ten: 'Mạch dao động & Cầu H điều khiển động cơ' }
      ]
    },
    {
      ten: 'Lý thuyết Điều khiển tự động & MATLAB',
      chuong: [
        { so: 1, ten: 'Mô hình hóa toán học, Hàm truyền đạt G(s)' },
        { so: 2, ten: 'Đáp ứng quá độ (Step response) & Ổn định Routh' },
        { so: 3, ten: 'Quỹ đạo nghiệm số (Root Locus) & Đồ thị Bode' },
        { so: 4, ten: 'Thiết kế bộ điều khiển PID & Không gian trạng thái' }
      ]
    },
    {
      ten: 'Cảm biến & Cơ cấu chấp hành',
      chuong: [
        { so: 1, ten: 'Cảm biến đo dịch chuyển, góc quay (Encoder, LVDT)' },
        { so: 2, ten: 'Cảm biến lực, gia tốc (Strain gauge, MEMS IMU)' },
        { so: 3, ten: 'Động cơ DC, Động cơ bước & Servo cơ điện tử' }
      ]
    }
  ];

  function injectStage3Styles() {
    if (document.getElementById('s3-styles')) return;
    const style = document.createElement('style');
    style.id = 's3-styles';
    style.textContent = `
      /* Bố cục lại Sidebar cho Thư viện Chặng 3 */
      aside#sidebar.s3-sidebar-ready {
        width: 310px;
        padding: 0;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: stretch;
        text-align: left;
        color: var(--text-main, #0f172a);
        background: var(--bg-sidebar, #f1f5f9);
        overflow: hidden;
      }
      .s3-sb-top {
        padding: 12px;
        border-bottom: 1px solid var(--border, #e2e8f0);
        background: var(--bg-panel, #ffffff);
        flex-shrink: 0;
      }
      .s3-sb-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .s3-sb-title {
        font-weight: 700;
        font-size: 0.96rem;
        color: var(--primary, #2563eb);
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .s3-search-box {
        display: flex;
        gap: 6px;
        margin-bottom: 8px;
      }
      .s3-search-box input {
        padding: 6px 9px;
        font-size: 0.85rem;
      }
      .s3-tabs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
        background: var(--bg-sidebar, #f1f5f9);
        padding: 3px;
        border-radius: var(--radius, 8px);
        border: 1px solid var(--border, #e2e8f0);
      }
      .s3-tab-btn {
        border: none;
        background: transparent;
        padding: 5px 8px;
        font-size: 0.8rem;
        font-weight: 600;
        border-radius: 6px;
        color: var(--text-muted, #64748b);
        cursor: pointer;
      }
      .s3-tab-btn.s3-active {
        background: var(--bg-panel, #ffffff);
        color: var(--primary, #2563eb);
        box-shadow: 0 1px 2px rgba(0,0,0,0.08);
      }
      .s3-sb-tags {
        padding: 8px 12px;
        border-bottom: 1px solid var(--border, #e2e8f0);
        max-height: 92px;
        overflow-y: auto;
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        flex-shrink: 0;
      }
      .s3-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        font-size: 0.74rem;
        border-radius: 999px;
        border: 1px solid var(--border, #cbd5e1);
        background: var(--bg-panel, #ffffff);
        color: var(--text-main, #0f172a);
        cursor: pointer;
        user-select: none;
      }
      .s3-chip.s3-active {
        background: var(--primary, #2563eb);
        color: #ffffff;
        border-color: var(--primary, #2563eb);
      }
      .s3-sb-body {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
      }
      .s3-sb-footer {
        padding: 10px 12px;
        border-top: 1px solid var(--border, #e2e8f0);
        background: var(--bg-panel, #ffffff);
        flex-shrink: 0;
        font-size: 0.76rem;
        color: var(--text-muted, #64748b);
      }
      .s3-subj-group {
        margin-bottom: 8px;
        border: 1px solid var(--border, #e2e8f0);
        border-radius: var(--radius, 8px);
        background: var(--bg-panel, #ffffff);
        overflow: hidden;
      }
      .s3-subj-header {
        padding: 8px 10px;
        font-weight: 700;
        font-size: 0.86rem;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--bg-panel, #ffffff);
        user-select: none;
      }
      .s3-subj-header:hover {
        color: var(--primary, #2563eb);
      }
      .s3-chap-list {
        border-top: 1px solid var(--border, #e2e8f0);
        padding: 4px;
        background: var(--bg-main, #f8fafc);
      }
      .s3-chap-item {
        padding: 6px 8px;
        border-radius: 6px;
        font-size: 0.82rem;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 6px;
        margin-bottom: 2px;
      }
      .s3-mini-del {
        border: none; background: transparent; cursor: pointer;
        font-size: 0.9rem; padding: 2px 6px; margin-left: 6px;
        border-radius: 6px; opacity: 0.8; flex-shrink: 0;
      }
      .s3-mini-del:hover { background: rgba(220, 38, 38, 0.14); opacity: 1; }
      .s3-chap-item:hover {
        background: var(--bg-sidebar, #e2e8f0);
      }
      .s3-chap-item.s3-active {
        background: var(--primary, #2563eb);
        color: #ffffff;
        font-weight: 600;
      }
      .s3-chap-count {
        font-size: 0.72rem;
        padding: 1px 6px;
        border-radius: 999px;
        background: rgba(100,116,139,0.16);
        white-space: nowrap;
      }
      .s3-chap-item.s3-active .s3-chap-count {
        background: rgba(255,255,255,0.25);
        color: #ffffff;
      }
      /* Khu vực hiển thị chính của Thư viện */
      #s3-main-workspace {
        margin-bottom: 18px;
      }
      .s3-panel {
        background: var(--bg-panel, #ffffff);
        border: 1px solid var(--border, #e2e8f0);
        border-radius: var(--radius, 8px);
        padding: 18px;
        box-shadow: var(--shadow, 0 4px 6px -1px rgba(0,0,0,0.1));
        margin-bottom: 16px;
      }
      .s3-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 10px;
        padding-bottom: 12px;
        margin-bottom: 14px;
        border-bottom: 1px solid var(--border, #e2e8f0);
      }
      .s3-panel-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--primary, #2563eb);
      }
      .s3-subtabs {
        display: inline-flex;
        gap: 6px;
        margin-bottom: 14px;
      }
      .s3-subtab-btn {
        padding: 6px 14px;
        border-radius: var(--radius, 8px);
        font-weight: 600;
        font-size: 0.86rem;
        cursor: pointer;
        border: 1px solid var(--border, #e2e8f0);
        background: var(--bg-main, #f8fafc);
        color: var(--text-main, #0f172a);
      }
      .s3-subtab-btn.s3-active {
        background: var(--primary, #2563eb);
        color: #ffffff;
        border-color: var(--primary, #2563eb);
      }
      .s3-item-card {
        border: 1px solid var(--border, #e2e8f0);
        border-radius: var(--radius, 8px);
        padding: 12px 14px;
        margin-bottom: 10px;
        background: var(--bg-main, #f8fafc);
        transition: border-color 0.15s;
      }
      .s3-item-card:hover {
        border-color: var(--primary, #2563eb);
      }
      .s3-item-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 8px;
        flex-wrap: wrap;
      }
      .s3-item-title {
        font-weight: 700;
        font-size: 0.96rem;
        color: var(--text-main, #0f172a);
        cursor: pointer;
      }
      .s3-item-title:hover {
        color: var(--primary, #2563eb);
        text-decoration: underline;
      }
      .s3-meta-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 6px;
        font-size: 0.8rem;
        color: var(--text-muted, #64748b);
      }
      .s3-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
        background: var(--bg-sidebar, #f1f5f9);
        border: 1px solid var(--border, #e2e8f0);
        color: var(--text-main, #0f172a);
      }
      .s3-banner {
        padding: 10px 12px;
        border-radius: var(--radius, 8px);
        font-size: 0.86rem;
        margin-bottom: 12px;
        border: 1px solid var(--border, #e2e8f0);
        background: var(--bg-sidebar, #f1f5f9);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .s3-banner-warn {
        border-color: var(--warning, #d97706);
        background: rgba(217, 119, 6, 0.1);
        color: var(--warning, #d97706);
      }
      .s3-banner-err {
        border-color: var(--danger, #dc2626);
        background: rgba(220, 38, 38, 0.1);
        color: var(--danger, #dc2626);
      }
      .s3-table {
        width: 100%;
        border-collapse: collapse;
        margin: 8px 0 14px 0;
        font-size: 0.88rem;
      }
      .s3-table th, .s3-table td {
        border: 1px solid var(--border, #e2e8f0);
        padding: 8px 10px;
        text-align: left;
        vertical-align: top;
      }
      .s3-table th {
        background: var(--bg-sidebar, #f1f5f9);
        font-weight: 600;
      }
      .s3-math-box {
        padding: 4px 6px;
        background: var(--bg-panel, #ffffff);
        border: 1px dashed var(--border, #cbd5e1);
        border-radius: 4px;
        overflow-x: auto;
      }
      .s3-time-group-title {
        font-size: 0.88rem;
        font-weight: 700;
        color: var(--primary, #2563eb);
        margin: 12px 0 6px 0;
        padding-bottom: 4px;
        border-bottom: 1px dashed var(--border, #cbd5e1);
      }
      .s3-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.55);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 120;
        padding: 16px;
      }
      .s3-modal-backdrop.s3-open {
        display: flex;
      }
      .s3-modal {
        background: var(--bg-panel, #ffffff);
        border: 1px solid var(--border, #e2e8f0);
        border-radius: var(--radius, 8px);
        max-width: 520px;
        width: 100%;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: var(--shadow, 0 4px 6px rgba(0,0,0,0.2));
      }
      .s3-modal-header {
        padding: 12px 16px;
        border-bottom: 1px solid var(--border, #e2e8f0);
        font-weight: 700;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .s3-modal-body {
        padding: 16px;
        overflow-y: auto;
      }
      .s3-modal-footer {
        padding: 12px 16px;
        border-top: 1px solid var(--border, #e2e8f0);
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
      .s3-progress-wrap {
        width: 100%;
        height: 8px;
        background: var(--bg-sidebar, #e2e8f0);
        border-radius: 999px;
        overflow: hidden;
        margin: 6px 0;
      }
      .s3-progress-bar {
        height: 100%;
        background: var(--primary, #2563eb);
        width: 0%;
        transition: width 0.2s;
      }
    `;
    document.head.appendChild(style);
  }

  async function initStage3() {
    injectStage3Styles();
    setupSidebarDOM();
    setupMainWorkspaceDOM();
    setupModalDOM();

    // Bước 1: Đọc ngay dữ liệu từ IndexedDB cache (lib:*) và vẽ ngay lập tức
    await loadAllFromLocalCache();
    renderSidebarAll();

    // Bước 2: Làm mới nền (Stale-while-revalidate) từ GitHub
    await revalidateFromGitHub(false);
  }

  function setupSidebarDOM() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    sidebar.classList.add('s3-sidebar-ready');
    sidebar.innerHTML = `
      <div class="s3-sb-top">
        <div class="s3-sb-title-row">
          <span class="s3-sb-title">📚 Thư viện học tập</span>
          <button type="button" class="btn-sm" id="s3-btn-sync" title="Đồng bộ lại với GitHub">🔄 Đồng bộ</button>
        </div>

        <div class="s3-search-box">
          <input type="text" id="s3-search-input" placeholder="Tìm tên bài, môn, chương, #tag...">
          <button type="button" class="btn-sm" id="s3-btn-open-search" title="Mở bảng tìm kiếm & tìm sâu">🔍</button>
        </div>

        <div class="s3-tabs">
          <button type="button" class="s3-tab-btn s3-active" id="s3-tab-tree">Môn → Chương</button>
          <button type="button" class="s3-tab-btn" id="s3-tab-timeline">Theo thời gian</button>
        </div>
      </div>

      <!-- Dải chip Hashtag nhanh -->
      <div class="s3-sb-tags" id="s3-sb-hashtags" style="display:none;"></div>

      <!-- Thân danh sách cây hoặc dòng thời gian -->
      <div class="s3-sb-body" id="s3-sb-body">
        <div style="padding:12px; color:var(--text-muted); font-size:0.85rem;">Đang tải thư viện...</div>
      </div>

      <!-- Chân sidebar: Sao lưu & Nhắc nhở định kỳ -->
      <div class="s3-sb-footer">
        <div style="display:flex; gap:6px; margin-bottom:6px;">
          <button type="button" class="btn-sm" style="flex:1;" id="s3-btn-export-backup">📤 Xuất sao lưu</button>
          <button type="button" class="btn-sm" style="flex:1;" id="s3-btn-import-backup">📥 Nhập sao lưu</button>
          <input type="file" id="s3-inp-backup-file" accept=".json,application/json" style="display:none;">
        </div>
        <div>💡 Nhắc nhở: Hãy xuất sao lưu định kỳ để bảo vệ danh mục và ghi chú học tập của bạn.</div>
      </div>
    `;

    document.getElementById('s3-btn-sync').addEventListener('click', () => reloadLibrary(true));

    const searchInp = document.getElementById('s3-search-input');
    searchInp.addEventListener('input', (e) => {
      S3_STATE.searchQuery = e.target.value;
      S3_STATE.paginationLimit = 30;
      renderSidebarAll();
      if (S3_STATE.searchQuery.trim() || S3_STATE.activeHashtags.length > 0 || S3_STATE.mainView === 'search') {
        S3_STATE.mainView = 'search';
        renderMainWorkspace();
      }
    });

    document.getElementById('s3-btn-open-search').addEventListener('click', async () => {
      S3_STATE.mainView = 'search';
      renderMainWorkspace();
      await ensureAllMonthsLoaded();
    });

    document.getElementById('s3-tab-tree').addEventListener('click', () => {
      S3_STATE.sidebarTab = 'tree';
      document.getElementById('s3-tab-tree').classList.add('s3-active');
      document.getElementById('s3-tab-timeline').classList.remove('s3-active');
      renderSidebarBody();
    });

    document.getElementById('s3-tab-timeline').addEventListener('click', async () => {
      S3_STATE.sidebarTab = 'timeline';
      document.getElementById('s3-tab-timeline').classList.add('s3-active');
      document.getElementById('s3-tab-tree').classList.remove('s3-active');
      S3_STATE.mainView = 'timeline';
      renderSidebarBody();
      renderMainWorkspace();
      await ensureAllMonthsLoaded();
    });

    document.getElementById('s3-btn-export-backup').addEventListener('click', handleExportBackup);
    const backupInp = document.getElementById('s3-inp-backup-file');
    document.getElementById('s3-btn-import-backup').addEventListener('click', () => backupInp.click());
    backupInp.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleImportBackupFile(e.target.files[0]);
        e.target.value = '';
      }
    });
  }

  function setupMainWorkspaceDOM() {
    const mainEl = document.getElementById('main-content');
    if (!mainEl || document.getElementById('s3-main-workspace')) return;

    const ws = document.createElement('div');
    ws.id = 's3-main-workspace';
    ws.style.display = 'none';

    // Đặt vùng hiển thị Thư viện ngay sau thẻ nộp bài của Chặng 2 (nếu có) hoặc đầu main-content
    const s2Root = document.getElementById('s2-root-container');
    if (s2Root && s2Root.nextSibling) {
      mainEl.insertBefore(ws, s2Root.nextSibling);
    } else if (s2Root) {
      mainEl.appendChild(ws);
    } else {
      mainEl.insertBefore(ws, mainEl.firstChild);
    }
  }

  function setupModalDOM() {
    if (document.getElementById('s3-modal-backdrop')) return;
    const modalWrap = document.createElement('div');
    modalWrap.className = 's3-modal-backdrop';
    modalWrap.id = 's3-modal-backdrop';
    modalWrap.innerHTML = `
      <div class="s3-modal">
        <div class="s3-modal-header">
          <span id="s3-modal-title">Quản lý mục học tập</span>
          <button type="button" class="btn-sm" id="s3-modal-close">✕</button>
        </div>
        <div class="s3-modal-body" id="s3-modal-body"></div>
        <div class="s3-modal-footer" id="s3-modal-footer"></div>
      </div>
    `;
    document.body.appendChild(modalWrap);
    document.getElementById('s3-modal-close').onclick = closeS3Modal;
  }

  function openS3Modal(title, bodyHtml, footerButtons) {
    document.getElementById('s3-modal-title').textContent = title;
    document.getElementById('s3-modal-body').innerHTML = bodyHtml;
    const footer = document.getElementById('s3-modal-footer');
    footer.innerHTML = '';
    (footerButtons || []).forEach(b => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = b.className || '';
      btn.textContent = b.label;
      btn.onclick = b.onClick;
      footer.appendChild(btn);
    });
    document.getElementById('s3-modal-backdrop').classList.add('s3-open');
  }

  function closeS3Modal() {
    document.getElementById('s3-modal-backdrop').classList.remove('s3-open');
  }


  /* ==========================================================================
     2. CACHE (IndexedDB với tiền tố riêng "lib:" không đụng chạm Chặng 2)
     ========================================================================== */

  const LIB_KEYS = {
    SUBJECTS: 'lib:subjects',
    MONTH_LIST: 'lib:months',
    INDEX_PREFIX: 'lib:index:',         // lib:index:YYYY-MM -> { sha, items }
    DETAIL_PREFIX: 'lib:detail:',       // lib:detail:<duong_dan> -> { meta, kienthuc, baitap }
    FIG_PREFIX: 'lib:fig:'              // lib:fig:<duong_dan>:<idBai> -> dataURL
  };

  async function loadAllFromLocalCache() {
    try {
      const cachedSubj = await dbGet(LIB_KEYS.SUBJECTS);
      if (cachedSubj && cachedSubj.data && Array.isArray(cachedSubj.data.mon_hoc)) {
        S3_STATE.subjects = cachedSubj.data;
      }

      const cachedMonths = await dbGet(LIB_KEYS.MONTH_LIST);
      if (Array.isArray(cachedMonths)) {
        S3_STATE.monthFiles = cachedMonths;
      }

      const idxKeys = await dbKeys(LIB_KEYS.INDEX_PREFIX);
      for (const k of idxKeys) {
        const month = k.slice(LIB_KEYS.INDEX_PREFIX.length);
        const entry = await dbGet(k);
        if (entry && Array.isArray(entry.items)) {
          S3_STATE.indexByMonth[month] = entry.items;
          const mObj = S3_STATE.monthFiles.find(m => m.month === month);
          if (mObj) mObj.loaded = true;
          else S3_STATE.monthFiles.push({ month, path: `index/${month}.json`, sha: entry.sha || '', loaded: true });
        }
      }

      rebuildFlatItemsAndSubjects();
    } catch (e) {
      /* Bỏ qua nếu cache lần đầu chưa có */
    }
  }

  function rebuildFlatItemsAndSubjects() {
    const mapById = new Map();
    const months = Object.keys(S3_STATE.indexByMonth).sort().reverse();

    for (const m of months) {
      const arr = S3_STATE.indexByMonth[m] || [];
      for (const item of arr) {
        if (item && item.duong_dan) {
          const key = item.id || item.duong_dan;
          if (!mapById.has(key)) {
            mapById.set(key, normalizeIndexItem(item));
          }
        }
      }
    }

    S3_STATE.allItems = Array.from(mapById.values()).sort((a, b) => {
      const dComp = String(b.ngay || '').localeCompare(String(a.ngay || ''));
      if (dComp !== 0) return dComp;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });

    // Đảm bảo cây môn học luôn có sẵn khung chương trình chuẩn Cơ điện tử VNU
    if (!S3_STATE.subjects || !Array.isArray(S3_STATE.subjects.mon_hoc) || S3_STATE.subjects.mon_hoc.length === 0) {
      S3_STATE.subjects = { mon_hoc: JSON.parse(JSON.stringify(VNU_MECHATRONICS_CURRICULUM)) };
    }
    for (const item of S3_STATE.allItems) {
      const monName = item.mon_hoc || 'Chưa phân loại';
      const chSo = Number(item.chuong?.so) || 1;
      const chTen = item.chuong?.ten || `Chương ${chSo}`;

      let subj = S3_STATE.subjects.mon_hoc.find(
        s => normalizeSearchText(s.ten) === normalizeSearchText(monName)
      );
      if (!subj) {
        subj = { ten: monName, chuong: [] };
        S3_STATE.subjects.mon_hoc.push(subj);
      }
      if (!Array.isArray(subj.chuong)) subj.chuong = [];
      let chap = subj.chuong.find(c => Number(c.so) === chSo);
      if (!chap) {
        subj.chuong.push({ so: chSo, ten: chTen });
        subj.chuong.sort((a, b) => Number(a.so) - Number(b.so));
      }
    }
  }

  function normalizeIndexItem(raw) {
    const chSo = Number(raw?.chuong?.so) || 1;
    const chTen = raw?.chuong?.ten || `Chương ${chSo}`;
    return {
      id: String(raw.id || ''),
      ngay: String(raw.ngay || ''),
      ten: String(raw.ten || raw.id || 'Phiếu bài tập'),
      mon_hoc: String(raw.mon_hoc || 'Cơ học kỹ thuật'),
      chuong: { so: chSo, ten: String(chTen) },
      hashtags: Array.isArray(raw.hashtags) ? raw.hashtags.map(String) : [],
      so_bai: Number(raw.so_bai) || 0,
      ghi_chu: String(raw.ghi_chu || ''),
      duong_dan: String(raw.duong_dan || '').replace(/\/+$/, '')
    };
  }


  /* ==========================================================================
     3. TẢI CHỈ MỤC (Stale-while-revalidate, Tải trước 2 tháng gần nhất, So sánh SHA)
     ========================================================================== */

  function isGitHubConfigured() {
    try {
      const s = loadSettings();
      return Boolean(s && s.github && s.github.owner && s.github.repo && s.github.token);
    } catch (e) {
      return false;
    }
  }

  async function revalidateFromGitHub(forceAllLoadedMonths = false) {
    if (!isGitHubConfigured()) {
      S3_STATE.offlineMode = true;
      S3_STATE.offlineReason = 'Chưa cấu hình GitHub Token trong Cài đặt — đang xem bản đã lưu trên máy này.';
      renderSidebarAll();
      if (S3_STATE.mainView !== 'none') renderMainWorkspace();
      return;
    }

    try {
      updateSyncStatus('busy', 'Đang đồng bộ thư viện...');

      // 1. Đọc subjects.json
      const subjFile = await ghGetFile('subjects.json');
      if (subjFile && subjFile.content) {
        try {
          const parsedSubj = JSON.parse(subjFile.content);
          if (parsedSubj && Array.isArray(parsedSubj.mon_hoc)) {
            S3_STATE.subjects = parsedSubj;
            await dbSet(LIB_KEYS.SUBJECTS, { sha: subjFile.sha, data: parsedSubj });
          }
        } catch (e) { /* Bỏ qua lỗi parse subjects.json */ }
      }

      // 2. Liệt kê thư mục index/ để biết danh sách các tháng YYYY-MM.json và SHA hiện tại
      const dirItems = await ghListDir('index');
      const monthEntries = (dirItems || [])
        .filter(it => it.type === 'file' && /^\d{4}-\d{2}\.json$/.test(it.name))
        .map(it => ({
          month: it.name.replace('.json', ''),
          path: it.path || `index/${it.name}`,
          sha: it.sha,
          loaded: Boolean(S3_STATE.indexByMonth[it.name.replace('.json', '')])
        }))
        .sort((a, b) => b.month.localeCompare(a.month));

      S3_STATE.monthFiles = monthEntries;
      await dbSet(LIB_KEYS.MONTH_LIST, monthEntries);

      // 3. Tải 2 tháng gần nhất (hoặc các tháng đã mở nếu forceAllLoadedMonths = true)
      const targets = monthEntries.filter((m, idx) => idx < 2 || (forceAllLoadedMonths && m.loaded));
      await Promise.all(targets.map(m => fetchMonthIndexIfChanged(m)));

      S3_STATE.offlineMode = false;
      S3_STATE.offlineReason = '';
      rebuildFlatItemsAndSubjects();
      renderSidebarAll();
      if (S3_STATE.mainView !== 'none') renderMainWorkspace();
      updateSyncStatus('ok', 'Đã kết nối');
    } catch (err) {
      S3_STATE.offlineMode = true;
      S3_STATE.offlineReason = `Đang xem bản đã lưu trên máy này (Không kết nối được GitHub: ${err.message})`;
      updateSyncStatus('err', 'Lỗi');
      renderSidebarAll();
      if (S3_STATE.mainView !== 'none') renderMainWorkspace();
    }
  }

  async function fetchMonthIndexIfChanged(monthEntry) {
    const cacheKey = `${LIB_KEYS.INDEX_PREFIX}${monthEntry.month}`;
    const cached = await dbGet(cacheKey);

    // Chỉ tải lại từ GitHub khi SHA thay đổi hoặc chưa có trong cache
    if (cached && cached.sha && monthEntry.sha && cached.sha === monthEntry.sha && Array.isArray(cached.items)) {
      S3_STATE.indexByMonth[monthEntry.month] = cached.items;
      monthEntry.loaded = true;
      return cached.items;
    }

    const fileRes = await ghGetFile(monthEntry.path);
    if (fileRes && fileRes.content) {
      let arr = [];
      try {
        const parsed = JSON.parse(fileRes.content);
        if (Array.isArray(parsed)) arr = parsed;
      } catch (e) {
        arr = [];
      }
      S3_STATE.indexByMonth[monthEntry.month] = arr;
      monthEntry.sha = fileRes.sha || monthEntry.sha;
      monthEntry.loaded = true;
      await dbSet(cacheKey, { sha: monthEntry.sha, items: arr });
      return arr;
    }
    return [];
  }

  async function ensureAllMonthsLoaded() {
    const unloaded = S3_STATE.monthFiles.filter(m => !m.loaded);
    if (unloaded.length === 0 || !isGitHubConfigured() || S3_STATE.offlineMode) return;

    try {
      updateSyncStatus('busy', 'Đang tải các tháng cũ hơn...');
      await runWithConcurrency(unloaded, 4, async (m) => {
        await fetchMonthIndexIfChanged(m);
      });
      await dbSet(LIB_KEYS.MONTH_LIST, S3_STATE.monthFiles);
      rebuildFlatItemsAndSubjects();
      renderSidebarAll();
      if (S3_STATE.mainView !== 'none') renderMainWorkspace();
      updateSyncStatus('ok', 'Đã kết nối');
    } catch (err) {
      updateSyncStatus('err', 'Lỗi');
    }
  }

  async function reloadLibrary(force = true) {
    await revalidateFromGitHub(force);
  }


  /* ==========================================================================
     4. CÂY MÔN → CHƯƠNG (Sidebar Tree & Khu chính gồm 2 tab: Bài giảng / Bài tập)
     ========================================================================== */

  function renderSidebarAll() {
    renderHashtagChipsBar();
    renderSidebarBody();
  }

  function renderHashtagChipsBar() {
    const bar = document.getElementById('s3-sb-hashtags');
    if (!bar) return;

    // Thống kê toàn bộ hashtag và số lượng file đi kèm
    const tagCounts = new Map();
    for (const item of S3_STATE.allItems) {
      const uniqueTags = new Set((item.hashtags || []).map(t => (t.startsWith('#') ? t : `#${t}`)));
      uniqueTags.forEach(t => {
        tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
      });
    }

    if (tagCounts.size === 0) {
      bar.style.display = 'none';
      return;
    }

    bar.style.display = 'flex';
    const sortedTags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]);

    bar.innerHTML = sortedTags.map(([tag, count]) => {
      const isActive = S3_STATE.activeHashtags.includes(tag);
      return `<span class="s3-chip ${isActive ? 's3-active' : ''}" data-tag="${escapeHTML(tag)}">
        ${escapeHTML(tag)} <small>(${count})</small>
      </span>`;
    }).join('');

    bar.querySelectorAll('.s3-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const tag = chip.getAttribute('data-tag');
        if (!tag) return;
        const idx = S3_STATE.activeHashtags.indexOf(tag);
        if (idx >= 0) S3_STATE.activeHashtags.splice(idx, 1);
        else S3_STATE.activeHashtags.push(tag);

        S3_STATE.paginationLimit = 30;
        if (S3_STATE.activeHashtags.length > 0) {
          S3_STATE.mainView = 'search';
        }
        renderSidebarAll();
        renderMainWorkspace();
      });
    });
  }

  function renderSidebarBody() {
    const bodyEl = document.getElementById('s3-sb-body');
    if (!bodyEl) return;

    const unloadedCount = S3_STATE.monthFiles.filter(m => !m.loaded).length;
    const offlineBannerHtml = S3_STATE.offlineMode
      ? `<div class="s3-banner s3-banner-warn" style="font-size:0.76rem; padding:6px 8px;">
           <span>⚠️ ${escapeHTML(S3_STATE.offlineReason || 'Đang xem bản đã lưu trên máy này')}</span>
           <button type="button" class="btn-sm" id="s3-sb-retry-net">Thử lại</button>
         </div>`
      : '';

    if (S3_STATE.sidebarTab === 'timeline') {
      renderSidebarTimelineSummary(bodyEl, offlineBannerHtml, unloadedCount);
      return;
    }

    // Chế độ Cây Môn -> Chương
    let subjectsList = S3_STATE.subjects?.mon_hoc || [];
    if (subjectsList.length === 0) {
      S3_STATE.subjects = { mon_hoc: JSON.parse(JSON.stringify(VNU_MECHATRONICS_CURRICULUM)) };
      subjectsList = S3_STATE.subjects.mon_hoc;
    }
    const filteredItems = getFilteredIndexItems();

    const noFilterNow = !(S3_STATE.searchQuery.trim() || S3_STATE.activeHashtags.length > 0);
    const emptyChapCount = noFilterNow
      ? subjectsList.reduce((acc, subj) => acc + (subj.chuong || []).filter(ch =>
          !filteredItems.some(it =>
            normalizeSearchText(it.mon_hoc) === normalizeSearchText(subj.ten) &&
            Number(it.chuong?.so) === (Number(ch.so) || 1))).length, 0)
      : 0;

    const groupsHtml = subjectsList.map((subj, sIdx) => {
      const monName = subj.ten || 'Môn học';
      const isCollapsed = Boolean(S3_STATE.collapsedSubjects[monName]);
      const chapters = Array.isArray(subj.chuong) ? subj.chuong : [];

      const chaptersHtml = chapters.map(ch => {
        const chSo = Number(ch.so) || 1;
        const chTen = ch.ten || `Chương ${chSo}`;

        // Tính tổng so_bai của các file thuộc đúng môn + số chương
        const matchingFiles = filteredItems.filter(
          it => normalizeSearchText(it.mon_hoc) === normalizeSearchText(monName) && Number(it.chuong?.so) === chSo
        );

        // Nếu đang tìm kiếm/lọc hashtag mà chương không có bài khớp thì ẩn bớt cho gọn
        if ((S3_STATE.searchQuery.trim() || S3_STATE.activeHashtags.length > 0) && matchingFiles.length === 0) {
          return '';
        }

        const totalExercises = matchingFiles.reduce((acc, it) => acc + (Number(it.so_bai) || 0), 0);
        const isSelected = S3_STATE.mainView === 'chapter' &&
          S3_STATE.selectedChapter &&
          normalizeSearchText(S3_STATE.selectedChapter.mon_hoc) === normalizeSearchText(monName) &&
          Number(S3_STATE.selectedChapter.so) === chSo;

        return `
          <div class="s3-chap-item ${isSelected ? 's3-active' : ''}"
               data-mon="${escapeHTML(monName)}"
               data-so="${chSo}"
               data-ten="${escapeHTML(chTen)}">
            <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              Chương ${chSo}: ${escapeHTML(chTen)}
            </span>
            <span class="s3-chap-count">${totalExercises} bài</span>
            ${matchingFiles.length === 0 ? `<button type="button" class="s3-mini-del" data-act="del-chap" data-mon="${escapeHTML(monName)}" data-so="${chSo}" title="Xóa chương trống này khỏi danh mục">🗑️</button>` : ''}
          </div>
        `;
      }).join('');

      if ((S3_STATE.searchQuery.trim() || S3_STATE.activeHashtags.length > 0) && !chaptersHtml.trim()) {
        return '';
      }

      return `
        <div class="s3-subj-group" data-subj-idx="${sIdx}">
          <div class="s3-subj-header" data-mon="${escapeHTML(monName)}">
            <span>📘 ${escapeHTML(monName)}</span>
            <span style="font-size:0.75rem; color:var(--text-muted); display:flex; align-items:center;">${isCollapsed ? '▶' : '▼'}${(noFilterNow && !filteredItems.some(it => normalizeSearchText(it.mon_hoc) === normalizeSearchText(monName))) ? `<button type="button" class="s3-mini-del" data-act="del-subj" data-mon="${escapeHTML(monName)}" title="Xóa môn trống này khỏi danh mục">🗑️</button>` : ''}</span>
          </div>
          ${!isCollapsed ? `<div class="s3-chap-list">${chaptersHtml || '<div style="padding:6px; font-size:0.78rem; color:var(--text-muted);">Chưa có chương</div>'}</div>` : ''}
        </div>
      `;
    }).join('');

    bodyEl.innerHTML = `
      ${offlineBannerHtml}
      ${groupsHtml || '<div style="padding:12px; color:var(--text-muted); font-size:0.84rem;">Không có chương nào khớp bộ lọc.</div>'}
      ${emptyChapCount > 0 ? `<button type="button" class="btn-sm" style="width:100%; margin-top:8px;" id="s3-btn-clean-empty">🧹 Dọn mục trống (${emptyChapCount} chương)</button>` : ''}
      ${unloadedCount > 0 ? `<button type="button" class="btn-sm" style="width:100%; margin-top:8px;" id="s3-btn-load-older">📂 Xem cũ hơn (${unloadedCount} tháng chưa tải)</button>` : ''}
    `;

    // Sự kiện thu gọn/mở rộng môn học
    bodyEl.querySelectorAll('.s3-subj-header').forEach(hdr => {
      hdr.addEventListener('click', () => {
        const mon = hdr.getAttribute('data-mon');
        S3_STATE.collapsedSubjects[mon] = !S3_STATE.collapsedSubjects[mon];
        renderSidebarBody();
      });
    });

    // Nút xóa chương/môn trống (chặn nổi bọt để không mở chương hay thu gọn môn)
    bodyEl.querySelectorAll('.s3-mini-del').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const mon = btn.getAttribute('data-mon');
        if (btn.getAttribute('data-act') === 'del-subj') {
          deleteEmptySubjectOrChapter(mon, null);
        } else {
          deleteEmptySubjectOrChapter(mon, Number(btn.getAttribute('data-so')) || 1);
        }
      });
    });

    // Sự kiện chọn một chương
    bodyEl.querySelectorAll('.s3-chap-item').forEach(el => {
      el.addEventListener('click', () => {
        const mon_hoc = el.getAttribute('data-mon');
        const so = Number(el.getAttribute('data-so')) || 1;
        const ten = el.getAttribute('data-ten') || `Chương ${so}`;
        openChapterView(mon_hoc, so, ten);
      });
    });

    bindSidebarCommonButtons(bodyEl);
  }

  function bindSidebarCommonButtons(bodyEl) {
    const retryBtn = bodyEl.querySelector('#s3-sb-retry-net');
    if (retryBtn) {
      retryBtn.onclick = () => reloadLibrary(true);
    }
    const cleanBtn = bodyEl.querySelector('#s3-btn-clean-empty');
    if (cleanBtn) {
      cleanBtn.onclick = () => cleanAllEmptyCategories();
    }
    const olderBtn = bodyEl.querySelector('#s3-btn-load-older');
    if (olderBtn) {
      olderBtn.onclick = () => ensureAllMonthsLoaded();
    }
  }

  async function openChapterView(mon_hoc, so, ten) {
    S3_STATE.selectedChapter = { mon_hoc, so: Number(so) || 1, ten };
    S3_STATE.mainView = 'chapter';
    S3_STATE.paginationLimit = 30;
    renderSidebarBody();
    await renderMainWorkspace();
  }

  function getChapterFiles(mon_hoc, so) {
    return S3_STATE.allItems.filter(
      it => normalizeSearchText(it.mon_hoc) === normalizeSearchText(mon_hoc) &&
            Number(it.chuong?.so) === Number(so)
    );
  }

  /**
   * Tải dữ liệu chi tiết (meta, kienthuc, baitap) cho danh sách các file trong chương
   * Giới hạn tối đa 4 yêu cầu mạng song song
   */
  async function loadDetailsForFiles(fileItems) {
    await runWithConcurrency(fileItems, 4, async (item) => {
      const folder = item.duong_dan;
      if (!folder || S3_STATE.chapterDetailCache[folder]) return;

      // 1. Thử lấy từ cache Chặng 3 (lib:detail:<folder>) hoặc cache Chặng 2 (result:<hash8>)
      const cachedLib = await dbGet(`${LIB_KEYS.DETAIL_PREFIX}${folder}`);
      if (cachedLib && cachedLib.kienthuc && cachedLib.baitap) {
        S3_STATE.chapterDetailCache[folder] = cachedLib;
        return;
      }

      const hashMatch = folder.match(/_([a-f0-9]{8})$/i);
      const hash8 = hashMatch ? hashMatch[1] : null;
      if (hash8) {
        const cachedS2 = await dbGet(`result:${hash8}`);
        if (cachedS2 && cachedS2.kienthuc && cachedS2.baitap) {
          const detail = { meta: cachedS2.meta, kienthuc: cachedS2.kienthuc, baitap: cachedS2.baitap };
          S3_STATE.chapterDetailCache[folder] = detail;
          await dbSet(`${LIB_KEYS.DETAIL_PREFIX}${folder}`, detail);
          return;
        }
      }

      // 2. Nếu chưa có trong cache và có kết nối GitHub thì tải về
      if (!isGitHubConfigured() || S3_STATE.offlineMode) return;
      try {
        const [metaRes, ktRes, btRes] = await Promise.all([
          ghGetFile(`${folder}/meta.json`),
          ghGetFile(`${folder}/kienthuc.json`),
          ghGetFile(`${folder}/baitap.json`)
        ]);
        const detail = {
          meta: metaRes && metaRes.content ? JSON.parse(metaRes.content) : item,
          kienthuc: ktRes && ktRes.content ? JSON.parse(ktRes.content) : { tom_tat: '', cong_thuc: [], khai_niem: [] },
          baitap: btRes && btRes.content ? JSON.parse(btRes.content) : { danh_sach_bai: [] }
        };
        S3_STATE.chapterDetailCache[folder] = detail;
        await dbSet(`${LIB_KEYS.DETAIL_PREFIX}${folder}`, detail);
      } catch (e) {
        /* Giữ an toàn nếu 1 file bị lỗi mạng */
      }
    });
  }

  async function renderChapterWorkspace(wsEl) {
    const ch = S3_STATE.selectedChapter;
    if (!ch) return;

    // CHỈ lấy đúng các file thuộc môn + chương đang chọn
    const chapterFiles = getChapterFiles(ch.mon_hoc, ch.so);
    const totalProbCount = chapterFiles.reduce((s, f) => s + (Number(f.so_bai) || 0), 0);

    wsEl.style.display = 'block';
    wsEl.innerHTML = `
      <div class="s3-panel">
        <div class="s3-panel-header">
          <div>
            <div class="s3-panel-title">📘 ${escapeHTML(ch.mon_hoc)} — Chương ${escapeHTML(ch.so)}: ${escapeHTML(ch.ten)}</div>
            <div style="font-size:0.84rem; color:var(--text-muted); margin-top:4px;">
              Gồm <strong>${chapterFiles.length}</strong> phiếu tài liệu &bull; Tổng cộng <strong>${totalProbCount}</strong> bài tập
            </div>
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" class="btn-sm" id="s3-btn-rename-chap">✏️ Đổi tên chương</button>
            <button type="button" class="btn-sm" id="s3-btn-close-ws">✕ Đóng khung thư viện</button>
          </div>
        </div>

        <div class="s3-subtabs">
          <button type="button" class="s3-subtab-btn ${S3_STATE.chapterTab === 'lecture' ? 's3-active' : ''}" id="s3-subtab-lecture">
            📖 Bài giảng tổng hợp
          </button>
          <button type="button" class="s3-subtab-btn ${S3_STATE.chapterTab === 'exercises' ? 's3-active' : ''}" id="s3-subtab-exercises">
            ✍️ Bài tập và lời giải (${totalProbCount})
          </button>
        </div>

        <div id="s3-chapter-content-area">
          <div style="padding:14px; color:var(--text-muted);">⏳ Đang tải và tổng hợp dữ liệu của chương (tối đa 4 luồng song song)...</div>
        </div>
      </div>
    `;

    document.getElementById('s3-btn-close-ws').onclick = () => {
      S3_STATE.mainView = 'none';
      wsEl.style.display = 'none';
      renderSidebarBody();
    };
    document.getElementById('s3-btn-rename-chap').onclick = () => openRenameChapterModal(ch.mon_hoc, ch.so, ch.ten);

    document.getElementById('s3-subtab-lecture').onclick = () => {
      S3_STATE.chapterTab = 'lecture';
      renderChapterWorkspace(wsEl);
    };
    document.getElementById('s3-subtab-exercises').onclick = () => {
      S3_STATE.chapterTab = 'exercises';
      renderChapterWorkspace(wsEl);
    };

    const contentArea = document.getElementById('s3-chapter-content-area');
    if (chapterFiles.length === 0) {
      contentArea.innerHTML = `<div class="s3-banner">Chưa có tài liệu nào trong chương này.</div>`;
      return;
    }

    await loadDetailsForFiles(chapterFiles);

    if (S3_STATE.chapterTab === 'lecture') {
      await renderChapterLectureTab(contentArea, chapterFiles);
    } else {
      await renderChapterExercisesTab(contentArea, chapterFiles);
    }
  }

  async function renderChapterLectureTab(container, chapterFiles) {
    const summaries = [];
    const formulaMap = new Map(); // Khử trùng lặp theo chuỗi latex đã chuẩn hóa khoảng trắng
    const conceptMap = new Map(); // Khử trùng lặp theo chuỗi khái niệm chữ thường

    for (const f of chapterFiles) {
      const detail = S3_STATE.chapterDetailCache[f.duong_dan];
      if (!detail || !detail.kienthuc) continue;
      const kt = detail.kienthuc;

      if (kt.tom_tat && kt.tom_tat.trim()) {
        summaries.push({
          fileTitle: f.ten,
          ngay: f.ngay,
          duong_dan: f.duong_dan,
          tom_tat: kt.tom_tat.trim()
        });
      }

      if (Array.isArray(kt.cong_thuc)) {
        for (const cf of kt.cong_thuc) {
          if (!cf || !cf.latex) continue;
          const normLatex = String(cf.latex).replace(/\s+/g, '');
          if (!formulaMap.has(normLatex)) {
            formulaMap.set(normLatex, {
              ten: cf.ten || '',
              latex: cf.latex,
              dieu_kien_dung: cf.dieu_kien_dung || '',
              don_vi: cf.don_vi || ''
            });
          }
        }
      }

      if (Array.isArray(kt.khai_niem)) {
        for (const kn of kt.khai_niem) {
          const clean = String(kn || '').trim();
          if (!clean) continue;
          const key = normalizeSearchText(clean);
          if (!conceptMap.has(key)) {
            conceptMap.set(key, clean);
          }
        }
      }
    }

    const summaryHtml = summaries.map(s => `
      <div class="s3-item-card">
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-muted); margin-bottom:4px;">
          <strong>📄 ${escapeHTML(s.fileTitle)}</strong>
          <span>Ngày: ${escapeHTML(s.ngay)}</span>
        </div>
        <div style="line-height:1.55; font-size:0.92rem;">${escapeHTML(s.tom_tat)}</div>
      </div>
    `).join('');

    const formulaRowsHtml = Array.from(formulaMap.values()).map(cf => `
      <tr>
        <td><strong>${escapeHTML(cf.ten)}</strong></td>
        <td><div class="s3-math-box" data-latex="${escapeHTML(cf.latex)}" data-display="true">${escapeHTML(cf.latex)}</div></td>
        <td>${escapeHTML(cf.dieu_kien_dung)}</td>
        <td><code>${escapeHTML(cf.don_vi)}</code></td>
      </tr>
    `).join('');

    const conceptListHtml = Array.from(conceptMap.values()).map(c => `<li>${escapeHTML(c)}</li>`).join('');

    container.innerHTML = `
      <h3 style="font-size:1rem; margin-bottom:8px;">1. Tóm tắt kiến thức theo từng tài liệu (${summaries.length})</h3>
      ${summaryHtml || '<p style="color:var(--text-muted); margin-bottom:12px;">Chưa có bản tóm tắt kiến thức.</p>'}

      <h3 style="font-size:1rem; margin:16px 0 8px 0;">2. Bảng công thức tổng hợp (Đã gộp & khử trùng lặp: ${formulaMap.size} công thức)</h3>
      <table class="s3-table">
        <thead>
          <tr><th>Tên công thức</th><th>Biểu thức LaTeX</th><th>Điều kiện áp dụng</th><th>Đơn vị</th></tr>
        </thead>
        <tbody>
          ${formulaRowsHtml || '<tr><td colspan="4">Chưa có công thức nào trong chương này.</td></tr>'}
        </tbody>
      </table>

      <h3 style="font-size:1rem; margin:16px 0 8px 0;">3. Danh sách khái niệm trọng tâm (${conceptMap.size})</h3>
      ${conceptListHtml ? `<ul style="margin-left:20px; line-height:1.6; font-size:0.92rem;">${conceptListHtml}</ul>` : '<p style="color:var(--text-muted);">Chưa có khái niệm trích xuất.</p>'}
    `;

    await renderKatexInElement(container);
  }

  async function renderChapterExercisesTab(container, chapterFiles) {
    let html = '';
    for (const f of chapterFiles) {
      const detail = S3_STATE.chapterDetailCache[f.duong_dan];
      const probs = detail?.baitap?.danh_sach_bai || [];

      const probsRows = probs.map(p => `
        <div style="padding:8px 10px; border-top:1px dashed var(--border, #cbd5e1); display:flex; justify-content:space-between; align-items:flex-start; gap:10px; flex-wrap:wrap;">
          <div style="flex:1; min-width:220px;">
            <strong>📌 ${escapeHTML(p.nhan || p.id)} (Trang ${escapeHTML(p.trang || 1)}):</strong>
            <span style="font-size:0.88rem; margin-left:4px;">${escapeHTML(p.de_tom_tat || '')}</span>
          </div>
          <button type="button" class="btn-sm s3-btn-open-single-prob"
                  data-folder="${escapeHTML(f.duong_dan)}"
                  data-prob-id="${escapeHTML(p.id)}">
            🔍 Xem bài này
          </button>
        </div>
      `).join('');

      html += `
        <div class="s3-item-card">
          <div class="s3-item-top">
            <div>
              <span class="s3-item-title s3-btn-open-folder" data-folder="${escapeHTML(f.duong_dan)}">
                📘 ${escapeHTML(f.ten)}
              </span>
              <div class="s3-meta-row">
                <span>📅 ${escapeHTML(f.ngay)}</span>
                <span>&bull; ${probs.length || f.so_bai} bài</span>
                ${(f.hashtags || []).map(t => `<span class="s3-badge">${escapeHTML(t)}</span>`).join('')}
                ${f.ghi_chu ? `<span>&bull; 📝 ${escapeHTML(f.ghi_chu)}</span>` : ''}
              </div>
            </div>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <button type="button" class="btn-primary btn-sm s3-btn-open-folder" data-folder="${escapeHTML(f.duong_dan)}">📂 Mở toàn bộ file</button>
              <button type="button" class="btn-sm s3-btn-edit-meta" data-folder="${escapeHTML(f.duong_dan)}">🏷️ Sửa tag/ghi chú</button>
              <button type="button" class="btn-sm s3-btn-move-file" data-folder="${escapeHTML(f.duong_dan)}">⇄ Chuyển môn/chương</button>
              <button type="button" class="btn-danger btn-sm s3-btn-delete-file" data-folder="${escapeHTML(f.duong_dan)}">🗑️</button>
            </div>
          </div>
          <div style="margin-top:8px;">
            ${probsRows || '<div style="font-size:0.82rem; color:var(--text-muted); margin-top:6px;">Nhấn "Mở toàn bộ file" để tải chi tiết các bài tập.</div>'}
          </div>
        </div>
      `;
    }

    if (chapterFiles.length === 0) {
      const ch = S3_STATE.selectedChapter || {};
      container.innerHTML = `
        <div style="padding:28px 16px; text-align:center; background:var(--bg-panel); border:1px dashed var(--border); border-radius:var(--radius); margin-top:8px;">
          <div style="font-size:2.2rem; margin-bottom:8px;">📝</div>
          <div style="font-weight:700; font-size:1.05rem; margin-bottom:6px; color:var(--primary);">
            Chưa có bài tập nào được lưu cho chương này
          </div>
          <p style="font-size:0.88rem; color:var(--text-muted); max-width:540px; margin:0 auto 16px auto; line-height:1.5;">
            Bạn có thể tải ảnh hoặc file PDF đề thi / bài tập giáo trình của môn <strong>${escapeHTML(ch.mon_hoc || '')}</strong> lên Bộ Quét & Giải Đề để AI phân tích từng bước, vẽ hình và mô phỏng.
          </p>
          <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap;">
            <button type="button" class="btn-primary" id="s3-btn-solve-for-chap">⚡ Quét & Giải bài tập cho chương này</button>
            <button type="button" id="s3-btn-open-lab-for-chap">🔬 Thử nghiệm trong Phòng Thí Nghiệm Động</button>
          </div>
        </div>
      `;
      const btnSolve = container.querySelector('#s3-btn-solve-for-chap');
      if (btnSolve) {
        btnSolve.onclick = () => {
          if (typeof window.switchMechaTab === 'function') {
            window.switchMechaTab('solver');
            const subjInp = document.getElementById('s2-inp-subject');
            const chapInp = document.getElementById('s2-inp-chapter');
            if (subjInp) subjInp.value = ch.mon_hoc || '';
            if (chapInp) chapInp.value = `Chương ${ch.so || 1}: ${ch.ten || ''}`;
          }
        };
      }
      const btnLab = container.querySelector('#s3-btn-open-lab-for-chap');
      if (btnLab) {
        btnLab.onclick = () => {
          if (typeof window.switchMechaTab === 'function') {
            window.switchMechaTab('labs');
          }
        };
      }
      return;
    }

    container.innerHTML = html;
    bindItemActionButtons(container);
    await renderKatexInElement(container);
  }


  /* ==========================================================================
     5. THEO THỜI GIAN (Nhóm Hôm nay, Tuần này, Tuần trước, Tháng này, Tháng trước...)
     ========================================================================== */

  function classifyDateBucket(dateStr) {
    const todayStr = getLocalTodayStr();
    if (dateStr === todayStr) return { key: 'today', label: '📍 Hôm nay' };

    const itemDate = parseYMD(dateStr);
    const nowDate = parseYMD(todayStr);
    if (!itemDate || !nowDate) return { key: `month:${dateStr.slice(0, 7)}`, label: `📅 Tháng ${dateStr.slice(0, 7)}` };

    // Tính ngày đầu tuần (Thứ Hai)
    const getMonday = (d) => {
      const copy = new Date(d.getTime());
      const day = copy.getDay() || 7; // CN = 7
      copy.setDate(copy.getDate() - day + 1);
      copy.setHours(0, 0, 0, 0);
      return copy;
    };

    const thisMonday = getMonday(nowDate);
    const lastMonday = new Date(thisMonday.getTime() - 7 * 86400000);

    if (itemDate >= thisMonday) return { key: 'this_week', label: '🗓️ Tuần này' };
    if (itemDate >= lastMonday && itemDate < thisMonday) return { key: 'last_week', label: '🗓️ Tuần trước' };

    const thisYM = todayStr.slice(0, 7);
    const prevMonthDate = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1);
    const lastYM = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
    const itemYM = dateStr.slice(0, 7);

    if (itemYM === thisYM) return { key: 'this_month', label: `📆 Tháng này (${thisYM})` };
    if (itemYM === lastYM) return { key: 'last_month', label: `📆 Tháng trước (${lastYM})` };
    return { key: `month:${itemYM}`, label: `📂 Tháng ${itemYM}` };
  }

  function renderSidebarTimelineSummary(bodyEl, offlineBannerHtml, unloadedCount) {
    const items = getFilteredIndexItems();
    const groups = groupItemsByTimeline(items);

    const htmlGroups = groups.map(g => `
      <div style="margin-bottom:10px;">
        <div style="font-size:0.78rem; font-weight:700; color:var(--primary); margin-bottom:4px;">${escapeHTML(g.label)} (${g.items.length})</div>
        ${g.items.slice(0, 8).map(it => `
          <div class="s3-chap-item s3-sb-open-item" data-folder="${escapeHTML(it.duong_dan)}">
            <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              <strong>${escapeHTML(it.ngay.slice(5))}</strong> · ${escapeHTML(it.ten)}
            </span>
            <span class="s3-chap-count">${it.so_bai}b</span>
          </div>
        `).join('')}
      </div>
    `).join('');

    bodyEl.innerHTML = `
      ${offlineBannerHtml}
      ${htmlGroups || '<div style="padding:12px; color:var(--text-muted); font-size:0.84rem;">Không có mục nào trong dòng thời gian.</div>'}
      ${unloadedCount > 0 ? `<button type="button" class="btn-sm" style="width:100%; margin-top:8px;" id="s3-btn-load-older">📂 Xem cũ hơn (${unloadedCount} tháng chưa tải)</button>` : ''}
    `;

    bodyEl.querySelectorAll('.s3-sb-open-item').forEach(el => {
      el.addEventListener('click', () => {
        const folder = el.getAttribute('data-folder');
        if (folder) openFolder(folder);
      });
    });

    bindSidebarCommonButtons(bodyEl);
  }

  function groupItemsByTimeline(items) {
    const map = new Map();
    for (const it of items) {
      const b = classifyDateBucket(it.ngay || '');
      if (!map.has(b.key)) {
        map.set(b.key, { key: b.key, label: b.label, items: [] });
      }
      map.get(b.key).items.push(it);
    }
    return Array.from(map.values());
  }

  function renderTimelineWorkspace(wsEl) {
    const allFiltered = getFilteredIndexItems();
    const visibleItems = allFiltered.slice(0, S3_STATE.paginationLimit);
    const groups = groupItemsByTimeline(visibleItems);

    const groupsHtml = groups.map(g => `
      <div class="s3-time-group-title">${escapeHTML(g.label)} (${g.items.length})</div>
      ${g.items.map(it => renderIndexItemCardHtml(it)).join('')}
    `).join('');

    wsEl.style.display = 'block';
    wsEl.innerHTML = `
      <div class="s3-panel">
        <div class="s3-panel-header">
          <div>
            <div class="s3-panel-title">🕒 Thư viện theo dòng thời gian</div>
            <div style="font-size:0.84rem; color:var(--text-muted); margin-top:4px;">
              Đang hiển thị ${visibleItems.length}/${allFiltered.length} phiếu bài tập
            </div>
          </div>
          <button type="button" class="btn-sm" id="s3-btn-close-ws">✕ Đóng khung thư viện</button>
        </div>

        <!-- Bộ lọc khoảng ngày (Từ - Đến) -->
        <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:flex-end; margin-bottom:14px; padding:10px; background:var(--bg-main); border-radius:8px; border:1px solid var(--border);">
          <div>
            <label style="font-size:0.78rem;">Từ ngày (YYYY-MM-DD)</label>
            <input type="date" id="s3-date-from" value="${escapeHTML(S3_STATE.dateFrom)}" style="width:165px; padding:5px 8px;">
          </div>
          <div>
            <label style="font-size:0.78rem;">Đến ngày (YYYY-MM-DD)</label>
            <input type="date" id="s3-date-to" value="${escapeHTML(S3_STATE.dateTo)}" style="width:165px; padding:5px 8px;">
          </div>
          <button type="button" class="btn-primary btn-sm" id="s3-btn-apply-date">Lọc theo ngày</button>
          <button type="button" class="btn-sm" id="s3-btn-clear-date">Xóa lọc ngày</button>
        </div>

        ${groupsHtml || '<div class="s3-banner">Không có tài liệu nào khớp khoảng thời gian này.</div>'}

        ${allFiltered.length > S3_STATE.paginationLimit ? `
          <div style="text-align:center; margin-top:12px;">
            <button type="button" class="btn-primary" id="s3-btn-show-more">Hiện thêm (${allFiltered.length - S3_STATE.paginationLimit} mục còn lại)</button>
          </div>
        ` : ''}
      </div>
    `;

    document.getElementById('s3-btn-close-ws').onclick = () => {
      S3_STATE.mainView = 'none';
      wsEl.style.display = 'none';
    };
    document.getElementById('s3-btn-apply-date').onclick = () => {
      S3_STATE.dateFrom = document.getElementById('s3-date-from').value.trim();
      S3_STATE.dateTo = document.getElementById('s3-date-to').value.trim();
      S3_STATE.paginationLimit = 30;
      renderTimelineWorkspace(wsEl);
    };
    document.getElementById('s3-btn-clear-date').onclick = () => {
      S3_STATE.dateFrom = '';
      S3_STATE.dateTo = '';
      S3_STATE.paginationLimit = 30;
      renderTimelineWorkspace(wsEl);
    };
    const moreBtn = document.getElementById('s3-btn-show-more');
    if (moreBtn) {
      moreBtn.onclick = () => {
        S3_STATE.paginationLimit += 30;
        renderTimelineWorkspace(wsEl);
      };
    }

    bindItemActionButtons(wsEl);
  }


  /* ==========================================================================
     6. TÌM KIẾM & LỌC SÂU (Bỏ dấu tiếng Việt, Chip Hashtag AND, Tìm sâu 4 luồng)
     ========================================================================== */

  function normalizeSearchText(str) {
    if (!str) return '';
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim();
  }

  function getFilteredIndexItems() {
    const qNorm = normalizeSearchText(S3_STATE.searchQuery);
    const activeTags = S3_STATE.activeHashtags;
    const dFrom = S3_STATE.dateFrom;
    const dTo = S3_STATE.dateTo;

    return S3_STATE.allItems.filter(it => {
      // 1. Lọc theo khoảng ngày nếu có
      if (dFrom && it.ngay < dFrom) return false;
      if (dTo && it.ngay > dTo) return false;

      // 2. Lọc theo nhiều hashtag cùng lúc (AND)
      if (activeTags.length > 0) {
        const itemTagsNorm = (it.hashtags || []).map(t => normalizeSearchText(t.startsWith('#') ? t : `#${t}`));
        const allMatched = activeTags.every(reqTag => itemTagsNorm.includes(normalizeSearchText(reqTag)));
        if (!allMatched) return false;
      }

      // 3. Lọc theo từ khóa trên index (hoặc kết quả tìm sâu nếu đã chạy)
      if (!qNorm) return true;

      const haystack = normalizeSearchText(
        `${it.ten} ${it.mon_hoc} chương ${it.chuong?.so || ''} ${it.chuong?.ten || ''} ${(it.hashtags || []).join(' ')} ${it.ghi_chu || ''}`
      );
      if (haystack.includes(qNorm)) return true;

      if (S3_STATE.deepSearchMatches && S3_STATE.deepSearchMatches.has(it.duong_dan)) {
        return true;
      }
      return false;
    });
  }

  function renderSearchWorkspace(wsEl) {
    const filtered = getFilteredIndexItems();
    const visible = filtered.slice(0, S3_STATE.paginationLimit);

    wsEl.style.display = 'block';
    wsEl.innerHTML = `
      <div class="s3-panel">
        <div class="s3-panel-header">
          <div>
            <div class="s3-panel-title">🔍 Tìm kiếm & Lọc học liệu</div>
            <div style="font-size:0.84rem; color:var(--text-muted); margin-top:4px;">
              Từ khóa: <strong>"${escapeHTML(S3_STATE.searchQuery || 'Tất cả')}"</strong>
              ${S3_STATE.activeHashtags.length > 0 ? ` &bull; Hashtag (AND): <strong>${escapeHTML(S3_STATE.activeHashtags.join(' + '))}</strong>` : ''}
              &bull; Khớp <strong>${filtered.length}</strong> phiếu bài tập
            </div>
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" class="btn-primary btn-sm" id="s3-btn-deep-search" ${S3_STATE.deepSearchRunning ? 'disabled' : ''}>
              🔎 Tìm sâu trong nội dung bài (đề, lời giải, ghi chú)
            </button>
            ${S3_STATE.deepSearchRunning ? `<button type="button" class="btn-danger btn-sm" id="s3-btn-cancel-deep">⏹ Hủy tìm sâu</button>` : ''}
            <button type="button" class="btn-sm" id="s3-btn-close-ws">✕ Đóng</button>
          </div>
        </div>

        <div id="s3-deep-search-status" style="display:${S3_STATE.deepSearchRunning ? 'block' : 'none'}; margin-bottom:12px;">
          <div style="font-size:0.82rem; font-weight:600;" id="s3-deep-progress-text">Đang tải nội dung bài tập...</div>
          <div class="s3-progress-wrap"><div class="s3-progress-bar" id="s3-deep-progress-bar"></div></div>
        </div>

        ${visible.map(it => renderIndexItemCardHtml(it, S3_STATE.deepSearchMatches?.get(it.duong_dan))).join('') ||
          '<div class="s3-banner">Không tìm thấy tài liệu nào khớp điều kiện. Bạn có thể bấm "Tìm sâu trong nội dung bài" để quét bên trong lời giải chi tiết.</div>'}

        ${filtered.length > S3_STATE.paginationLimit ? `
          <div style="text-align:center; margin-top:12px;">
            <button type="button" class="btn-primary" id="s3-btn-show-more">Hiện thêm (${filtered.length - S3_STATE.paginationLimit} mục)</button>
          </div>
        ` : ''}
      </div>
    `;

    document.getElementById('s3-btn-close-ws').onclick = () => {
      S3_STATE.mainView = 'none';
      wsEl.style.display = 'none';
    };

    const deepBtn = document.getElementById('s3-btn-deep-search');
    if (deepBtn) {
      deepBtn.onclick = () => executeDeepSearch();
    }
    const cancelBtn = document.getElementById('s3-btn-cancel-deep');
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        S3_STATE.deepSearchAbort = true;
      };
    }
    const moreBtn = document.getElementById('s3-btn-show-more');
    if (moreBtn) {
      moreBtn.onclick = () => {
        S3_STATE.paginationLimit += 30;
        renderSearchWorkspace(wsEl);
      };
    }

    bindItemActionButtons(wsEl);
  }

  async function executeDeepSearch() {
    const qNorm = normalizeSearchText(S3_STATE.searchQuery);
    if (!qNorm) {
      alert('Vui lòng nhập từ khóa vào ô tìm kiếm ở thanh bên trước khi chạy Tìm sâu.');
      return;
    }

    await ensureAllMonthsLoaded();

    // Lọc các file thỏa mãn điều kiện Hashtag/Ngày hiện tại để quét sâu
    const candidates = S3_STATE.allItems.filter(it => {
      if (S3_STATE.dateFrom && it.ngay < S3_STATE.dateFrom) return false;
      if (S3_STATE.dateTo && it.ngay > S3_STATE.dateTo) return false;
      if (S3_STATE.activeHashtags.length > 0) {
        const itemTagsNorm = (it.hashtags || []).map(t => normalizeSearchText(t.startsWith('#') ? t : `#${t}`));
        if (!S3_STATE.activeHashtags.every(req => itemTagsNorm.includes(normalizeSearchText(req)))) return false;
      }
      return true;
    });

    S3_STATE.deepSearchRunning = true;
    S3_STATE.deepSearchAbort = false;
    S3_STATE.deepSearchMatches = new Map();
    renderMainWorkspace();

    let completed = 0;
    const total = Math.max(1, candidates.length);

    await runWithConcurrency(candidates, 4, async (item) => {
      if (S3_STATE.deepSearchAbort) return;
      const folder = item.duong_dan;
      let btData = S3_STATE.chapterDetailCache[folder]?.baitap;

      if (!btData) {
        const cached = await dbGet(`${LIB_KEYS.DETAIL_PREFIX}${folder}`);
        if (cached && cached.baitap) {
          btData = cached.baitap;
        } else if (isGitHubConfigured() && !S3_STATE.offlineMode) {
          try {
            const btRes = await ghGetFile(`${folder}/baitap.json`);
            if (btRes && btRes.content) {
              btData = JSON.parse(btRes.content);
              await dbSet(`${LIB_KEYS.DETAIL_PREFIX}${folder}`, {
                meta: item,
                kienthuc: cached?.kienthuc || null,
                baitap: btData
              });
            }
          } catch (e) { /* Bỏ qua lỗi lẻ */ }
        }
      }

      if (btData && Array.isArray(btData.danh_sach_bai)) {
        const matchedSnippets = [];
        for (const p of btData.danh_sach_bai) {
          const stepTexts = (p.loi_giai || []).map(s => `${s.mo_ta || ''} ${s.cong_thuc || ''} ${s.ket_qua || ''}`).join(' ');
          const rawCombined = `${p.nhan || p.id}: ${p.de_tom_tat || ''} | ${stepTexts} | ${p.ghi_chu_ca_nhan || ''}`;
          if (normalizeSearchText(rawCombined).includes(qNorm)) {
            matchedSnippets.push(`${p.nhan || p.id}: ${(p.de_tom_tat || '').slice(0, 90)}...`);
          }
        }
        if (matchedSnippets.length > 0) {
          S3_STATE.deepSearchMatches.set(folder, matchedSnippets);
        }
      }

      completed++;
      const bar = document.getElementById('s3-deep-progress-bar');
      const txt = document.getElementById('s3-deep-progress-text');
      if (bar) bar.style.width = `${Math.round((completed / total) * 100)}%`;
      if (txt) txt.textContent = `Đang tìm sâu: ${completed}/${total} file (Phát hiện ${S3_STATE.deepSearchMatches.size} file khớp)...`;
    });

    S3_STATE.deepSearchRunning = false;
    renderMainWorkspace();
  }


  /* ==========================================================================
     7. MỞ BÀI (Tải gói dữ liệu & gọi MechaStage2.renderResult vào vùng chứa riêng)
     ========================================================================== */

  function revokeActiveBlobUrls() {
    for (const u of S3_STATE.activeBlobUrls) {
      try { URL.revokeObjectURL(u); } catch (e) {}
    }
    S3_STATE.activeBlobUrls = [];
  }

  /**
   * Mở đầy đủ một thư mục bài tập trong vùng chứa riêng của Chặng 3 (không đụng #s2-result-mount)
   * @param {string} duong_dan Đường dẫn thư mục dạng data/YYYY/MM/YYYY-MM-DD_<hash8>
   * @param {string} [focusProblemId] Mã bài cần cuộn tới hoặc lọc riêng nếu có
   */
  async function openFolder(duong_dan, focusProblemId = null) {
    const cleanFolder = String(duong_dan || '').replace(/\/+$/, '');
    if (!cleanFolder) return;

    if (S3_STATE.mainView !== 'detail') {
      S3_STATE.prevMainView = S3_STATE.mainView;
    }
    S3_STATE.mainView = 'detail';

    const wsEl = document.getElementById('s3-main-workspace');
    if (!wsEl) return;
    wsEl.style.display = 'block';
    wsEl.innerHTML = `
      <div class="s3-panel">
        <div class="s3-panel-header">
          <div class="s3-panel-title">⏳ Đang mở tài liệu: <code>${escapeHTML(cleanFolder)}</code></div>
          <button type="button" class="btn-sm" id="s3-btn-back-from-detail">⬅ Quay lại danh sách</button>
        </div>
        <div id="s3-detail-render-target" style="padding:12px; color:var(--text-muted);">
          Đang tải nội dung bài tập và hình vẽ...
        </div>
      </div>
    `;

    document.getElementById('s3-btn-back-from-detail').onclick = () => {
      revokeActiveBlobUrls();
      S3_STATE.mainView = S3_STATE.prevMainView && S3_STATE.prevMainView !== 'none' ? S3_STATE.prevMainView : 'chapter';
      renderMainWorkspace();
    };

    try {
      const bundle = await loadFullBundleForLibrary(cleanFolder);
      const targetEl = document.getElementById('s3-detail-render-target');
      if (!targetEl) return;

      if (!window.MechaStage2 || typeof window.MechaStage2.renderResult !== 'function') {
        throw new Error('Không tìm thấy hàm window.MechaStage2.renderResult. Hãy chắc chắn stage2.js đã được nạp trước stage3.js.');
      }

      await window.MechaStage2.renderResult(targetEl, bundle);
      wsEl.scrollIntoView({ behavior: 'smooth' });

      if (focusProblemId) {
        const card = targetEl.querySelector(`.s2-prob-card[data-prob-id="${CSS.escape(focusProblemId)}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.style.outline = '2px solid var(--primary, #2563eb)';
        }
      }
    } catch (err) {
      const targetEl = document.getElementById('s3-detail-render-target');
      if (targetEl) {
        targetEl.innerHTML = `
          <div class="s3-banner s3-banner-err">
            <span>❌ Không thể tải gói bài tập: ${escapeHTML(err.message)}</span>
            <button type="button" class="btn-primary btn-sm" id="s3-btn-retry-open">↻ Thử lại</button>
          </div>
        `;
        const retryBtn = document.getElementById('s3-btn-retry-open');
        if (retryBtn) retryBtn.onclick = () => openFolder(cleanFolder, focusProblemId);
      }
    }
  }

  async function loadFullBundleForLibrary(cleanFolder) {
    revokeActiveBlobUrls();
    const hashMatch = cleanFolder.match(/_([a-f0-9]{8})$/i);
    const hash8 = hashMatch ? hashMatch[1] : null;

    let meta = null;
    let kienthuc = null;
    let baitap = null;
    const figureUrls = {};

    // 1. Thử đọc từ cache Chặng 3 (lib:detail:<folder>) hoặc cache Chặng 2 (result:<hash8>)
    const cachedLib = await dbGet(`${LIB_KEYS.DETAIL_PREFIX}${cleanFolder}`);
    if (cachedLib && cachedLib.meta && cachedLib.kienthuc && cachedLib.baitap) {
      meta = cachedLib.meta;
      kienthuc = cachedLib.kienthuc;
      baitap = cachedLib.baitap;
    } else if (hash8) {
      const cachedS2 = await dbGet(`result:${hash8}`);
      if (cachedS2 && cachedS2.meta && cachedS2.kienthuc && cachedS2.baitap) {
        meta = cachedS2.meta;
        kienthuc = cachedS2.kienthuc;
        baitap = cachedS2.baitap;
        if (cachedS2.figureUrls) {
          for (const [k, v] of Object.entries(cachedS2.figureUrls)) {
            if (typeof v === 'string' && v.startsWith('data:')) {
              figureUrls[k] = v;
            }
          }
        }
      }
    }

    // 2. Nếu thiếu JSON thì tải từ GitHub
    if (!meta || !kienthuc || !baitap) {
      const [mRes, ktRes, btRes] = await Promise.all([
        ghGetFile(`${cleanFolder}/meta.json`),
        ghGetFile(`${cleanFolder}/kienthuc.json`),
        ghGetFile(`${cleanFolder}/baitap.json`)
      ]);
      if (!mRes || !ktRes || !btRes) {
        throw new Error(`Không tìm thấy đủ bộ 3 file JSON trong thư mục "${cleanFolder}".`);
      }
      meta = JSON.parse(mRes.content);
      kienthuc = JSON.parse(ktRes.content);
      baitap = JSON.parse(btRes.content);
      await dbSet(`${LIB_KEYS.DETAIL_PREFIX}${cleanFolder}`, { meta, kienthuc, baitap });
    }

    // 3. Tải hình vẽ cho các bài co_hinh = true:
    // Kiểm tra dataURL đã lưu trong IndexedDB trước; nếu chưa có thì gọi MechaStage2.ghGetBlobUrl(path)
    // Tuyệt đối KHÔNG lưu blob: URL vào IndexedDB; đổi sang dataURL trước khi lưu cache.
    const probs = baitap.danh_sach_bai || [];
    await runWithConcurrency(probs, 4, async (prob) => {
      if (!prob.co_hinh) return;
      if (figureUrls[prob.id]) return;

      const figCacheKey = `${LIB_KEYS.FIG_PREFIX}${cleanFolder}:${prob.id}`;
      const cachedDataUrl = await dbGet(figCacheKey);
      if (typeof cachedDataUrl === 'string' && cachedDataUrl.startsWith('data:')) {
        figureUrls[prob.id] = cachedDataUrl;
        return;
      }

      if (isGitHubConfigured() && !S3_STATE.offlineMode && window.MechaStage2?.ghGetBlobUrl) {
        try {
          const blobUrl = await window.MechaStage2.ghGetBlobUrl(`${cleanFolder}/hinh/${prob.id}.jpg`);
          S3_STATE.activeBlobUrls.push(blobUrl);
          figureUrls[prob.id] = blobUrl;

          // Chuyển blobUrl sang dataURL để lưu bền vững vào IndexedDB cho chế độ mất mạng
          const dataUrl = await convertBlobUrlToDataUrl(blobUrl);
          if (dataUrl) {
            await dbSet(figCacheKey, dataUrl);
          }
        } catch (e) {
          figureUrls[prob.id] = '';
        }
      }
    });

    return { meta, kienthuc, baitap, figureUrls };
  }

  async function convertBlobUrlToDataUrl(blobUrl) {
    try {
      const res = await fetch(blobUrl);
      const blob = await res.blob();
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


  /* ==========================================================================
     8. QUẢN LÝ (Sửa tag/ghi chú, Chuyển môn/chương, Đổi tên chương, Xóa đệ quy)
     ========================================================================== */

  /**
   * Hàm trợ giúp Đọc -> Gộp -> Ghi file JSON với SHA, tự thử lại tối đa 3 lần khi gặp lỗi 409/422
   */
  async function s3UpdateJsonWithRetry(path, updaterFn, commitMessage) {
    let attempt = 0;
    while (attempt < 3) {
      attempt++;
      const existing = await ghGetFile(path);
      let currentObj = null;
      let currentSha = undefined;

      if (existing && existing.content) {
        currentSha = existing.sha;
        try {
          currentObj = JSON.parse(existing.content);
        } catch (e) {
          currentObj = null;
        }
      }

      const nextObj = await updaterFn(currentObj);
      const contentStr = JSON.stringify(nextObj, null, 2);

      try {
        const putRes = await ghPutFile(path, contentStr, commitMessage, currentSha);
        return { data: nextObj, sha: putRes?.sha || null };
      } catch (err) {
        const isConflict = (err && (err.code === 409 || err.code === 422)) ||
                           /409|422|xung đột/i.test(String(err?.message || ''));
        if (isConflict && attempt < 3) {
          await sleep(350 * attempt);
          continue;
        }
        throw err;
      }
    }
  }

  // 8.0. DỌN DANH MỤC TRỐNG (môn/chương không còn file nào, chỉ gỡ tên khỏi subjects.json)
  function computeEmptyCategories() {
    const norm = normalizeSearchText;
    const emptyChaps = [];
    const emptySubjs = [];
    for (const subj of (S3_STATE.subjects?.mon_hoc || [])) {
      const subjFiles = S3_STATE.allItems.filter(it => norm(it.mon_hoc) === norm(subj.ten));
      if (subjFiles.length === 0) {
        emptySubjs.push(subj.ten);
        continue;
      }
      for (const ch of (subj.chuong || [])) {
        const so = Number(ch.so) || 1;
        if (!subjFiles.some(it => Number(it.chuong?.so) === so)) {
          emptyChaps.push({ mon: subj.ten, so, ten: ch.ten });
        }
      }
    }
    return { emptyChaps, emptySubjs };
  }

  async function removeCategoriesFromSubjectsJson(removeSubjects, removeChapters, commitMessage) {
    const norm = normalizeSearchText;
    const res = await s3UpdateJsonWithRetry('subjects.json', (curr) => {
      const data = (curr && Array.isArray(curr.mon_hoc)) ? curr : { mon_hoc: [] };
      data.mon_hoc = data.mon_hoc.filter(sj => !removeSubjects.some(n => norm(n) === norm(sj.ten)));
      for (const sj of data.mon_hoc) {
        sj.chuong = (sj.chuong || []).filter(c =>
          !removeChapters.some(r => norm(r.mon) === norm(sj.ten) && Number(r.so) === (Number(c.so) || 1)));
      }
      // Môn không còn chương và không có file nào thì bỏ luôn
      data.mon_hoc = data.mon_hoc.filter(sj =>
        (sj.chuong || []).length > 0 || S3_STATE.allItems.some(it => norm(it.mon_hoc) === norm(sj.ten)));
      return data;
    }, commitMessage);
    S3_STATE.subjects = res.data;
    await dbSet(LIB_KEYS.SUBJECTS, { sha: res.sha, data: res.data });
  }

  function resetSelectionIfRemoved(monName, chSo) {
    const sel = S3_STATE.selectedChapter;
    if (!sel) return;
    const sameMon = normalizeSearchText(sel.mon_hoc) === normalizeSearchText(monName);
    if (sameMon && (chSo == null || Number(sel.so) === chSo)) {
      S3_STATE.selectedChapter = null;
      if (S3_STATE.mainView === 'chapter') {
        S3_STATE.mainView = 'none';
        const ws = document.getElementById('s3-main-workspace');
        if (ws) ws.style.display = 'none';
      }
    }
  }

  async function deleteEmptySubjectOrChapter(monName, chSo) {
    if (!isGitHubConfigured()) {
      alert('Cần cấu hình kết nối GitHub trong Cài đặt để xóa mục này.');
      return;
    }
    try {
      await ensureAllMonthsLoaded(); // tải đủ các tháng để đếm bài cho chính xác
      const norm = normalizeSearchText;
      const files = S3_STATE.allItems.filter(it =>
        norm(it.mon_hoc) === norm(monName) && (chSo == null || Number(it.chuong?.so) === chSo));
      if (files.length > 0) {
        alert(`Mục này vẫn còn ${files.length} file bài tập nên chưa thể xóa. Hãy chuyển hoặc xóa các file đó trước.`);
        renderSidebarAll();
        return;
      }
      const label = chSo == null ? `môn "${monName}"` : `Chương ${chSo} của môn "${monName}"`;
      if (!confirm(`Xóa ${label}?\nMục này đang trống (0 bài). Thao tác chỉ gỡ tên khỏi danh mục, không làm mất dữ liệu bài nào.`)) return;

      updateSyncStatus('busy', 'Đang dọn danh mục...');
      await removeCategoriesFromSubjectsJson(
        chSo == null ? [monName] : [],
        chSo == null ? [] : [{ mon: monName, so: chSo }],
        `Xóa mục trống: ${label}`
      );
      resetSelectionIfRemoved(monName, chSo);
      rebuildFlatItemsAndSubjects();
      renderSidebarAll();
      updateSyncStatus('ok', 'Đã kết nối');
    } catch (err) {
      updateSyncStatus('err', 'Lỗi');
      alert('Lỗi khi xóa mục trống: ' + err.message);
    }
  }

  async function cleanAllEmptyCategories() {
    if (!isGitHubConfigured()) {
      alert('Cần cấu hình kết nối GitHub trong Cài đặt để dọn danh mục.');
      return;
    }
    try {
      await ensureAllMonthsLoaded();
      const { emptyChaps, emptySubjs } = computeEmptyCategories();
      if (emptyChaps.length === 0 && emptySubjs.length === 0) {
        alert('Không có mục trống nào cần dọn.');
        renderSidebarAll();
        return;
      }
      const lines = [
        ...emptySubjs.map(n => `• Môn "${n}" (trống)`),
        ...emptyChaps.map(c => `• ${c.mon} → Chương ${c.so}: ${c.ten || ''}`)
      ].join('\n');
      if (!confirm(`Sẽ gỡ các mục trống sau khỏi danh mục (không mất dữ liệu bài nào):\n${lines}\n\nTiếp tục?`)) return;

      updateSyncStatus('busy', 'Đang dọn danh mục...');
      await removeCategoriesFromSubjectsJson(emptySubjs, emptyChaps, 'Dọn các mục trống trong danh mục');
      emptySubjs.forEach(n => resetSelectionIfRemoved(n, null));
      emptyChaps.forEach(c => resetSelectionIfRemoved(c.mon, c.so));
      rebuildFlatItemsAndSubjects();
      renderSidebarAll();
      updateSyncStatus('ok', 'Đã kết nối');
    } catch (err) {
      updateSyncStatus('err', 'Lỗi');
      alert('Lỗi khi dọn danh mục: ' + err.message);
    }
  }

  // Tự gỡ chương/môn cũ nếu vừa chuyển hoặc xóa file cuối cùng của nó (lỗi thì bỏ qua, vẫn còn nút xóa tay)
  async function pruneIfEmptyAfterChange(monName, chSo) {
    try {
      await ensureAllMonthsLoaded();
      const norm = normalizeSearchText;
      const subjFiles = S3_STATE.allItems.filter(it => norm(it.mon_hoc) === norm(monName));
      if (subjFiles.some(it => Number(it.chuong?.so) === chSo)) return; // chương còn bài thì giữ
      const dropSubject = subjFiles.length === 0;
      await removeCategoriesFromSubjectsJson(
        dropSubject ? [monName] : [],
        dropSubject ? [] : [{ mon: monName, so: chSo }],
        'Tự dọn mục trống sau khi chuyển/xóa file'
      );
      resetSelectionIfRemoved(monName, dropSubject ? null : chSo);
      rebuildFlatItemsAndSubjects();
      renderSidebarAll();
    } catch (e) {
      /* bỏ qua */
    }
  }

  // 8.1. Sửa Hashtag & Ghi chú của một file
  function openEditTagsAndNoteModal(folderPath) {
    const item = S3_STATE.allItems.find(it => it.duong_dan === folderPath);
    if (!item) return;

    const currentTags = (item.hashtags || []).join(' ');
    const currentNote = item.ghi_chu || '';

    openS3Modal(
      '🏷️ Sửa Hashtag & Ghi chú của file',
      `
        <div style="margin-bottom:10px; font-size:0.86rem; color:var(--text-muted);">
          Tài liệu: <strong>${escapeHTML(item.ten)}</strong> (<code>${escapeHTML(item.duong_dan)}</code>)
        </div>
        <div class="form-group">
          <label>Hashtags (cách nhau bằng dấu cách)</label>
          <input type="text" id="s3-edit-tags-inp" value="${escapeHTML(currentTags)}" placeholder="#tinh_hoc #c1">
        </div>
        <div class="form-group">
          <label>Ghi chú của file</label>
          <input type="text" id="s3-edit-note-inp" value="${escapeHTML(currentNote)}" placeholder="Nhập ghi chú...">
        </div>
        <div id="s3-modal-err" style="color:var(--danger); font-size:0.84rem; margin-top:6px;"></div>
      `,
      [
        { label: 'Hủy', onClick: closeS3Modal },
        {
          label: '💾 Xác nhận lưu',
          className: 'btn-primary',
          onClick: async () => {
            const rawTags = document.getElementById('s3-edit-tags-inp').value.trim();
            const newTags = rawTags
              ? rawTags.split(/\s+/).filter(Boolean).map(t => (t.startsWith('#') ? t : `#${t}`))
              : [];
            const newNote = document.getElementById('s3-edit-note-inp').value.trim();

            if (!confirm(`Xác nhận cập nhật Hashtag và Ghi chú cho file "${item.ten}" trên GitHub?`)) return;

            try {
              const month = item.ngay.slice(0, 7);
              const monthPath = `index/${month}.json`;

              // 1. Cập nhật meta.json
              const metaUpdated = await s3UpdateJsonWithRetry(`${folderPath}/meta.json`, (curr) => {
                const m = (curr && typeof curr === 'object') ? { ...curr } : { ...item };
                m.hashtags = newTags;
                m.ghi_chu = newNote;
                return m;
              }, `Cập nhật hashtag/ghi chú trong meta.json (${item.id})`);

              // 2. Cập nhật mục tương ứng trong index/YYYY-MM.json
              const idxUpdated = await s3UpdateJsonWithRetry(monthPath, (currArr) => {
                const arr = Array.isArray(currArr) ? [...currArr] : [];
                const idx = arr.findIndex(x => x && (x.duong_dan === folderPath || x.id === item.id));
                if (idx >= 0) {
                  arr[idx] = { ...arr[idx], hashtags: newTags, ghi_chu: newNote };
                }
                return arr;
              }, `Cập nhật hashtag/ghi chú trong ${monthPath}`);

              // 3. Làm mới cache và giao diện ngay
              S3_STATE.indexByMonth[month] = idxUpdated.data;
              await dbSet(`${LIB_KEYS.INDEX_PREFIX}${month}`, { sha: idxUpdated.sha, items: idxUpdated.data });
              if (S3_STATE.chapterDetailCache[folderPath]) {
                S3_STATE.chapterDetailCache[folderPath].meta = metaUpdated.data;
                await dbSet(`${LIB_KEYS.DETAIL_PREFIX}${folderPath}`, S3_STATE.chapterDetailCache[folderPath]);
              }

              rebuildFlatItemsAndSubjects();
              closeS3Modal();
              renderSidebarAll();
              renderMainWorkspace();
            } catch (err) {
              const errEl = document.getElementById('s3-modal-err');
              if (errEl) errEl.textContent = 'Lỗi: ' + err.message;
            }
          }
        }
      ]
    );
  }

  // 8.2. Chuyển file sang môn/chương khác
  function openMoveFileModal(folderPath) {
    const item = S3_STATE.allItems.find(it => it.duong_dan === folderPath);
    if (!item) return;

    const existingSubjects = (S3_STATE.subjects?.mon_hoc || []).map(s => s.ten);
    const datalistSubj = existingSubjects.map(s => `<option value="${escapeHTML(s)}"></option>`).join('');

    openS3Modal(
      '⇄ Chuyển file sang Môn / Chương khác',
      `
        <div style="margin-bottom:10px; font-size:0.86rem; color:var(--text-muted);">
          Tài liệu: <strong>${escapeHTML(item.ten)}</strong>
        </div>
        <div class="form-group">
          <label>Tên môn học (Chọn có sẵn hoặc nhập môn mới)</label>
          <input type="text" id="s3-move-subj" list="s3-subj-datalist" value="${escapeHTML(item.mon_hoc)}">
          <datalist id="s3-subj-datalist">${datalistSubj}</datalist>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Số thứ tự chương</label>
            <input type="number" id="s3-move-chap-so" min="1" max="100" value="${Number(item.chuong?.so) || 1}">
          </div>
          <div class="form-group">
            <label>Tên chương</label>
            <input type="text" id="s3-move-chap-ten" value="${escapeHTML(item.chuong?.ten || '')}">
          </div>
        </div>
        <div id="s3-modal-err" style="color:var(--danger); font-size:0.84rem; margin-top:6px;"></div>
      `,
      [
        { label: 'Hủy', onClick: closeS3Modal },
        {
          label: '⇄ Xác nhận chuyển',
          className: 'btn-primary',
          onClick: async () => {
            const newSubj = document.getElementById('s3-move-subj').value.trim() || item.mon_hoc;
            const newSo = parseInt(document.getElementById('s3-move-chap-so').value, 10) || 1;
            const newTen = document.getElementById('s3-move-chap-ten').value.trim() || `Chương ${newSo}`;

            if (!confirm(`Xác nhận chuyển "${item.ten}" sang môn "${newSubj}" - Chương ${newSo}: "${newTen}"?`)) return;

            try {
              const newChuong = { so: newSo, ten: newTen };
              const month = item.ngay.slice(0, 7);
              const monthPath = `index/${month}.json`;

              // 1. Cập nhật meta.json
              await s3UpdateJsonWithRetry(`${folderPath}/meta.json`, (curr) => {
                const m = (curr && typeof curr === 'object') ? { ...curr } : { ...item };
                m.mon_hoc = newSubj;
                m.chuong = newChuong;
                return m;
              }, `Chuyển môn/chương trong meta.json (${item.id})`);

              // 2. Cập nhật index/YYYY-MM.json
              const idxUpdated = await s3UpdateJsonWithRetry(monthPath, (currArr) => {
                const arr = Array.isArray(currArr) ? [...currArr] : [];
                const idx = arr.findIndex(x => x && (x.duong_dan === folderPath || x.id === item.id));
                if (idx >= 0) {
                  arr[idx] = { ...arr[idx], mon_hoc: newSubj, chuong: newChuong };
                }
                return arr;
              }, `Chuyển môn/chương trong ${monthPath}`);

              // 3. Cập nhật subjects.json (thêm môn/chương mới nếu chưa có)
              const subjUpdated = await s3UpdateJsonWithRetry('subjects.json', (curr) => {
                const data = (curr && Array.isArray(curr.mon_hoc)) ? curr : { mon_hoc: [] };
                let sObj = data.mon_hoc.find(s => normalizeSearchText(s.ten) === normalizeSearchText(newSubj));
                if (!sObj) {
                  sObj = { ten: newSubj, chuong: [] };
                  data.mon_hoc.push(sObj);
                }
                if (!Array.isArray(sObj.chuong)) sObj.chuong = [];
                const cObj = sObj.chuong.find(c => Number(c.so) === newSo);
                if (!cObj) {
                  sObj.chuong.push({ so: newSo, ten: newTen });
                  sObj.chuong.sort((a, b) => Number(a.so) - Number(b.so));
                }
                return data;
              }, `Cập nhật subjects.json (${newSubj} - Chương ${newSo})`);

              S3_STATE.indexByMonth[month] = idxUpdated.data;
              S3_STATE.subjects = subjUpdated.data;
              await dbSet(`${LIB_KEYS.INDEX_PREFIX}${month}`, { sha: idxUpdated.sha, items: idxUpdated.data });
              await dbSet(LIB_KEYS.SUBJECTS, { sha: subjUpdated.sha, data: subjUpdated.data });

              rebuildFlatItemsAndSubjects();
              closeS3Modal();
              S3_STATE.selectedChapter = { mon_hoc: newSubj, so: newSo, ten: newTen };
              renderSidebarAll();
              renderMainWorkspace();
              // Chuyển xong: nếu chương/môn cũ không còn bài nào thì tự gỡ khỏi danh mục
              pruneIfEmptyAfterChange(item.mon_hoc, Number(item.chuong?.so) || 1);
            } catch (err) {
              const errEl = document.getElementById('s3-modal-err');
              if (errEl) errEl.textContent = 'Lỗi: ' + err.message;
            }
          }
        }
      ]
    );
  }

  // 8.3. Đổi tên chương (Cập nhật subjects.json, meta.json và các index tháng của mọi file thuộc chương)
  function openRenameChapterModal(mon_hoc, so, currentTen) {
    openS3Modal(
      `✏️ Đổi tên Chương ${so} (${mon_hoc})`,
      `
        <div class="form-group">
          <label>Tên mới cho Chương ${escapeHTML(so)}</label>
          <input type="text" id="s3-rename-chap-inp" value="${escapeHTML(currentTen)}">
        </div>
        <div id="s3-modal-err" style="color:var(--danger); font-size:0.84rem; margin-top:6px;"></div>
      `,
      [
        { label: 'Hủy', onClick: closeS3Modal },
        {
          label: '💾 Lưu tên chương mới',
          className: 'btn-primary',
          onClick: async () => {
            const newTen = document.getElementById('s3-rename-chap-inp').value.trim();
            if (!newTen) return;
            if (!confirm(`Xác nhận đổi tên Chương ${so} của môn "${mon_hoc}" thành "${newTen}" trên toàn bộ file liên quan?`)) return;

            try {
              await ensureAllMonthsLoaded();
              const affectedFiles = getChapterFiles(mon_hoc, so);

              // 1. Cập nhật subjects.json
              const subjUpdated = await s3UpdateJsonWithRetry('subjects.json', (curr) => {
                const data = (curr && Array.isArray(curr.mon_hoc)) ? curr : S3_STATE.subjects;
                const sObj = data.mon_hoc.find(s => normalizeSearchText(s.ten) === normalizeSearchText(mon_hoc));
                if (sObj && Array.isArray(sObj.chuong)) {
                  const cObj = sObj.chuong.find(c => Number(c.so) === Number(so));
                  if (cObj) cObj.ten = newTen;
                }
                return data;
              }, `Đổi tên Chương ${so} môn ${mon_hoc} thành "${newTen}"`);

              S3_STATE.subjects = subjUpdated.data;
              await dbSet(LIB_KEYS.SUBJECTS, { sha: subjUpdated.sha, data: subjUpdated.data });

              // 2. Cập nhật meta.json của từng file thuộc chương (giới hạn 4 luồng)
              await runWithConcurrency(affectedFiles, 4, async (fileItem) => {
                await s3UpdateJsonWithRetry(`${fileItem.duong_dan}/meta.json`, (curr) => {
                  const m = (curr && typeof curr === 'object') ? { ...curr } : { ...fileItem };
                  m.chuong = { so: Number(so), ten: newTen };
                  return m;
                }, `Đổi tên chương trong meta.json (${fileItem.id})`);
              });

              // 3. Cập nhật các file index/YYYY-MM.json có chứa file thuộc chương
              const affectedMonths = Array.from(new Set(affectedFiles.map(f => f.ngay.slice(0, 7))));
              for (const m of affectedMonths) {
                const monthPath = `index/${m}.json`;
                const idxUpdated = await s3UpdateJsonWithRetry(monthPath, (currArr) => {
                  const arr = Array.isArray(currArr) ? [...currArr] : [];
                  return arr.map(it => {
                    if (it && normalizeSearchText(it.mon_hoc) === normalizeSearchText(mon_hoc) && Number(it.chuong?.so) === Number(so)) {
                      return { ...it, chuong: { so: Number(so), ten: newTen } };
                    }
                    return it;
                  });
                }, `Cập nhật tên Chương ${so} trong ${monthPath}`);

                S3_STATE.indexByMonth[m] = idxUpdated.data;
                await dbSet(`${LIB_KEYS.INDEX_PREFIX}${m}`, { sha: idxUpdated.sha, items: idxUpdated.data });
              }

              S3_STATE.selectedChapter = { mon_hoc, so: Number(so), ten: newTen };
              rebuildFlatItemsAndSubjects();
              closeS3Modal();
              renderSidebarAll();
              renderMainWorkspace();
            } catch (err) {
              const errEl = document.getElementById('s3-modal-err');
              if (errEl) errEl.textContent = 'Lỗi: ' + err.message;
            }
          }
        }
      ]
    );
  }

  // 8.4. Xóa đệ quy toàn bộ một thư mục bài tập trên GitHub, gỡ khỏi index tháng, hashes.json và IndexedDB
  async function deleteFolderRecursivelyOnGitHub(dirPath) {
    const entries = await ghListDir(dirPath);
    if (!Array.isArray(entries) || entries.length === 0) return;

    for (const entry of entries) {
      if (entry.type === 'dir') {
        await deleteFolderRecursivelyOnGitHub(entry.path);
      } else if (entry.type === 'file') {
        await ghDeleteFile(entry.path, entry.sha, `Xóa file ${entry.path}`);
      }
    }
  }

  async function handleConfirmAndDeleteFile(folderPath) {
    const item = S3_STATE.allItems.find(it => it.duong_dan === folderPath);
    if (!item) return;

    const ok = confirm(
      `⚠️ XÁC NHẬN XÓA VĨNH VIỄN:\nBạn có chắc chắn muốn xóa toàn bộ thư mục bài tập "${item.ten}" (${folderPath}) khỏi GitHub và bộ nhớ đệm không?`
    );
    if (!ok) return;

    try {
      updateSyncStatus('busy', 'Đang xóa dữ liệu trên GitHub...');

      // Đọc meta.json trước khi xóa để biết hash64 (nếu có) phục vụ gỡ khỏi index/hashes.json
      let hash64ToDelete = null;
      const hashMatch = folderPath.match(/_([a-f0-9]{8})$/i);
      const hash8 = hashMatch ? hashMatch[1] : null;

      try {
        const metaFile = await ghGetFile(`${folderPath}/meta.json`);
        if (metaFile && metaFile.content) {
          const parsedMeta = JSON.parse(metaFile.content);
          hash64ToDelete = parsedMeta.hash64 || null;
        }
      } catch (e) {}

      // 1. Xóa đệ quy mọi file trong thư mục duong_dan
      await deleteFolderRecursivelyOnGitHub(folderPath);

      // 2. Gỡ mục khỏi index/YYYY-MM.json
      const month = item.ngay.slice(0, 7);
      const monthPath = `index/${month}.json`;
      const idxUpdated = await s3UpdateJsonWithRetry(monthPath, (currArr) => {
        const arr = Array.isArray(currArr) ? currArr : [];
        return arr.filter(x => x && x.duong_dan !== folderPath && x.id !== item.id);
      }, `Gỡ ${item.id} khỏi ${monthPath}`);

      S3_STATE.indexByMonth[month] = idxUpdated.data;
      await dbSet(`${LIB_KEYS.INDEX_PREFIX}${month}`, { sha: idxUpdated.sha, items: idxUpdated.data });

      // 3. Gỡ khỏi index/hashes.json theo hash64 hoặc theo đường dẫn khớp
      await s3UpdateJsonWithRetry('index/hashes.json', (currMap) => {
        const map = (currMap && typeof currMap === 'object' && !Array.isArray(currMap)) ? { ...currMap } : {};
        for (const [k, v] of Object.entries(map)) {
          if ((hash64ToDelete && k === hash64ToDelete) || v === folderPath) {
            delete map[k];
          }
        }
        return map;
      }, `Gỡ hash của ${item.id} khỏi index/hashes.json`);

      // 4. Xóa cache IndexedDB tương ứng
      delete S3_STATE.chapterDetailCache[folderPath];
      await dbDelete(`${LIB_KEYS.DETAIL_PREFIX}${folderPath}`);
      if (hash8) {
        await dbDelete(`result:${hash8}`);
        await dbDelete(`job:${hash8}`);
      }
      const figKeys = await dbKeys(`${LIB_KEYS.FIG_PREFIX}${folderPath}:`);
      for (const fk of figKeys) {
        await dbDelete(fk);
      }

      rebuildFlatItemsAndSubjects();
      renderSidebarAll();
      renderMainWorkspace();
      updateSyncStatus('ok', 'Đã kết nối');
      // Xóa xong: nếu chương/môn không còn bài nào thì tự gỡ khỏi danh mục
      pruneIfEmptyAfterChange(item.mon_hoc, Number(item.chuong?.so) || 1);
    } catch (err) {
      updateSyncStatus('err', 'Lỗi');
      alert('Lỗi khi xóa mục bài tập: ' + err.message);
    }
  }


  /* ==========================================================================
     9. SAO LƯU (Xuất file JSON gồm subjects, các index, toàn bộ meta & Nhập gộp theo id)
     ========================================================================== */

  async function handleExportBackup() {
    try {
      updateSyncStatus('busy', 'Đang chuẩn bị bản sao lưu...');
      await ensureAllMonthsLoaded();

      const allMetas = {};
      await runWithConcurrency(S3_STATE.allItems, 4, async (item) => {
        const folder = item.duong_dan;
        const cached = S3_STATE.chapterDetailCache[folder] || (await dbGet(`${LIB_KEYS.DETAIL_PREFIX}${folder}`));
        if (cached && cached.meta) {
          allMetas[folder] = cached.meta;
        } else if (isGitHubConfigured() && !S3_STATE.offlineMode) {
          try {
            const mFile = await ghGetFile(`${folder}/meta.json`);
            if (mFile && mFile.content) {
              allMetas[folder] = JSON.parse(mFile.content);
            }
          } catch (e) {
            allMetas[folder] = item;
          }
        } else {
          allMetas[folder] = item;
        }
      });

      const backupData = {
        app: 'MechaStudy',
        stage: 3,
        exportedAt: new Date().toISOString(),
        subjects: S3_STATE.subjects,
        indices: S3_STATE.indexByMonth,
        metas: allMetas
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mechastudy-backup-${getLocalTodayStr()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      updateSyncStatus('ok', 'Đã kết nối');
    } catch (err) {
      updateSyncStatus('err', 'Lỗi');
      alert('Lỗi khi xuất sao lưu: ' + err.message);
    }
  }

  async function handleImportBackupFile(file) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || !parsed.indices) {
        throw new Error('File JSON không đúng cấu trúc bản sao lưu MechaStudy.');
      }

      const monthKeys = Object.keys(parsed.indices || {});
      let totalIncoming = 0;
      monthKeys.forEach(m => {
        if (Array.isArray(parsed.indices[m])) totalIncoming += parsed.indices[m].length;
      });

      const ok = confirm(
        `📥 XÁC NHẬN NHẬP SAO LƯU:\nFile chứa ${monthKeys.length} tháng (${totalIncoming} mục chỉ mục).\nHệ thống sẽ gộp thông minh theo ID (không ghi đè làm mất các mục hiện có). Bạn có muốn tiếp tục?`
      );
      if (!ok) return;

      updateSyncStatus('busy', 'Đang gộp bản sao lưu...');

      // 1. Gộp subjects
      const mergeSubjectsFn = (curr) => {
        const base = (curr && Array.isArray(curr.mon_hoc)) ? curr : { mon_hoc: [] };
        const incoming = parsed.subjects?.mon_hoc || [];
        for (const incSubj of incoming) {
          let target = base.mon_hoc.find(s => normalizeSearchText(s.ten) === normalizeSearchText(incSubj.ten));
          if (!target) {
            target = { ten: incSubj.ten, chuong: [] };
            base.mon_hoc.push(target);
          }
          for (const incChap of (incSubj.chuong || [])) {
            if (!target.chuong.some(c => Number(c.so) === Number(incChap.so))) {
              target.chuong.push({ so: Number(incChap.so), ten: incChap.ten });
            }
          }
          target.chuong.sort((a, b) => Number(a.so) - Number(b.so));
        }
        return base;
      };

      if (isGitHubConfigured() && !S3_STATE.offlineMode) {
        const subjRes = await s3UpdateJsonWithRetry('subjects.json', mergeSubjectsFn, 'Gộp subjects.json từ bản sao lưu');
        S3_STATE.subjects = subjRes.data;
        await dbSet(LIB_KEYS.SUBJECTS, { sha: subjRes.sha, data: subjRes.data });
      } else {
        S3_STATE.subjects = mergeSubjectsFn(S3_STATE.subjects);
        await dbSet(LIB_KEYS.SUBJECTS, { sha: '', data: S3_STATE.subjects });
      }

      // 2. Gộp từng tháng theo id
      for (const m of monthKeys) {
        const incomingArr = Array.isArray(parsed.indices[m]) ? parsed.indices[m] : [];
        const mergeMonthFn = (currArr) => {
          const baseArr = Array.isArray(currArr) ? [...currArr] : [];
          for (const incItem of incomingArr) {
            if (!incItem || !incItem.id) continue;
            const idx = baseArr.findIndex(x => x && x.id === incItem.id);
            if (idx >= 0) {
              baseArr[idx] = { ...baseArr[idx], ...incItem };
            } else {
              baseArr.push(incItem);
            }
          }
          return baseArr;
        };

        if (isGitHubConfigured() && !S3_STATE.offlineMode) {
          const mRes = await s3UpdateJsonWithRetry(`index/${m}.json`, mergeMonthFn, `Gộp index/${m}.json từ bản sao lưu`);
          S3_STATE.indexByMonth[m] = mRes.data;
          await dbSet(`${LIB_KEYS.INDEX_PREFIX}${m}`, { sha: mRes.sha, items: mRes.data });
        } else {
          const merged = mergeMonthFn(S3_STATE.indexByMonth[m]);
          S3_STATE.indexByMonth[m] = merged;
          await dbSet(`${LIB_KEYS.INDEX_PREFIX}${m}`, { sha: '', items: merged });
        }
      }

      rebuildFlatItemsAndSubjects();
      renderSidebarAll();
      renderMainWorkspace();
      updateSyncStatus('ok', 'Đã kết nối');
      alert('✅ Đã nhập và gộp bản sao lưu thành công!');
    } catch (err) {
      updateSyncStatus('err', 'Lỗi');
      alert('Lỗi khi nhập file sao lưu: ' + err.message);
    }
  }


  /* ==========================================================================
     10. TIỆN ÍCH (Render thẻ chung, KaTeX fallback, Giới hạn luồng song song, Xuất API)
     ========================================================================== */

  function renderIndexItemCardHtml(it, deepSnippets = null) {
    const snippetsHtml = Array.isArray(deepSnippets) && deepSnippets.length > 0
      ? `<div style="margin-top:6px; padding:6px 8px; background:var(--bg-sidebar); border-left:3px solid var(--primary); font-size:0.8rem;">
           <strong>🔎 Khớp trong nội dung bài:</strong>
           <ul style="margin:4px 0 0 16px;">
             ${deepSnippets.map(s => `<li>${escapeHTML(s)}</li>`).join('')}
           </ul>
         </div>`
      : '';

    return `
      <div class="s3-item-card">
        <div class="s3-item-top">
          <div>
            <span class="s3-item-title s3-btn-open-folder" data-folder="${escapeHTML(it.duong_dan)}">
              📄 ${escapeHTML(it.ten)}
            </span>
            <div class="s3-meta-row">
              <span>📅 ${escapeHTML(it.ngay)}</span>
              <span class="s3-badge">${escapeHTML(it.mon_hoc)}</span>
              <span class="s3-badge">Chương ${escapeHTML(it.chuong?.so || 1)}: ${escapeHTML(it.chuong?.ten || '')}</span>
              <span>&bull; <strong>${escapeHTML(it.so_bai)}</strong> bài</span>
              ${(it.hashtags || []).map(t => `<span class="s3-badge">${escapeHTML(t)}</span>`).join('')}
              ${it.ghi_chu ? `<span>&bull; 📝 ${escapeHTML(it.ghi_chu)}</span>` : ''}
            </div>
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" class="btn-primary btn-sm s3-btn-open-folder" data-folder="${escapeHTML(it.duong_dan)}">📂 Mở xem</button>
            <button type="button" class="btn-sm s3-btn-edit-meta" data-folder="${escapeHTML(it.duong_dan)}" title="Sửa hashtag & ghi chú">🏷️</button>
            <button type="button" class="btn-sm s3-btn-move-file" data-folder="${escapeHTML(it.duong_dan)}" title="Chuyển môn/chương">⇄</button>
            <button type="button" class="btn-danger btn-sm s3-btn-delete-file" data-folder="${escapeHTML(it.duong_dan)}" title="Xóa file này">🗑️</button>
          </div>
        </div>
        ${snippetsHtml}
      </div>
    `;
  }

  function bindItemActionButtons(container) {
    container.querySelectorAll('.s3-btn-open-folder').forEach(btn => {
      btn.addEventListener('click', () => {
        const folder = btn.getAttribute('data-folder');
        if (folder) openFolder(folder);
      });
    });

    container.querySelectorAll('.s3-btn-open-single-prob').forEach(btn => {
      btn.addEventListener('click', () => {
        const folder = btn.getAttribute('data-folder');
        const probId = btn.getAttribute('data-prob-id');
        if (folder) openFolder(folder, probId);
      });
    });

    container.querySelectorAll('.s3-btn-edit-meta').forEach(btn => {
      btn.addEventListener('click', () => {
        const folder = btn.getAttribute('data-folder');
        if (folder) openEditTagsAndNoteModal(folder);
      });
    });

    container.querySelectorAll('.s3-btn-move-file').forEach(btn => {
      btn.addEventListener('click', () => {
        const folder = btn.getAttribute('data-folder');
        if (folder) openMoveFileModal(folder);
      });
    });

    container.querySelectorAll('.s3-btn-delete-file').forEach(btn => {
      btn.addEventListener('click', () => {
        const folder = btn.getAttribute('data-folder');
        if (folder) handleConfirmAndDeleteFile(folder);
      });
    });
  }

  async function renderMainWorkspace() {
    const wsEl = document.getElementById('s3-main-workspace');
    if (!wsEl) return;

    if (S3_STATE.mainView === 'chapter') {
      await renderChapterWorkspace(wsEl);
    } else if (S3_STATE.mainView === 'timeline') {
      renderTimelineWorkspace(wsEl);
    } else if (S3_STATE.mainView === 'search') {
      renderSearchWorkspace(wsEl);
    } else if (S3_STATE.mainView === 'none') {
      wsEl.style.display = 'none';
    }
  }

  /**
   * Thực thi mảng tác vụ bất đồng bộ với giới hạn số luồng song song (mặc định 4)
   */
  async function runWithConcurrency(items, concurrencyLimit, asyncWorkerFn) {
    const list = Array.from(items || []);
    if (list.length === 0) return;
    let currentIndex = 0;
    const workers = [];
    const maxWorkers = Math.max(1, Math.min(concurrencyLimit || 4, list.length));

    for (let w = 0; w < maxWorkers; w++) {
      workers.push((async () => {
        while (currentIndex < list.length) {
          const idx = currentIndex++;
          await asyncWorkerFn(list[idx], idx);
        }
      })());
    }
    await Promise.all(workers);
  }

  /**
   * Đảm bảo KaTeX 0.16.9 sẵn sàng (Tận dụng nếu Chặng 2 đã nạp, nếu chưa thì tự nạp từ cdnjs)
   */
  async function ensureKatexReadyForStage3() {
    if (window.katex) return window.katex;
    if (!S3_STATE.katexPromise) {
      const cssHref = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';
      if (!document.querySelector(`link[href="${cssHref}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssHref;
        document.head.appendChild(link);
      }
      const loadScript = (src) => new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing && window.katex) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Không tải được KaTeX từ CDN'));
        document.head.appendChild(s);
      });
      S3_STATE.katexPromise = loadScript('https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js')
        .then(() => loadScript('https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js'))
        .then(() => window.katex)
        .catch(() => { S3_STATE.katexPromise = null; return null; });
    }
    return S3_STATE.katexPromise;
  }

  async function renderKatexInElement(rootEl) {
    try {
      await ensureKatexReadyForStage3();
      if (!window.katex || !rootEl) return;

      rootEl.querySelectorAll('[data-latex]').forEach(node => {
        const raw = node.getAttribute('data-latex') || '';
        const displayMode = node.getAttribute('data-display') === 'true';
        if (!raw.trim()) return;
        try {
          window.katex.render(raw, node, { throwOnError: false, displayMode });
        } catch (e) {
          node.textContent = raw;
        }
      });

      if (window.renderMathInElement) {
        window.renderMathInElement(rootEl, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      }
    } catch (e) {
      /* Giữ nguyên văn nếu lỗi mạng */
    }
  }

  function getLocalTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function parseYMD(str) {
    const m = String(str || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  // Hàm công khai cho phép tìm kiếm bằng code từ bên ngoài
  function publicSearch(query) {
    S3_STATE.searchQuery = String(query || '');
    S3_STATE.paginationLimit = 30;
    const inp = document.getElementById('s3-search-input');
    if (inp) inp.value = S3_STATE.searchQuery;
    S3_STATE.mainView = 'search';
    renderSidebarAll();
    renderMainWorkspace();
  }

  // Xuất window.MechaStage3
  window.MechaStage3 = {
    openFolder: (duong_dan) => openFolder(duong_dan),
    reload: () => reloadLibrary(true),
    search: (query) => publicSearch(query),
    openLibraryView: () => {
      const wsEl = document.getElementById('s3-main-workspace');
      if (wsEl) {
        wsEl.style.display = 'block';
        if (S3_STATE.mainView === 'none') {
          S3_STATE.mainView = 'chapter';
          if (!S3_STATE.selectedChapter) {
            const firstSubj = S3_STATE.subjects?.mon_hoc?.[0] || VNU_MECHATRONICS_CURRICULUM[0];
            const firstChap = firstSubj?.chuong?.[0] || { so: 1, ten: 'Chương 1' };
            S3_STATE.selectedChapter = {
              mon_hoc: firstSubj.ten,
              so: Number(firstChap.so) || 1,
              ten: firstChap.ten
            };
          }
          renderMainWorkspace();
        }
      }
      renderSidebarAll();
    }
  };

  if (document.readyState !== 'loading') {
    initStage3();
  } else {
    document.addEventListener('DOMContentLoaded', initStage3);
  }
})();