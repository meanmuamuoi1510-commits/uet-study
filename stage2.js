/**
 * MechaStudy - CHẶNG 2 (stage2.js)
 * Phân tích đề bài Cơ học / Vật lý kỹ thuật, Giải bài theo lô, Cắt hình & Đồng bộ GitHub
 * Tương thích hoàn toàn với index.html (Chặng 1) và xuất API cho Chặng 3, 4.
 */
(function () {
  'use strict';

  /* ==========================================================================
     1. KHỞI TẠO (Inject CSS s2-, Khởi tạo giao diện nộp bài, Khôi phục phiên dở)
     ========================================================================== */

  const S2_STATE = {
    selectedFiles: [],
    currentFileIndex: 0,
    activeJob: null,
    pdfJsPromise: null,
    katexPromise: null
  };

  function injectStage2Styles() {
    if (document.getElementById('s2-styles')) return;
    const style = document.createElement('style');
    style.id = 's2-styles';
    style.textContent = `
      .s2-card {
        background: var(--bg-panel, #ffffff);
        border: 1px solid var(--border, #e2e8f0);
        border-radius: var(--radius, 8px);
        padding: 18px;
        box-shadow: var(--shadow, 0 4px 6px -1px rgba(0,0,0,0.1));
        margin-bottom: 18px;
      }
      .s2-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--primary, #2563eb);
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
      }
      .s2-dropzone {
        border: 2px dashed var(--border, #cbd5e1);
        border-radius: var(--radius, 8px);
        padding: 24px 16px;
        text-align: center;
        background: var(--bg-main, #f8fafc);
        cursor: pointer;
        transition: border-color 0.2s, background 0.2s;
        margin-bottom: 14px;
      }
      .s2-dropzone.s2-dragover {
        border-color: var(--primary, #2563eb);
        background: var(--bg-sidebar, #f1f5f9);
      }
      .s2-grid-2 {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 12px;
        margin-bottom: 12px;
      }
      .s2-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 9px;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 600;
        background: var(--bg-sidebar, #f1f5f9);
        border: 1px solid var(--border, #e2e8f0);
        color: var(--text-main, #0f172a);
      }
      .s2-badge-warn {
        background: rgba(217, 119, 6, 0.14);
        border-color: var(--warning, #d97706);
        color: var(--warning, #d97706);
      }
      .s2-badge-ok {
        background: rgba(22, 163, 74, 0.14);
        border-color: var(--success, #16a34a);
        color: var(--success, #16a34a);
      }
      .s2-alert {
        padding: 12px 14px;
        border-radius: var(--radius, 8px);
        border: 1px solid var(--border, #e2e8f0);
        background: var(--bg-sidebar, #f1f5f9);
        margin: 10px 0;
        font-size: 0.9rem;
        line-height: 1.5;
      }
      .s2-alert-warn {
        border-color: var(--warning, #d97706);
        background: rgba(217, 119, 6, 0.1);
      }
      .s2-alert-err {
        border-color: var(--danger, #dc2626);
        background: rgba(220, 38, 38, 0.1);
      }
      .s2-progress-wrap {
        width: 100%;
        height: 10px;
        background: var(--bg-sidebar, #e2e8f0);
        border-radius: 999px;
        overflow: hidden;
        margin: 8px 0;
        border: 1px solid var(--border, #cbd5e1);
      }
      .s2-progress-bar {
        height: 100%;
        width: 0%;
        background: var(--primary, #2563eb);
        transition: width 0.25s ease;
      }
      .s2-btn-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        margin-top: 10px;
      }
      .s2-collapse-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        padding: 10px 14px;
        background: var(--bg-sidebar, #f1f5f9);
        border: 1px solid var(--border, #e2e8f0);
        border-radius: var(--radius, 8px);
        font-weight: 700;
        user-select: none;
      }
      .s2-collapse-body {
        border: 1px solid var(--border, #e2e8f0);
        border-top: none;
        border-radius: 0 0 var(--radius, 8px) var(--radius, 8px);
        padding: 16px;
        background: var(--bg-panel, #ffffff);
        margin-bottom: 14px;
      }
      .s2-collapse-body.s2-hidden {
        display: none;
      }
      .s2-table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0;
        font-size: 0.9rem;
      }
      .s2-table th, .s2-table td {
        border: 1px solid var(--border, #e2e8f0);
        padding: 8px 10px;
        text-align: left;
        vertical-align: top;
      }
      .s2-table th {
        background: var(--bg-sidebar, #f1f5f9);
        font-weight: 600;
      }
      .s2-prob-layout {
        display: grid;
        grid-template-columns: minmax(240px, 340px) 1fr;
        gap: 16px;
        align-items: start;
      }
      @media (max-width: 820px) {
        .s2-prob-layout {
          grid-template-columns: 1fr;
        }
      }
      .s2-fig-box {
        background: var(--bg-main, #f8fafc);
        border: 1px solid var(--border, #e2e8f0);
        border-radius: var(--radius, 8px);
        padding: 10px;
        text-align: center;
      }
      .s2-fig-box img, .s2-fig-box svg {
        max-width: 100%;
        height: auto;
        border-radius: 4px;
        display: block;
        margin: 0 auto;
      }
      .s2-bbox-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
        margin-top: 8px;
      }
      .s2-bbox-grid input {
        padding: 4px 6px;
        font-size: 0.78rem;
        text-align: center;
      }
      .s2-step-item {
        padding: 10px 12px;
        border-left: 3px solid var(--primary, #2563eb);
        background: var(--bg-main, #f8fafc);
        border-radius: 0 var(--radius, 8px) var(--radius, 8px) 0;
        margin-bottom: 10px;
      }
      .s2-math-block {
        margin: 6px 0;
        padding: 6px 8px;
        background: var(--bg-panel, #ffffff);
        border: 1px dashed var(--border, #cbd5e1);
        border-radius: 6px;
        overflow-x: auto;
      }
      .s2-file-list {
        list-style: none;
        margin: 8px 0;
        font-size: 0.88rem;
      }
      .s2-file-list li {
        padding: 5px 8px;
        border-bottom: 1px dashed var(--border, #e2e8f0);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    `;
    document.head.appendChild(style);
  }

  function initStage2() {
    injectStage2Styles();
    const mainEl = document.getElementById('main-content');
    if (!mainEl) return;

    const wrapper = document.createElement('div');
    wrapper.id = 's2-root-container';
    wrapper.innerHTML = `
      <div class="s2-card" id="s2-upload-card">
        <div class="s2-title">
          <span>📥 Nộp bài tập mới (Chặng 2: Quét & Giải tự động)</span>
          <span class="s2-badge" id="s2-file-queue-badge">Chưa chọn file</span>
        </div>

        <!-- Khối khôi phục công việc đang dở trong IndexedDB -->
        <div id="s2-unfinished-banner" class="s2-alert s2-alert-warn" style="display:none;"></div>

        <!-- Vùng kéo thả file -->
        <div class="s2-dropzone" id="s2-dropzone">
          <div style="font-size:1.8rem; margin-bottom:6px;">📄 🖼️</div>
          <div><strong>Kéo thả file bài tập vào đây</strong> hoặc bấm để chọn file</div>
          <div style="font-size:0.82rem; color:var(--text-muted, #64748b); margin-top:4px;">
            Hỗ trợ nhiều file: PDF, PNG, JPG (Xử lý tuần tự từng file, tối đa mặc định 15 trang/file)
          </div>
          <input type="file" id="s2-file-input" multiple accept=".pdf,image/png,image/jpeg" style="display:none;">
        </div>

        <ul class="s2-file-list" id="s2-selected-files-list" style="display:none;"></ul>

        <!-- 4 Ô tùy chọn thông tin nộp bài -->
        <div class="s2-grid-2">
          <div>
            <label for="s2-inp-date">Ngày nộp (YYYY-MM-DD)</label>
            <input type="text" id="s2-inp-date" value="${escapeHTML(getLocalTodayStr())}">
          </div>
          <div>
            <label for="s2-inp-subject">Môn học (Tùy chọn, để trống AI tự nhận diện)</label>
            <input type="text" id="s2-inp-subject" placeholder="VD: Cơ học kỹ thuật, Sức bền vật liệu, Vật lý 1...">
          </div>
          <div>
            <label for="s2-inp-chapter">Chương / Hashtag ép buộc (Tùy chọn)</label>
            <input type="text" id="s2-inp-chapter" placeholder="VD: #c3 hoặc Chương 3: Tĩnh học vật rắn">
          </div>
          <div>
            <label for="s2-inp-note">Ghi chú của tôi (Tùy chọn)</label>
            <input type="text" id="s2-inp-note" placeholder="VD: Bài tập về nhà tuần 5, ôn thi giữa kỳ...">
          </div>
        </div>

        <!-- Khu vực điều khiển tiền xử lý, cảnh báo trang, báo trùng và tiến trình -->
        <div id="s2-preprocess-area"></div>
        <div id="s2-progress-area" style="display:none;">
          <div style="display:flex; justify-content:space-between; font-size:0.86rem; font-weight:600;">
            <span id="s2-progress-step-text">Đang chuẩn bị...</span>
            <span id="s2-progress-token-text">Token phiên: 0</span>
          </div>
          <div class="s2-progress-wrap">
            <div class="s2-progress-bar" id="s2-progress-bar"></div>
          </div>
          <div id="s2-batch-log" style="font-size:0.82rem; color:var(--text-muted, #64748b); margin-top:4px;"></div>
        </div>
      </div>

      <!-- Nơi hiển thị kết quả phân tích & lời giải -->
      <div id="s2-result-mount"></div>
    `;

    mainEl.insertBefore(wrapper, mainEl.firstChild);
    bindUploadEvents();
    checkUnfinishedJobsInIDB();
  }

  function bindUploadEvents() {
    const dropzone = document.getElementById('s2-dropzone');
    const fileInput = document.getElementById('s2-file-input');

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('s2-dragover');
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('s2-dragover');
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('s2-dragover');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFilesSelected(Array.from(e.dataTransfer.files));
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFilesSelected(Array.from(e.target.files));
      }
    });
  }

  async function checkUnfinishedJobsInIDB() {
    try {
      const keys = await dbKeys('job:');
      if (!keys || keys.length === 0) return;

      const unfinished = [];
      for (const k of keys) {
        const job = await dbGet(k);
        if (job && job.status !== 'done' && job.pageImages && job.pageImages.length > 0) {
          unfinished.push(job);
        }
      }
      if (unfinished.length === 0) return;

      const latestJob = unfinished.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
      const banner = document.getElementById('s2-unfinished-banner');
      if (!banner) return;

      const solvedCount = Object.keys(latestJob.solutionsById || {}).length;
      const totalProb = (latestJob.scanResult && latestJob.scanResult.danh_sach_bai)
        ? latestJob.scanResult.danh_sach_bai.length
        : '?';

      banner.style.display = 'block';
      banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <strong>🔄 Phát hiện bài đang phân tích dở:</strong>
            <span>${escapeHTML(latestJob.fileName)} (Mã: <code>${escapeHTML(latestJob.hash8)}</code>) — Đã giải ${solvedCount}/${totalProb} bài.</span>
          </div>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn-primary btn-sm" id="s2-btn-resume-job">Tiếp tục từ lô còn dở</button>
            <button type="button" class="btn-danger btn-sm" id="s2-btn-discard-job">Xóa bản dở</button>
          </div>
        </div>
      `;

      document.getElementById('s2-btn-resume-job').onclick = async () => {
        banner.style.display = 'none';
        S2_STATE.activeJob = latestJob;
        await resumeJobExecution(latestJob);
      };
      document.getElementById('s2-btn-discard-job').onclick = async () => {
        await dbDelete(`job:${latestJob.hash8}`);
        banner.style.display = 'none';
      };
    } catch (e) {
      /* Bỏ qua nếu IndexedDB trống */
    }
  }


  /* ==========================================================================
     2. THƯ VIỆN (Lazy Load pdf.js 3.11.174 và KaTeX 0.16.9 từ cdnjs)
     ========================================================================== */

  const CDN_URLS = {
    PDF_JS: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    PDF_WORKER: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    KATEX_CSS: 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css',
    KATEX_JS: 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js',
    KATEX_AUTORENDER: 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js'
  };

  function loadScriptTag(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing && existing.getAttribute('data-loaded') === 'true') {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => {
        s.setAttribute('data-loaded', 'true');
        resolve();
      };
      s.onerror = () => reject(new Error(`Không thể tải thư viện từ CDN: ${src}`));
      document.head.appendChild(s);
    });
  }

  function loadCssTag(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  async function ensurePdfJsLoaded() {
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN_URLS.PDF_WORKER;
      return window.pdfjsLib;
    }
    if (!S2_STATE.pdfJsPromise) {
      S2_STATE.pdfJsPromise = loadScriptTag(CDN_URLS.PDF_JS).then(() => {
        if (!window.pdfjsLib) throw new Error('Tải xong pdf.min.js nhưng không tìm thấy window.pdfjsLib.');
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN_URLS.PDF_WORKER;
        return window.pdfjsLib;
      }).catch(err => {
        S2_STATE.pdfJsPromise = null;
        throw err;
      });
    }
    return S2_STATE.pdfJsPromise;
  }

  async function ensureKatexLoaded() {
    loadCssTag(CDN_URLS.KATEX_CSS);
    if (window.katex && window.renderMathInElement) return window.katex;
    if (!S2_STATE.katexPromise) {
      S2_STATE.katexPromise = loadScriptTag(CDN_URLS.KATEX_JS)
        .then(() => loadScriptTag(CDN_URLS.KATEX_AUTORENDER))
        .then(() => window.katex)
        .catch(err => {
          S2_STATE.katexPromise = null;
          throw err;
        });
    }
    return S2_STATE.katexPromise;
  }


  /* ==========================================================================
     3. TIỀN XỬ LÝ (SHA-256, Kiểm tra trùng, Render PDF / Nén ảnh JPEG 1500px)
     ========================================================================== */

  function handleFilesSelected(files) {
    const valid = files.filter(f => {
      const t = (f.type || '').toLowerCase();
      const n = (f.name || '').toLowerCase();
      return t === 'application/pdf' || t === 'image/png' || t === 'image/jpeg' ||
             n.endsWith('.pdf') || n.endsWith('.png') || n.endsWith('.jpg') || n.endsWith('.jpeg');
    });

    if (valid.length === 0) {
      showPreprocessError('Vui lòng chỉ chọn file định dạng PDF, PNG hoặc JPG.');
      return;
    }

    S2_STATE.selectedFiles = valid;
    S2_STATE.currentFileIndex = 0;
    renderSelectedFilesQueue();
    prepareCurrentFileInQueue();
  }

  function renderSelectedFilesQueue() {
    const badge = document.getElementById('s2-file-queue-badge');
    const listEl = document.getElementById('s2-selected-files-list');
    const total = S2_STATE.selectedFiles.length;
    const idx = S2_STATE.currentFileIndex;

    if (total === 0) {
      badge.textContent = 'Chưa chọn file';
      listEl.style.display = 'none';
      return;
    }

    badge.textContent = `File ${idx + 1}/${total}`;
    listEl.style.display = 'block';
    listEl.innerHTML = S2_STATE.selectedFiles.map((f, i) => {
      let statusLabel = '⏳ Chờ xử lý';
      if (i < idx) statusLabel = '✅ Đã xong';
      else if (i === idx) statusLabel = '👉 Đang chọn';
      return `<li>
        <span><strong>${i + 1}.</strong> ${escapeHTML(f.name)} <span style="color:var(--text-muted);">(${(f.size / 1024).toFixed(1)} KB)</span></span>
        <span class="s2-badge">${statusLabel}</span>
      </li>`;
    }).join('');
  }

  async function computeFileSha256(file) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash64 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return { hash64, hash8: hash64.slice(0, 8), buffer };
  }

  async function checkDuplicateSubmission(hash64, hash8) {
    // 1. Kiểm tra trong IndexedDB trước
    try {
      const localRecord = await dbGet(`result:${hash8}`);
      if (localRecord && localRecord.meta) {
        return {
          isDuplicate: true,
          folderPath: localRecord.folderPath || buildPaths(localRecord.meta.ngay, hash8).baseDir,
          dateStr: localRecord.meta.ngay || 'trước đó',
          source: 'IndexedDB'
        };
      }
      const hashesCache = await dbGet('index:hashes');
      if (hashesCache && hashesCache[hash64]) {
        const folder = hashesCache[hash64];
        const dateMatch = folder.match(/(\d{4}-\d{2}-\d{2})_/);
        return {
          isDuplicate: true,
          folderPath: folder,
          dateStr: dateMatch ? dateMatch[1] : 'trước đó',
          source: 'IndexedDB'
        };
      }
    } catch (e) { /* Bỏ qua lỗi đọc cache */ }

    // 2. Kiểm tra file index/hashes.json trên GitHub repo (nếu đã cấu hình GitHub)
    try {
      const s = loadSettings();
      if (s?.github?.token) {
        const ghHashes = await ghGetFile('index/hashes.json');
        if (ghHashes && ghHashes.content) {
          const map = JSON.parse(ghHashes.content);
          await dbSet('index:hashes', map);
          if (map[hash64]) {
            const folder = map[hash64];
            const dateMatch = folder.match(/(\d{4}-\d{2}-\d{2})_/);
            return {
              isDuplicate: true,
              folderPath: folder,
              dateStr: dateMatch ? dateMatch[1] : 'trước đó',
              source: 'GitHub'
            };
          }
        }
      }
    } catch (e) { /* Bỏ qua nếu chưa có hashes.json hoặc chưa cài token */ }

    return { isDuplicate: false };
  }

  async function prepareCurrentFileInQueue() {
    const area = document.getElementById('s2-preprocess-area');
    if (S2_STATE.currentFileIndex >= S2_STATE.selectedFiles.length) {
      area.innerHTML = `<div class="s2-alert s2-badge-ok">🎉 Đã hoàn tất xử lý toàn bộ các file trong danh sách!</div>`;
      return;
    }

    const file = S2_STATE.selectedFiles[S2_STATE.currentFileIndex];
    renderSelectedFilesQueue();

    area.innerHTML = `<div class="s2-alert">⏳ Đang tính mã băm SHA-256 và kiểm tra trùng lặp cho file <strong>${escapeHTML(file.name)}</strong>...</div>`;

    try {
      const { hash64, hash8, buffer } = await computeFileSha256(file);
      const dupInfo = await checkDuplicateSubmission(hash64, hash8);

      if (dupInfo.isDuplicate) {
        area.innerHTML = `
          <div class="s2-alert s2-alert-warn">
            <div><strong>⚠️ File "${escapeHTML(file.name)}" đã phân tích ngày ${escapeHTML(dupInfo.dateStr)}</strong> (Thư mục: <code>${escapeHTML(dupInfo.folderPath)}</code>).</div>
            <div class="s2-btn-row">
              <button type="button" class="btn-primary" id="s2-btn-open-dup">📂 Mở lại kết quả</button>
              <button type="button" id="s2-btn-reanalyze-dup">🔄 Phân tích lại</button>
              ${S2_STATE.selectedFiles.length > 1 ? `<button type="button" id="s2-btn-skip-file">⏭ Bỏ qua, sang file kế tiếp</button>` : ''}
            </div>
          </div>
        `;

        document.getElementById('s2-btn-open-dup').onclick = async () => {
          await openResultByFolder(dupInfo.folderPath);
        };
        document.getElementById('s2-btn-reanalyze-dup').onclick = async () => {
          await inspectAndRenderPages(file, buffer, hash64, hash8);
        };
        const skipBtn = document.getElementById('s2-btn-skip-file');
        if (skipBtn) {
          skipBtn.onclick = () => {
            S2_STATE.currentFileIndex++;
            prepareCurrentFileInQueue();
          };
        }
        return;
      }

      await inspectAndRenderPages(file, buffer, hash64, hash8);
    } catch (err) {
      showPreprocessError(`Lỗi tiền xử lý file "${file.name}": ${err.message}`, () => prepareCurrentFileInQueue());
    }
  }

  async function inspectAndRenderPages(file, arrayBuffer, hash64, hash8) {
    const area = document.getElementById('s2-preprocess-area');
    const isPdf = (file.type === 'application/pdf') || file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      area.innerHTML = `<div class="s2-alert">⏳ Đang nén ảnh <strong>${escapeHTML(file.name)}</strong> (cạnh dài tối đa 1500px, JPEG 0.8)...</div>`;
      const pageImg = await compressImageFileToJpeg(file, 1500, 0.8);
      renderPreAnalysisConfirmation(file, hash64, hash8, [pageImg]);
      return;
    }

    area.innerHTML = `<div class="s2-alert">⏳ Đang nạp thư viện PDF.js (v3.11.174) và kiểm tra số trang của <strong>${escapeHTML(file.name)}</strong>...</div>`;
    const pdfjsLib = await ensurePdfJsLoaded();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
    const totalPages = pdfDoc.numPages;

    if (totalPages > 15) {
      area.innerHTML = `
        <div class="s2-alert s2-alert-warn">
          <div><strong>⚠️ Cảnh báo:</strong> File PDF <strong>${escapeHTML(file.name)}</strong> có tới <strong>${totalPages} trang</strong> (vượt giới hạn mặc định 15 trang/file). Vui lòng chọn khoảng trang cần trích xuất (tối đa 15 trang):</div>
          <div class="s2-grid-2" style="margin-top:10px; max-width:360px;">
            <div>
              <label>Từ trang</label>
              <input type="number" id="s2-page-from" min="1" max="${totalPages}" value="1">
            </div>
            <div>
              <label>Đến trang</label>
              <input type="number" id="s2-page-to" min="1" max="${totalPages}" value="15">
            </div>
          </div>
          <div class="s2-btn-row">
            <button type="button" class="btn-primary" id="s2-btn-render-range">Trích xuất khoảng trang này</button>
          </div>
        </div>
      `;

      document.getElementById('s2-btn-render-range').onclick = async () => {
        let pFrom = parseInt(document.getElementById('s2-page-from').value, 10) || 1;
        let pTo = parseInt(document.getElementById('s2-page-to').value, 10) || 15;
        pFrom = Math.max(1, Math.min(totalPages, pFrom));
        pTo = Math.max(pFrom, Math.min(totalPages, pTo));
        if (pTo - pFrom + 1 > 15) {
          pTo = pFrom + 14;
        }
        await renderPdfPageRange(pdfDoc, pFrom, pTo, file, hash64, hash8);
      };
    } else {
      await renderPdfPageRange(pdfDoc, 1, totalPages, file, hash64, hash8);
    }
  }

  async function renderPdfPageRange(pdfDoc, startPage, endPage, file, hash64, hash8) {
    const area = document.getElementById('s2-preprocess-area');
    const pageImages = [];
    const count = endPage - startPage + 1;

    for (let p = startPage; p <= endPage; p++) {
      const idx = p - startPage + 1;
      area.innerHTML = `<div class="s2-alert">⏳ Đang kết xuất trang PDF ${p} (${idx}/${count}) thành ảnh JPEG (cạnh dài ≤ 1500px)...</div>`;
      const page = await pdfDoc.getPage(p);
      const unscaledViewport = page.getViewport({ scale: 1 });
      const maxDim = Math.max(unscaledViewport.width, unscaledViewport.height, 1);
      const scale = Math.min(2.0, 1500 / maxDim);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      pageImages.push({
        pageNumber: pageImages.length + 1,
        originalPdfPage: p,
        width: canvas.width,
        height: canvas.height,
        dataUrl
      });
    }

    renderPreAnalysisConfirmation(file, hash64, hash8, pageImages);
  }

  function compressImageFileToJpeg(file, maxEdge = 1500, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Không đọc được file ảnh.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Định dạng ảnh không hợp lệ.'));
        img.onload = () => {
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;
          if (w > maxEdge || h > maxEdge) {
            const ratio = maxEdge / Math.max(w, h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          resolve({
            pageNumber: 1,
            originalPdfPage: 1,
            width: w,
            height: h,
            dataUrl: canvas.toDataURL('image/jpeg', quality)
          });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function getAppQuotaDisplayString() {
    const quotaEl = document.getElementById('ai-quota-text');
    if (quotaEl && quotaEl.textContent) {
      return quotaEl.textContent.trim();
    }
    try {
      const raw = localStorage.getItem('mechastudy_daily_quota_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        const s = loadSettings();
        return `${parsed.count || 0}/${s?.limits?.maxPerDay || 100}`;
      }
    } catch (e) { /* Bỏ qua */ }
    return null;
  }

  function renderPreAnalysisConfirmation(file, hash64, hash8, pageImages) {
    const area = document.getElementById('s2-preprocess-area');
    const quotaInfo = getAppQuotaDisplayString();
    const estProbsDefault = Math.max(1, pageImages.length * 2);
    const estBatchesDefault = Math.ceil(estProbsDefault / 3);
    const estTotalDefault = 1 + estBatchesDefault;

    area.innerHTML = `
      <div class="s2-alert">
        <div style="margin-bottom:8px;">
          <strong>✅ Tiền xử lý hoàn tất tại trình duyệt (0 lượt API):</strong>
          File <strong>${escapeHTML(file.name)}</strong> (${pageImages.length} trang ảnh JPEG, mã <code>${escapeHTML(hash8)}</code>).
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin-bottom:10px;">
          <span>Dự kiến số bài trong file (để ước tính):</span>
          <input type="number" id="s2-est-prob-input" min="1" max="60" value="${estProbsDefault}" style="width:75px; padding:4px 8px;">
          <span class="s2-badge" id="s2-est-calls-badge">
            Ước tính: 1 lượt quét + ceil(${estProbsDefault}/3) = ${estTotalDefault} lượt gọi AI
          </span>
          ${quotaInfo ? `<span class="s2-badge">Hôm nay đã dùng: <strong>${escapeHTML(quotaInfo)}</strong> lượt</span>` : ''}
        </div>
        <div class="s2-btn-row">
          <button type="button" class="btn-primary" id="s2-btn-start-analysis">🚀 Bắt đầu phân tích</button>
          ${S2_STATE.selectedFiles.length > 1 ? `<button type="button" id="s2-btn-skip-pre">⏭ Bỏ qua file này</button>` : ''}
        </div>
      </div>
    `;

    const estInput = document.getElementById('s2-est-prob-input');
    const estBadge = document.getElementById('s2-est-calls-badge');
    estInput.addEventListener('input', () => {
      const n = Math.max(1, parseInt(estInput.value, 10) || 1);
      const b = Math.ceil(n / 3);
      estBadge.textContent = `Ước tính: 1 lượt quét + ceil(${n}/3) (${b} lượt giải) = ${1 + b} lượt gọi AI`;
    });

    document.getElementById('s2-btn-start-analysis').onclick = async () => {
      const job = {
        hash64,
        hash8,
        fileName: file.name,
        ngay: (document.getElementById('s2-inp-date').value || '').trim() || getLocalTodayStr(),
        forcedSubject: (document.getElementById('s2-inp-subject').value || '').trim(),
        forcedChapter: (document.getElementById('s2-inp-chapter').value || '').trim(),
        userNote: (document.getElementById('s2-inp-note').value || '').trim(),
        pageImages,
        scanResult: null,
        solutionsById: {},
        croppedFigures: {},
        totalTokens: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        stepLogs: [],
        status: 'created',
        updatedAt: Date.now()
      };
      S2_STATE.activeJob = job;
      await dbSet(`job:${job.hash8}`, job);
      await resumeJobExecution(job);
    };

    const skipBtn = document.getElementById('s2-btn-skip-pre');
    if (skipBtn) {
      skipBtn.onclick = () => {
        S2_STATE.currentFileIndex++;
        prepareCurrentFileInQueue();
      };
    }
  }


  /* ==========================================================================
     4. QUÉT (Bước 1: Gửi toàn bộ trang ảnh với vai_tro 'quet' & jsonSchema tương thích)
     ========================================================================== */

  const SCAN_JSON_SCHEMA = {
    type: 'object',
    description: 'Kết quả quét đề bài tập cơ học và vật lý kỹ thuật',
    required: ['file', 'kien_thuc', 'danh_sach_bai'],
    properties: {
      file: {
        type: 'object',
        required: ['tieu_de', 'mon_hoc', 'chuong', 'chu_de', 'hashtags'],
        properties: {
          tieu_de: { type: 'string', description: 'Tiêu đề tài liệu hoặc phiếu bài tập' },
          mon_hoc: { type: 'string', description: 'Tên môn học nhận diện được' },
          chuong: {
            type: 'object',
            required: ['so', 'ten'],
            properties: {
              so: { type: 'number', description: 'Số thứ tự chương (ví dụ 1, 2, 3)' },
              ten: { type: 'string', description: 'Tên chương học' }
            }
          },
          chu_de: { type: 'string', description: 'Chủ đề chính của phiếu bài tập' },
          hashtags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Danh sách hashtag phân loại (ví dụ #tinh_hoc, #c3)'
          }
        }
      },
      kien_thuc: {
        type: 'object',
        required: ['tom_tat', 'cong_thuc', 'khai_niem'],
        properties: {
          tom_tat: { type: 'string', description: 'Tóm tắt kiến thức trọng tâm tối đa 150 từ' },
          cong_thuc: {
            type: 'array',
            items: {
              type: 'object',
              required: ['ten', 'latex', 'dieu_kien_dung', 'don_vi'],
              properties: {
                ten: { type: 'string' },
                latex: { type: 'string', description: 'Công thức LaTeX thuần không kèm dấu $' },
                dieu_kien_dung: { type: 'string' },
                don_vi: { type: 'string' }
              }
            }
          },
          khai_niem: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      danh_sach_bai: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'nhan', 'trang', 'co_hinh', 'bbox_hinh', 'de_tom_tat', 'du_kien', 'can_tim', 'thieu_du_kien'],
          properties: {
            id: { type: 'string', description: 'Mã bài duy nhất, ví dụ bai_1, bai_2' },
            nhan: { type: 'string', description: 'Nhãn hiển thị của bài, ví dụ Bài 1, Câu 2' },
            trang: { type: 'number', description: 'Số thứ tự trang chứa bài tính từ 1' },
            co_hinh: { type: 'boolean', description: 'True nếu bài có hình vẽ minh họa trong trang' },
            bbox_hinh: {
              type: 'array',
              items: { type: 'number' },
              description: 'Khung hình [ymin, xmin, ymax, xmax] thang 0-1000, mảng rỗng nếu co_hinh=false'
            },
            de_tom_tat: { type: 'string', description: 'Tóm tắt đề bài tối đa 60 từ' },
            du_kien: {
              type: 'array',
              items: { type: 'string' },
              description: 'Danh sách dữ kiện đã cho kèm đơn vị'
            },
            can_tim: {
              type: 'array',
              items: { type: 'string' },
              description: 'Danh sách đại lượng cần tìm'
            },
            thieu_du_kien: {
              type: 'array',
              items: { type: 'string' },
              description: 'Các dữ kiện bị mờ hoặc thiếu trong đề, mảng rỗng nếu đủ'
            }
          }
        }
      }
    }
  };

  const SCAN_SYSTEM_PROMPT =
    'Bạn là giảng viên cơ học và vật lý đại cương kỹ thuật. Tự nhận diện môn học và chương; ' +
    'mọi công thức viết bằng LaTeX thuần KHÔNG kèm dấu $; tuyệt đối không bịa số liệu, nếu đề mờ hoặc thiếu dữ kiện thì ghi rõ vào thieu_du_kien; ' +
    'không giải thích dài dòng. Với bài có hình vẽ trên đề, trả về bbox_hinh [ymin,xmin,ymax,xmax] trên thang 0-1000 bao trọn hình vẽ và ký hiệu kích thước/lực của bài đó.';

  async function runScanStep(job) {
    updateProgressUI(10, 'Bước 1: Đang quét cấu trúc đề bài và kiến thức tổng hợp...', job);
    const imagesDataUrls = job.pageImages.map(p => p.dataUrl);

    const userHint = [
      `Hãy quét toàn bộ ${imagesDataUrls.length} trang tài liệu đính kèm (đánh số trang từ 1 đến ${imagesDataUrls.length}).`,
      job.forcedSubject ? `Gợi ý môn học từ người học: "${job.forcedSubject}".` : '',
      job.forcedChapter ? `Gợi ý chương/hashtag bắt buộc: "${job.forcedChapter}".` : ''
    ].filter(Boolean).join(' ');

    const res = await callLLM({
      vai_tro: 'quet',
      system: SCAN_SYSTEM_PROMPT,
      text: userHint,
      images: imagesDataUrls,
      jsonSchema: SCAN_JSON_SCHEMA,
      maxTokens: 8192
    });

    accumulateTokens(job, 'Bước Quét', res.usage);
    job.scanResult = res.data;
    job.status = 'scanned';
    job.updatedAt = Date.now();
    await dbSet(`job:${job.hash8}`, job);
  }


  /* ==========================================================================
     5. GIẢI (Bước 2: Giải theo lô 3 bài, lưu tiến độ IndexedDB sau mỗi lô)
     ========================================================================== */

  const SOLVE_BATCH_SCHEMA = {
    type: 'object',
    description: 'Kết quả giải chi tiết cho một lô bài tập cơ học/vật lý',
    required: ['danh_sach_loi_giai'],
    properties: {
      danh_sach_loi_giai: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'phuong_phap', 'loi_giai', 'dap_so', 'kiem_tra', 'svg_hinh', 'goi_y_dong', 'can_xac_nhan'],
          properties: {
            id: { type: 'string', description: 'Khớp chính xác với id của bài trong bước quét' },
            phuong_phap: { type: 'string', description: 'Phương pháp giải ngắn gọn trong 1-2 câu' },
            loi_giai: {
              type: 'array',
              items: {
                type: 'object',
                required: ['buoc', 'mo_ta', 'cong_thuc', 'the_so', 'ket_qua'],
                properties: {
                  buoc: { type: 'number' },
                  mo_ta: { type: 'string' },
                  cong_thuc: { type: 'string', description: 'Công thức tổng quát viết bằng LaTeX thuần không có dấu $' },
                  the_so: { type: 'string', description: 'Biểu thức LaTeX có thế số cụ thể kèm ĐƠN VỊ' },
                  ket_qua: { type: 'string', description: 'Giá trị tính được kèm đơn vị chuẩn SI' }
                }
              }
            },
            dap_so: {
              type: 'array',
              items: {
                type: 'object',
                required: ['dai_luong', 'gia_tri', 'don_vi'],
                properties: {
                  dai_luong: { type: 'string' },
                  gia_tri: { type: 'string' },
                  don_vi: { type: 'string' }
                }
              }
            },
            kiem_tra: {
              type: 'string',
              description: 'Kiểm tra nhanh cân bằng lực/mô men hoặc thứ nguyên, dấu, độ lớn hợp lý'
            },
            svg_hinh: {
              type: 'string',
              description: 'Mã SVG gọn (viewBox="0 0 400 260") vẽ vật thể, gối đỡ/liên kết, lực, mô men, kích thước CHỈ điền khi co_hinh=false; chuỗi rỗng nếu co_hinh=true'
            },
            goi_y_dong: {
              type: 'string',
              description: 'Đối tượng chuyển động và thông số nên cho kéo thanh trượt ở chặng 4'
            },
            can_xac_nhan: {
              type: 'array',
              items: { type: 'string' },
              description: 'Các giả thiết hoặc số liệu mờ cần sinh viên xác nhận lại (mảng rỗng nếu rõ ràng)'
            }
          }
        }
      }
    }
  };

  const SOLVE_SYSTEM_PROMPT =
    'Bạn là giảng viên cơ học kỹ thuật và vật lý đại cương. Hãy giải đầy đủ từng bước cho các bài tập được giao. ' +
    'Mỗi phép tính bắt buộc có công thức LaTeX thuần (không bọc dấu $), biểu thức thế số kèm ĐƠN VỊ và kết quả theo đơn vị SI (N, kN, N·m, m, MPa, rad/s...). ' +
    'Dùng đúng ký hiệu giáo trình cơ học kỹ thuật tiếng Việt. ' +
    'Nếu bài có co_hinh=false, hãy tự vẽ sơ đồ nguyên lý/vật thể tự do bằng mã SVG sạch, gọn vào trường svg_hinh; nếu co_hinh=true thì để svg_hinh="".';

  async function runSolveBatch(job, batchProblems, batchIndex, totalBatches) {
    // Chỉ lấy đúng các ảnh trang có chứa bài trong lô này
    const pageSet = new Set();
    batchProblems.forEach(b => {
      const pNum = Math.max(1, Math.min(job.pageImages.length, Number(b.trang) || 1));
      pageSet.add(pNum);
    });
    const sortedPageNums = Array.from(pageSet).sort((a, b) => a - b);
    const batchImages = sortedPageNums.map(pNum => job.pageImages[pNum - 1].dataUrl);

    const promptPayload = {
      trang_anh_dinh_kem_theo_thu_tu: sortedPageNums,
      cac_bai_can_giai_trong_lo: batchProblems
    };

    const res = await callLLM({
      vai_tro: 'giai',
      system: SOLVE_SYSTEM_PROMPT,
      text: `Giải chi tiết lô ${batchIndex + 1}/${totalBatches} gồm ${batchProblems.length} bài tập sau đây:\n${JSON.stringify(promptPayload)}`,
      images: batchImages,
      jsonSchema: SOLVE_BATCH_SCHEMA,
      maxTokens: 8192
    });

    accumulateTokens(job, `Lô giải ${batchIndex + 1}/${totalBatches}`, res.usage);

    const list = res.data?.danh_sach_loi_giai || [];
    for (const sol of list) {
      if (sol && sol.id) {
        job.solutionsById[sol.id] = sol;
      }
    }
    job.updatedAt = Date.now();
    await dbSet(`job:${job.hash8}`, job);
  }

  async function resumeJobExecution(job) {
    const progressArea = document.getElementById('s2-progress-area');
    const preArea = document.getElementById('s2-preprocess-area');
    progressArea.style.display = 'block';

    // Bước 1: Quét nếu chưa có scanResult
    if (!job.scanResult) {
      try {
        await runScanStep(job);
      } catch (scanErr) {
        preArea.innerHTML = `
          <div class="s2-alert s2-alert-err">
            <div><strong>❌ Lỗi ở Bước Quét:</strong> ${escapeHTML(scanErr.message)}</div>
            <div class="s2-btn-row">
              <button type="button" class="btn-primary" id="s2-btn-retry-scan">↻ Thử lại bước quét</button>
            </div>
          </div>
        `;
        document.getElementById('s2-btn-retry-scan').onclick = () => resumeJobExecution(job);
        return;
      }
    }

    const problems = job.scanResult.danh_sach_bai || [];
    // Cắt hình tự động cho các bài co_hinh=true ngay sau khi có bbox_hinh
    await autoCropAllFiguresInJob(job);

    // Chia lô 3 bài
    const batches = [];
    for (let i = 0; i < problems.length; i += 3) {
      batches.push(problems.slice(i, i + 3));
    }

    // Bước 2: Giải từng lô chưa xong
    for (let bIdx = 0; bIdx < batches.length; bIdx++) {
      const batch = batches[bIdx];
      const allSolved = batch.every(p => Boolean(job.solutionsById[p.id]));
      if (allSolved) continue;

      const pct = Math.round(25 + ((bIdx) / Math.max(1, batches.length)) * 60);
      const labelList = batch.map(p => p.nhan || p.id).join(', ');
      updateProgressUI(pct, `Bước 2: Đang giải lô ${bIdx + 1}/${batches.length} (${labelList})...`, job);

      try {
        await runSolveBatch(job, batch, bIdx, batches.length);
      } catch (batchErr) {
        preArea.innerHTML = `
          <div class="s2-alert s2-alert-err">
            <div><strong>❌ Lỗi khi giải Lô ${bIdx + 1}/${batches.length} (${escapeHTML(labelList)}):</strong> ${escapeHTML(batchErr.message)}</div>
            <div style="font-size:0.84rem; margin-top:4px;">Tiến độ các bước trước đã được lưu an toàn trong IndexedDB.</div>
            <div class="s2-btn-row">
              <button type="button" class="btn-primary" id="s2-btn-retry-batch">↻ Thử lại lô này</button>
            </div>
          </div>
        `;
        document.getElementById('s2-btn-retry-batch').onclick = () => resumeJobExecution(job);
        return;
      }
    }

    // Bước 3: Đóng gói dữ liệu, hiển thị kết quả và đồng bộ lên GitHub
    updateProgressUI(90, 'Đang tổng hợp kết quả, hiển thị công thức và lưu trữ lên GitHub...', job);
    const finalBundle = buildFinalDataBundleFromJob(job);

    const mountEl = document.getElementById('s2-result-mount');
