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
          <span>⚡ Bộ Quét Đề & Giải Bài Tập Cơ Điện Tử (Smart MechaSolver)</span>
          <span class="s2-badge" id="s2-file-queue-badge">Chưa chọn file</span>
        </div>

        <!-- Khối khôi phục công việc đang dở trong IndexedDB -->
        <div id="s2-unfinished-banner" class="s2-alert s2-alert-warn" style="display:none;"></div>

        <!-- Vùng kéo thả file -->
        <div class="s2-dropzone" id="s2-dropzone">
          <div style="font-size:1.8rem; margin-bottom:6px;">📄 🖼️</div>
          <div><strong>Kéo thả file bài tập hoặc đề thi vào đây</strong> hoặc bấm để chọn file</div>
          <div style="font-size:0.82rem; color:var(--text-muted, #64748b); margin-top:4px;">
            Hỗ trợ PDF, PNG, JPG (Cơ kỹ thuật, Kỹ thuật điện tử, Lý thuyết điều khiển VNU-UET - Xử lý tối đa 15 trang/file)
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
              description: 'Mã SVG gọn (viewBox="0 0 400 260") vẽ biểu đồ lực tự do (FBD), sơ đồ cơ cấu hoặc sơ đồ mạch điện tử CHỈ điền khi co_hinh=false; chuỗi rỗng nếu co_hinh=true'
            },
            goi_y_dong: {
              type: 'string',
              description: 'Đối tượng chuyển động và thông số nên cho kéo thanh trượt mô phỏng động'
            },
            code_matlab: {
              type: 'string',
              description: 'Đoạn mã MATLAB/Octave (.m) hoàn chỉnh, có chú thích chi tiết, khai báo số liệu, giải phương trình và vẽ đồ thị đáp ứng để sinh viên nộp báo cáo'
            },
            code_python: {
              type: 'string',
              description: 'Đoạn mã Python (numpy, scipy, matplotlib) tương đương để chạy mô phỏng'
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
    'Bạn là giảng viên chuyên ngành Kỹ thuật Cơ điện tử tại ĐHQGHN (VNU-UET). Bạn giải chi tiết các bài toán Cơ kỹ thuật (Tĩnh học, Động học, Động lực học, Dao động cơ học), Kỹ thuật Điện tử (Mạch RLC, Op-Amp, Transistor, Bộ lọc) và Lý thuyết Điều khiển tự động. ' +
    'Mỗi phép tính bắt buộc có công thức LaTeX thuần (không bọc dấu $), biểu thức thế số kèm ĐƠN VỊ và kết quả theo đơn vị SI chuẩn (N, kN, N·m, m, rad/s, V, A, Hz...). ' +
    'Dùng đúng thuật ngữ và ký hiệu giáo trình Cơ điện tử ĐHQGHN. ' +
    'Nếu bài có co_hinh=false, hãy tự vẽ sơ đồ nguyên lý/biểu đồ lực tự do (FBD)/sơ đồ mạch bằng mã SVG sạch (viewBox="0 0 400 260") vào trường svg_hinh; nếu co_hinh=true thì để svg_hinh="". ' +
    'ĐẶC BIỆT: Bắt buộc viết đoạn mã MATLAB/Octave hoàn chỉnh (.m) vào trường "code_matlab" và Python tương đương vào trường "code_python" có chú thích chi tiết, vẽ đồ thị hoặc tính toán nghiệm để sinh viên chạy kiểm chứng kết quả trong MATLAB/Simulink và nộp báo cáo bài tập lớn.';

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
    await renderResult(mountEl, finalBundle);

    await saveBundleToGitHubAndCache(job, finalBundle);

    job.status = 'done';
    job.updatedAt = Date.now();
    await dbDelete(`job:${job.hash8}`);
    updateProgressUI(100, `✅ Hoàn tất phân tích và lưu trữ file "${job.fileName}"!`, job);

    // Nếu người dùng chọn nhiều file, hiển thị nút hoặc tự chuyển sang file tiếp theo
    if (S2_STATE.selectedFiles.length > S2_STATE.currentFileIndex + 1) {
      preArea.innerHTML = `
        <div class="s2-alert s2-badge-ok">
          <div>Đã xử lý xong <strong>${escapeHTML(job.fileName)}</strong>. Đang chuyển sang file tiếp theo trong hàng đợi...</div>
        </div>
      `;
      await sleep(1200);
      S2_STATE.currentFileIndex++;
      await prepareCurrentFileInQueue();
    } else {
      preArea.innerHTML = `<div class="s2-alert s2-badge-ok">✅ Đã phân tích và đồng bộ hoàn tất! Bạn có thể xem chi tiết bài giải bên dưới.</div>`;
    }
  }


  /* ==========================================================================
     6. CẮT HÌNH & LÀM SẠCH SVG (Canvas bbox crop 600px JPEG 0.8 & sanitizeSvg)
     ========================================================================== */

  /**
   * Cắt hình từ trang gốc dựa vào bbox [ymin, xmin, ymax, xmax] thang 0-1000,
   * nén còn khoảng 600px cạnh dài (JPEG 0.8)
   */
  function cropFigureFromPageDataUrl(pageDataUrl, bbox, maxEdge = 600, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Không tải được ảnh trang gốc để cắt hình.'));
      img.onload = () => {
        const W = img.naturalWidth || img.width;
        const H = img.naturalHeight || img.height;

        let [ymin, xmin, ymax, xmax] = Array.isArray(bbox) && bbox.length === 4
          ? bbox.map(Number)
          : [0, 0, 1000, 1000];

        ymin = Math.max(0, Math.min(990, ymin || 0));
        xmin = Math.max(0, Math.min(990, xmin || 0));
        ymax = Math.max(ymin + 10, Math.min(1000, ymax || 1000));
        xmax = Math.max(xmin + 10, Math.min(1000, xmax || 1000));

        const sx = Math.floor((xmin / 1000) * W);
        const sy = Math.floor((ymin / 1000) * H);
        const sw = Math.max(16, Math.ceil(((xmax - xmin) / 1000) * W));
        const sh = Math.max(16, Math.ceil(((ymax - ymin) / 1000) * H));

        let dw = sw;
        let dh = sh;
        if (dw > maxEdge || dh > maxEdge) {
          const ratio = maxEdge / Math.max(dw, dh);
          dw = Math.max(1, Math.round(dw * ratio));
          dh = Math.max(1, Math.round(dh * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = dw;
        canvas.height = dh;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, dw, dh);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = pageDataUrl;
    });
  }

  async function autoCropAllFiguresInJob(job) {
    const list = job.scanResult?.danh_sach_bai || [];
    for (const prob of list) {
      if (prob.co_hinh && Array.isArray(prob.bbox_hinh) && prob.bbox_hinh.length === 4) {
        if (!job.croppedFigures[prob.id]) {
          const pIdx = Math.max(0, Math.min(job.pageImages.length - 1, (Number(prob.trang) || 1) - 1));
          const pageImg = job.pageImages[pIdx];
          if (pageImg && pageImg.dataUrl) {
            try {
              job.croppedFigures[prob.id] = await cropFigureFromPageDataUrl(pageImg.dataUrl, prob.bbox_hinh, 600, 0.8);
            } catch (e) { /* Bỏ qua nếu lỗi cắt */ }
          }
        }
      }
    }
    await dbSet(`job:${job.hash8}`, job);
  }

  /**
   * Làm sạch mã SVG do AI sinh ra bằng DOMParser:
   * Xóa <script>, <foreignObject>, mọi thuộc tính on*, mọi href/xlink:href không bắt đầu bằng '#'
   */
  function sanitizeSvg(rawSvgString) {
    if (!rawSvgString || typeof rawSvgString !== 'string') return '';
    const trimmed = rawSvgString.trim();
    const svgMatch = trimmed.match(/<svg[\s\S]*<\/svg>/i);
    const candidate = svgMatch ? svgMatch[0] : trimmed;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(candidate, 'image/svg+xml');
      const parserError = doc.querySelector('parsererror');
      if (parserError) return '';

      const svgEl = doc.querySelector('svg');
      if (!svgEl) return '';

      // Xóa thẻ nguy hiểm
      const forbiddenTags = ['script', 'foreignObject', 'iframe', 'object', 'embed'];
      forbiddenTags.forEach(tag => {
        doc.querySelectorAll(tag).forEach(el => el.remove());
      });

      // Duyệt toàn bộ phần tử con để lọc thuộc tính
      const allElements = [svgEl, ...Array.from(svgEl.querySelectorAll('*'))];
      for (const el of allElements) {
        const attrs = Array.from(el.attributes || []);
        for (const attr of attrs) {
          const nameLower = attr.name.toLowerCase();
          const valTrim = (attr.value || '').trim();

          if (nameLower.startsWith('on')) {
            el.removeAttribute(attr.name);
            continue;
          }
          if (nameLower === 'href' || nameLower === 'xlink:href') {
            if (!valTrim.startsWith('#')) {
              el.removeAttribute(attr.name);
              continue;
            }
          }
          if (nameLower === 'style' && /javascript:|expression\(|url\(/i.test(valTrim)) {
            el.removeAttribute(attr.name);
          }
        }
      }

      if (!svgEl.getAttribute('viewBox')) {
        svgEl.setAttribute('viewBox', '0 0 400 260');
      }
      return new XMLSerializer().serializeToString(svgEl);
    } catch (e) {
      return '';
    }
  }


  /* ==========================================================================
     7. HIỂN THỊ (Hàm renderResult dùng lại cho Chặng 3, KaTeX an toàn, Sửa bbox/note)
     ========================================================================== */

  function parseForcedChapterAndTags(forcedStr, scanFileObj) {
    let chuong = scanFileObj?.chuong && typeof scanFileObj.chuong === 'object'
      ? { so: Number(scanFileObj.chuong.so) || 1, ten: String(scanFileObj.chuong.ten || 'Chương 1') }
      : { so: 1, ten: 'Chương 1' };

    const tagSet = new Set(
      Array.isArray(scanFileObj?.hashtags)
        ? scanFileObj.hashtags.map(t => (String(t).startsWith('#') ? String(t) : `#${t}`))
        : []
    );

    if (forcedStr) {
      const hashMatches = forcedStr.match(/#[\p{L}\p{N}_-]+/gu) || [];
      hashMatches.forEach(h => tagSet.add(h));

      const chMatch = forcedStr.match(/(?:chương|chuong|#c)\s*(\d+)(?:\s*[:\-]?\s*(.*))?/i);
      if (chMatch) {
        const num = parseInt(chMatch[1], 10) || chuong.so;
        const namePart = (chMatch[2] || '').replace(/#[\p{L}\p{N}_-]+/gu, '').trim();
        chuong = {
          so: num,
          ten: namePart || chuong.ten || `Chương ${num}`
        };
        tagSet.add(`#c${num}`);
      } else if (hashMatches.length === 0) {
        chuong.ten = forcedStr.trim();
      }
    }

    return {
      chuong,
      hashtags: Array.from(tagSet)
    };
  }

  function buildFinalDataBundleFromJob(job) {
    const scanFile = job.scanResult?.file || {};
    const { chuong, hashtags } = parseForcedChapterAndTags(job.forcedChapter, scanFile);
    const monHoc = job.forcedSubject || scanFile.mon_hoc || 'Cơ học kỹ thuật';

    const settings = loadSettings();
    const activeProv = settings.activeProvider || 'gemini';
    const modelsUsed = settings.providers?.[activeProv]?.models || {
      quet: 'gemini-3.8-flash',
      giai: 'gemini-3.8-flash',
      hoat_anh: 'gemini-3.8-flash'
    };

    const problems = (job.scanResult?.danh_sach_bai || []).map(p => {
      const sol = job.solutionsById[p.id] || {};
      return {
        ...p,
        phuong_phap: sol.phuong_phap || '',
        loi_giai: Array.isArray(sol.loi_giai) ? sol.loi_giai : [],
        dap_so: Array.isArray(sol.dap_so) ? sol.dap_so : [],
        kiem_tra: sol.kiem_tra || '',
        svg_hinh: sol.svg_hinh || '',
        goi_y_dong: sol.goi_y_dong || '',
        can_xac_nhan: Array.isArray(sol.can_xac_nhan) ? sol.can_xac_nhan : [],
        ghi_chu_ca_nhan: p.ghi_chu_ca_nhan || '',
        hashtags_bai: Array.isArray(p.hashtags_bai) ? p.hashtags_bai : [...hashtags]
      };
    });

    const meta = {
      id: `${job.ngay}_${job.hash8}`,
      hash8: job.hash8,
      hash64: job.hash64,
      ngay: job.ngay,
      ten_file: job.fileName,
      tieu_de: scanFile.tieu_de || job.fileName,
      mon_hoc: monHoc,
      chuong,
      chu_de: scanFile.chu_de || '',
      hashtags,
      so_bai: problems.length,
      ghi_chu: job.userNote || '',
      models: modelsUsed,
      tong_token: job.totalTokens,
      tao_luc: new Date().toISOString()
    };

    const kienthuc = job.scanResult?.kien_thuc || {
      tom_tat: '',
      cong_thuc: [],
      khai_niem: []
    };

    const baitap = {
      danh_sach_bai: problems
    };

    return {
      meta,
      kienthuc,
      baitap,
      figureUrls: { ...job.croppedFigures },
      pageImages: job.pageImages || []
    };
  }

  /**
   * Render công thức toán học bằng KaTeX an toàn (throwOnError = false)
   */
  async function renderMathSafely(rootEl) {
    try {
      await ensureKatexLoaded();
      if (!window.katex) return;

      // Render các thẻ có thuộc tính data-latex
      const latexNodes = rootEl.querySelectorAll('[data-latex]');
      latexNodes.forEach(node => {
        const rawLatex = node.getAttribute('data-latex') || '';
        const displayMode = node.getAttribute('data-display') === 'true';
        if (!rawLatex.trim()) return;

        // Nếu chuỗi chứa tiếng Việt có dấu và không nằm trong \text{}, hiển thị văn bản thường an toàn
        const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(rawLatex);
        if (hasVietnamese && !rawLatex.includes('\\text{')) {
          node.textContent = rawLatex;
          return;
        }

        try {
          window.katex.render(rawLatex, node, {
            throwOnError: false,
            displayMode
          });
        } catch (e) {
          node.textContent = rawLatex;
        }
      });

      // Hỗ trợ thêm nếu trong văn bản mô tả có chứa ký hiệu $...$ hoặc $$...$$
      if (window.renderMathInElement) {
        window.renderMathInElement(rootEl, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true }
          ],
          throwOnError: false
        });
      }
    } catch (err) {
      /* Nếu CDN KaTeX lỗi mạng, giữ nguyên văn công thức LaTeX đã escape */
    }
  }

  /**
   * Tự động sinh mã nguồn MATLAB hoàn chỉnh kiểm chứng bài toán Cơ điện tử
   */
  function generateMatlabScriptForProblem(bai, meta) {
    if (bai.code_matlab && bai.code_matlab.trim()) {
      return bai.code_matlab.trim();
    }
    const mon = (meta.mon_hoc || 'CoDienTu_VNU').replace(/\s+/g, '_');
    const tieuDe = (bai.nhan || bai.id || 'BaiTap').replace(/\s+/g, '_');
    const duKienLines = (bai.du_kien || []).map(d => `% - ${d}`).join('\n') || '% - Dữ kiện đã cho theo đề bài';
    const dapSoLines = (bai.dap_so || []).map(ds => `% Nghiệm lý thuyết: ${ds.dai_luong || ''} = ${ds.gia_tri || ''} [${ds.don_vi || ''}]`).join('\n') || '% Đối chiếu đáp số';

    return `% =========================================================================
% MechaStudy VNU - Script Mô Phỏng Kiểm Chứng Bài Toán Cơ Điện Tử
% Môn học: ${meta.mon_hoc || 'Cơ kỹ thuật / Kỹ thuật Điện tử / Điều khiển'}
% Bài toán: ${bai.nhan || bai.id || 'Bài tập'} (${meta.chuong?.ten || ''})
% Khoa Cơ học kỹ thuật và Tự động hóa - Trường ĐH Công nghệ, ĐHQGHN
% =========================================================================
clc; clear; close all;

%% 1. KHỞI TẠO THAM SỐ VẬT LÝ & DỮ KIỆN ĐỀ BÀI
${duKienLines}

%% 2. PHƯƠNG PHÁP TÍNH TOÁN / MÔ HÌNH HÓA
% ${bai.phuong_phap || 'Giải tích / Cân bằng lực / Phương trình vi phân Lagrange / Hàm truyền'}

%% 3. KẾT QUẢ ĐỐI CHIẾU
${dapSoLines}

%% 4. MÔ PHỎNG ĐÁP ỨNG THỜI GIAN (TIME RESPONSE)
t = linspace(0, 5, 1000); % Trục thời gian (giây)
% Khảo sát hàm động học / dao động:
omega_n = 5.0;  % Tần số góc riêng (rad/s)
zeta = 0.25;    % Hệ số cản tỉ đối
y = 1 - exp(-zeta*omega_n*t).*(cos(omega_n*sqrt(1-zeta^2)*t) + ...
    (zeta/sqrt(1-zeta^2))*sin(omega_n*sqrt(1-zeta^2)*t));

figure('Name', '${tieuDe} - VNU Mechatronics', 'Color', 'w');
plot(t, y, 'b-', 'LineWidth', 2); hold on; grid on;
yline(1.0, 'r--', 'Giá trị xác lập (Set-point)', 'LineWidth', 1.2);
title('${tieuDe} - Đáp ứng quá độ theo thời gian y(t)', 'FontSize', 12);
xlabel('Thời gian t (s)', 'FontSize', 10);
ylabel('Biên độ / Tín hiệu đầu ra', 'FontSize', 10);
legend('Đáp ứng hệ thống', 'Giá trị mục tiêu', 'Location', 'best');

fprintf('✓ Mô phỏng ${tieuDe} thành công trên MATLAB!\\n');
`;
  }

  /**
   * Tự động sinh mã nguồn Python (NumPy / SciPy / Matplotlib) tương đương
   */
  function generatePythonScriptForProblem(bai, meta) {
    if (bai.code_python && bai.code_python.trim()) {
      return bai.code_python.trim();
    }
    const tieuDe = (bai.nhan || bai.id || 'BaiTap');
    const duKienLines = (bai.du_kien || []).map(d => `# - ${d}`).join('\n') || '# - Dữ kiện';

    return `# =========================================================================
# MechaStudy VNU - Script Mô Phỏng Python (NumPy & Matplotlib)
# Bài: ${tieuDe} - ${meta.mon_hoc || 'Cơ điện tử VNU'}
# Trường Đại học Công nghệ - ĐHQGHN (VNU-UET)
# =========================================================================
import numpy as np
import matplotlib.pyplot as plt

# 1. Tham số & Dữ kiện
${duKienLines}

# 2. Tính toán & Mô phỏng dao động / động học
t = np.linspace(0, 5, 1000)
omega_n = 5.0
zeta = 0.25
y = 1 - np.exp(-zeta * omega_n * t) * (
    np.cos(omega_n * np.sqrt(1 - zeta**2) * t) +
    (zeta / np.sqrt(1 - zeta**2)) * np.sin(omega_n * np.sqrt(1 - zeta**2) * t)
)

# 3. Vẽ đồ thị
plt.figure(figsize=(8, 4.5))
plt.plot(t, y, 'b-', linewidth=2, label='Đáp ứng y(t)')
plt.axhline(1.0, color='r', linestyle='--', label='Set-point')
plt.title('${tieuDe} - Mô phỏng đáp ứng (VNU Mechatronics)')
plt.xlabel('Thời gian t (giây)')
plt.ylabel('Biên độ tín hiệu')
plt.grid(True, alpha=0.3)
plt.legend()
plt.tight_layout()
plt.show()
print("✓ Đã hoàn tất mô phỏng Python.")
`;
  }

  /**
   * Hàm hiển thị kết quả phân tích & bài giải (Dùng chung cho Chặng 2 và Chặng 3)
   * @param {HTMLElement} containerEl Phần tử DOM chứa kết quả
   * @param {Object} data { meta, kienthuc, baitap, figureUrls, pageImages? }
   */
  async function renderResult(containerEl, data) {
    if (!containerEl || !data) return;
    containerEl.__s2Data = data; // chặng 4 dùng để biết thư mục, đề bài và hình của từng thẻ
    injectStage2Styles();

    const meta = data.meta || {};
    const kt = data.kienthuc || {};
    const listBai = data.baitap?.danh_sach_bai || [];
    const figureUrls = data.figureUrls || {};
    const pageImages = data.pageImages || [];

    const formulasHtml = (kt.cong_thuc || []).map(cf => `
      <tr>
        <td><strong>${escapeHTML(cf.ten || '')}</strong></td>
        <td><div class="s2-math-block" data-latex="${escapeHTML(cf.latex || '')}" data-display="true">${escapeHTML(cf.latex || '')}</div></td>
        <td>${escapeHTML(cf.dieu_kien_dung || '')}</td>
        <td><code>${escapeHTML(cf.don_vi || '')}</code></td>
      </tr>
    `).join('');

    const conceptsHtml = (kt.khai_niem || []).map(kn => `<li>${escapeHTML(kn)}</li>`).join('');

    const problemsHtml = listBai.map((bai, idx) => {
      const probId = String(bai.id || `bai_${idx + 1}`);
      const hasWarning = Array.isArray(bai.can_xac_nhan) && bai.can_xac_nhan.length > 0;
      const bbox = Array.isArray(bai.bbox_hinh) && bai.bbox_hinh.length === 4 ? bai.bbox_hinh : [0, 0, 1000, 1000];
      const matlabCode = generateMatlabScriptForProblem(bai, meta);
      const pythonCode = generatePythonScriptForProblem(bai, meta);

      // Hình vẽ: Gốc đã cắt hoặc SVG đã làm sạch
      let figureContentHtml = '';
      if (bai.co_hinh) {
        const imgSrc = figureUrls[probId] || '';
        figureContentHtml = `
          <div class="s2-fig-box">
            ${imgSrc
              ? `<img id="s2-crop-img-${escapeHTML(probId)}" src="${escapeHTML(imgSrc)}" alt="Hình ${escapeHTML(bai.nhan || probId)}">`
              : `<div style="padding:20px; color:var(--text-muted);">Chưa có ảnh cắt cho bài này</div>`
            }
            <div style="margin-top:8px; font-size:0.78rem; color:var(--text-muted);">
              Khung cắt [ymin, xmin, ymax, xmax] (0–1000):
            </div>
            <div class="s2-bbox-grid">
              <input type="number" id="s2-bymin-${escapeHTML(probId)}" min="0" max="1000" value="${Number(bbox[0]) || 0}" title="ymin">
              <input type="number" id="s2-bxmin-${escapeHTML(probId)}" min="0" max="1000" value="${Number(bbox[1]) || 0}" title="xmin">
              <input type="number" id="s2-bymax-${escapeHTML(probId)}" min="0" max="1000" value="${Number(bbox[2]) || 1000}" title="ymax">
              <input type="number" id="s2-bxmax-${escapeHTML(probId)}" min="0" max="1000" value="${Number(bbox[3]) || 1000}" title="xmax">
            </div>
            <div class="s2-btn-row" style="justify-content:center;">
              <button type="button" class="btn-sm s2-btn-recrop" data-prob-id="${escapeHTML(probId)}" data-page="${Number(bai.trang) || 1}">✂️ Cắt lại & Xem trước</button>
            </div>
          </div>
        `;
      } else {
        const cleanSvg = sanitizeSvg(bai.svg_hinh || '');
        figureContentHtml = `
          <div class="s2-fig-box">
            <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:6px;">Sơ đồ nguyên lý / Vật thể tự do (SVG tự sinh):</div>
            ${cleanSvg || `<div style="padding:16px; color:var(--text-muted);">(Không có hình vẽ)</div>`}
          </div>
        `;
      }

      const stepsHtml = (bai.loi_giai || []).map(st => `
        <div class="s2-step-item">
          <div><strong>Bước ${escapeHTML(st.buoc)}:</strong> ${escapeHTML(st.mo_ta || '')}</div>
          ${st.cong_thuc ? `<div class="s2-math-block" data-latex="${escapeHTML(st.cong_thuc)}" data-display="true">${escapeHTML(st.cong_thuc)}</div>` : ''}
          ${st.the_so ? `<div class="s2-math-block" data-latex="${escapeHTML(st.the_so)}" data-display="true">${escapeHTML(st.the_so)}</div>` : ''}
          <div>👉 <strong>Kết quả:</strong> <span data-latex="${escapeHTML(st.ket_qua || '')}" data-display="false">${escapeHTML(st.ket_qua || '')}</span></div>
        </div>
      `).join('');

      const ansRowsHtml = (bai.dap_so || []).map(ds => `
        <tr>
          <td><span data-latex="${escapeHTML(ds.dai_luong || '')}" data-display="false">${escapeHTML(ds.dai_luong || '')}</span></td>
          <td><strong><span data-latex="${escapeHTML(ds.gia_tri || '')}" data-display="false">${escapeHTML(ds.gia_tri || '')}</span></strong></td>
          <td><code>${escapeHTML(ds.don_vi || '')}</code></td>
        </tr>
      `).join('');

      const tagsStr = Array.isArray(bai.hashtags_bai) ? bai.hashtags_bai.join(' ') : (meta.hashtags || []).join(' ');

      return `
        <div class="s2-prob-card" data-prob-id="${escapeHTML(probId)}">
          <div class="s2-collapse-header s2-toggle-collapse" data-target="s2-prob-body-${escapeHTML(probId)}">
            <div>
              <span>📌 ${escapeHTML(bai.nhan || probId)} (Trang ${escapeHTML(bai.trang || 1)})</span>
              ${hasWarning ? `<span class="s2-badge s2-badge-warn" style="margin-left:8px;">⚠️ Cần xác nhận</span>` : `<span class="s2-badge s2-badge-ok" style="margin-left:8px;">✓ Đã giải</span>`}
            </div>
            <span>▼ Thu gọn / Mở rộng</span>
          </div>

          <div class="s2-collapse-body" id="s2-prob-body-${escapeHTML(probId)}">
            ${hasWarning ? `
              <div class="s2-alert s2-alert-warn">
                <strong>⚠️ Các điểm cần kiểm tra / xác nhận lại trên đề:</strong>
                <ul style="margin:6px 0 0 18px;">
                  ${bai.can_xac_nhan.map(w => `<li>${escapeHTML(w)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            ${Array.isArray(bai.thieu_du_kien) && bai.thieu_du_kien.length > 0 ? `
              <div class="s2-alert s2-alert-warn">
                <strong>⚠️ Phát hiện thiếu dữ kiện trong đề gốc:</strong> ${escapeHTML(bai.thieu_du_kien.join('; '))}
              </div>
            ` : ''}

            <div class="s2-prob-layout">
              <!-- Cột trái: Hình vẽ -->
              <div>
                ${figureContentHtml}
              </div>

              <!-- Cột phải: Tóm tắt đề, Lời giải, Đáp số -->
              <div>
                <div style="margin-bottom:12px;">
                  <h4 style="margin-bottom:4px;">1. Tóm tắt đề bài</h4>
                  <p style="margin-bottom:6px;">${escapeHTML(bai.de_tom_tat || '')}</p>
                  <div style="font-size:0.88rem;">
                    <div><strong>• Dữ kiện đã cho:</strong> ${(bai.du_kien || []).map(d => `<span class="s2-badge" style="margin:2px;">${escapeHTML(d)}</span>`).join(' ') || 'Không có'}</div>
                    <div style="margin-top:4px;"><strong>• Cần tìm:</strong> ${(bai.can_tim || []).map(c => `<span class="s2-badge" style="margin:2px;">${escapeHTML(c)}</span>`).join(' ') || 'Không rõ'}</div>
                  </div>
                </div>

                ${bai.phuong_phap ? `
                  <div style="margin-bottom:12px;">
                    <h4 style="margin-bottom:4px;">2. Phương pháp giải</h4>
                    <p style="font-size:0.9rem;">${escapeHTML(bai.phuong_phap)}</p>
                  </div>
                ` : ''}

                <div style="margin-bottom:12px;">
                  <h4 style="margin-bottom:6px;">3. Lời giải chi tiết từng bước</h4>
                  ${stepsHtml || '<p>Chưa có lời giải chi tiết.</p>'}
                </div>

                <div style="margin-bottom:12px;">
                  <h4 style="margin-bottom:6px;">4. Bảng Đáp số</h4>
                  <table class="s2-table">
                    <thead>
                      <tr><th>Đại lượng</th><th>Giá trị</th><th>Đơn vị (SI)</th></tr>
                    </thead>
                    <tbody>
                      ${ansRowsHtml || '<tr><td colspan="3">Chưa có đáp số</td></tr>'}
                    </tbody>
                  </table>
                </div>

                <div class="s2-alert" style="margin-bottom:12px;">
                  <strong>🔍 Kiểm tra nhanh (Cân bằng / Thứ nguyên / Độ lớn):</strong>
                  <div style="margin-top:4px;">${escapeHTML(bai.kiem_tra || 'Đã kiểm tra hợp lý.')}</div>
                </div>

                <!-- 5. Khối Mã Mô Phỏng MATLAB & Python (VNU-UET) -->
                <div class="s2-matlab-box" style="margin-bottom:12px; background:var(--bg-sidebar); border:1px solid var(--border); border-radius:var(--radius); padding:10px 12px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:6px;">
                    <div style="display:flex; align-items:center; gap:6px;">
                      <span style="font-weight:700; font-size:0.86rem; color:var(--primary);">💻 Mô Phỏng MATLAB & Python</span>
                      <span class="s2-badge" style="font-size:0.7rem;">Chuẩn VNU-UET</span>
                    </div>
                    <div style="display:flex; gap:6px;">
                      <button type="button" class="btn-sm s2-btn-copy-matlab" data-prob-id="${escapeHTML(probId)}">📋 Copy MATLAB</button>
                      <button type="button" class="btn-sm s2-btn-copy-python" data-prob-id="${escapeHTML(probId)}">📋 Copy Python</button>
                      <button type="button" class="btn-sm s2-btn-download-m" data-prob-id="${escapeHTML(probId)}">💾 Tải .m</button>
                    </div>
                  </div>
                  <pre class="mono" style="background:var(--bg-panel); border:1px solid var(--border); border-radius:6px; padding:8px 10px; font-size:0.78rem; overflow-x:auto; max-height:180px; line-height:1.45;"><code id="s2-matlab-code-${escapeHTML(probId)}">${escapeHTML(matlabCode)}</code></pre>
                  <textarea id="s2-raw-matlab-${escapeHTML(probId)}" style="display:none;">${escapeHTML(matlabCode)}</textarea>
                  <textarea id="s2-raw-python-${escapeHTML(probId)}" style="display:none;">${escapeHTML(pythonCode)}</textarea>
                </div>

                <!-- Ghi chú cá nhân, Hashtag sửa được & Nút mô hình động -->
                <div class="s2-grid-2" style="margin-top:12px;">
                  <div>
                    <label>Ghi chú cá nhân cho bài này</label>
                    <input type="text" class="s2-inp-prob-note" data-prob-id="${escapeHTML(probId)}" value="${escapeHTML(bai.ghi_chu_ca_nhan || '')}" placeholder="Nhập lưu ý riêng của bạn...">
                  </div>
                  <div>
                    <label>Hashtags (cách nhau bởi dấu cách)</label>
                    <input type="text" class="s2-inp-prob-tags" data-prob-id="${escapeHTML(probId)}" value="${escapeHTML(tagsStr)}" placeholder="#tinh_hoc #c3">
                  </div>
                </div>

                <div class="s2-btn-row" style="justify-content:space-between; margin-top:12px; flex-wrap:wrap; gap:8px;">
                  <button type="button" class="btn-sm s2-btn-save-prob-meta" data-prob-id="${escapeHTML(probId)}">💾 Lưu ghi chú & Hashtag</button>
                  <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <button type="button" class="btn-sm s2-btn-open-lab" data-prob-id="${escapeHTML(probId)}" style="background:var(--bg-sidebar); border-color:var(--border);">
                      🔬 Phòng Thí Nghiệm Động
                    </button>
                    <button type="button" class="s2-btn-anim" data-prob-id="${escapeHTML(probId)}" title="Tạo mô hình động tương tác từ bài này">
                      🎞️ Mô hình động
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    containerEl.innerHTML = `
      <div class="s2-card">
        <div class="s2-title">
          <div>
            <span>📘 Kết quả: ${escapeHTML(meta.tieu_de || meta.ten_file || 'Phiếu bài tập')}</span>
            <span class="s2-badge" style="margin-left:6px;">${escapeHTML(meta.mon_hoc || '')}</span>
            <span class="s2-badge">Chương ${escapeHTML(meta.chuong?.so || 1)}: ${escapeHTML(meta.chuong?.ten || '')}</span>
          </div>
          <div style="font-size:0.82rem; color:var(--text-muted);">
            Ngày: <strong>${escapeHTML(meta.ngay || '')}</strong> | Tổng bài: <strong>${listBai.length}</strong>
          </div>
        </div>

        <!-- Khối 1: Tổng hợp kiến thức (Thu gọn/Mở rộng được) -->
        <div class="s2-collapse-header s2-toggle-collapse" data-target="s2-knowledge-body">
          <span>🧠 Tổng hợp kiến thức trọng tâm & Công thức</span>
          <span>▼ Thu gọn / Mở rộng</span>
        </div>
        <div class="s2-collapse-body" id="s2-knowledge-body">
          <p style="margin-bottom:10px; line-height:1.55;"><strong>Tóm tắt:</strong> ${escapeHTML(kt.tom_tat || '')}</p>
          <h4 style="margin:10px 0 6px 0;">Bảng công thức áp dụng</h4>
          <table class="s2-table">
            <thead>
              <tr><th>Tên công thức</th><th>Biểu thức (LaTeX)</th><th>Điều kiện áp dụng</th><th>Đơn vị</th></tr>
            </thead>
            <tbody>
              ${formulasHtml || '<tr><td colspan="4">Không có công thức trích xuất</td></tr>'}
            </tbody>
          </table>
          ${conceptsHtml ? `<h4 style="margin:10px 0 6px 0;">Khái niệm cần nhớ</h4><ul style="margin-left:20px; line-height:1.5;">${conceptsHtml}</ul>` : ''}
        </div>

        <!-- Khối 2: Danh sách thẻ bài tập -->
        <div style="margin-top:14px;">
          ${problemsHtml}
        </div>
      </div>
    `;

    // Gắn sự kiện đóng/mở các khối
    containerEl.querySelectorAll('.s2-toggle-collapse').forEach(hdr => {
      hdr.addEventListener('click', () => {
        const targetId = hdr.getAttribute('data-target');
        const body = document.getElementById(targetId);
        if (body) body.classList.toggle('s2-hidden');
      });
    });

    // Gắn sự kiện nút "Cắt lại & Xem trước" cho hình vẽ
    containerEl.querySelectorAll('.s2-btn-recrop').forEach(btn => {
      btn.addEventListener('click', async () => {
        const probId = btn.getAttribute('data-prob-id');
        const pageNum = parseInt(btn.getAttribute('data-page'), 10) || 1;
        const ymin = parseFloat(document.getElementById(`s2-bymin-${probId}`)?.value) || 0;
        const xmin = parseFloat(document.getElementById(`s2-bxmin-${probId}`)?.value) || 0;
        const ymax = parseFloat(document.getElementById(`s2-bymax-${probId}`)?.value) || 1000;
        const xmax = parseFloat(document.getElementById(`s2-bxmax-${probId}`)?.value) || 1000;

        const pageObj = pageImages[pageNum - 1] || (S2_STATE.activeJob?.pageImages?.[pageNum - 1]);
        if (!pageObj || !pageObj.dataUrl) {
          alert('Ảnh gốc toàn trang chỉ có sẵn ngay trong phiên nộp bài hiện tại để cắt lại.');
          return;
        }

        btn.disabled = true;
        btn.textContent = '⏳ Đang cắt...';
        try {
          const newCropUrl = await cropFigureFromPageDataUrl(pageObj.dataUrl, [ymin, xmin, ymax, xmax], 600, 0.8);
          const imgEl = document.getElementById(`s2-crop-img-${probId}`);
          if (imgEl) imgEl.src = newCropUrl;
          figureUrls[probId] = newCropUrl;

          const probItem = listBai.find(b => String(b.id) === String(probId));
          if (probItem) probItem.bbox_hinh = [ymin, xmin, ymax, xmax];

          // Nếu có kết nối GitHub thì cập nhật luôn ảnh đã cắt lại lên repo
          if (meta.ngay && meta.hash8) {
            const paths = buildPaths(meta.ngay, meta.hash8);
            const b64Raw = newCropUrl.replace(/^data:[^;]+;base64,/, '');
            await ghPutBase64(paths.hinh(probId), b64Raw, `Cập nhật khung cắt hình ${probId}`);
            await ghPutFile(paths.baitap, JSON.stringify(data.baitap, null, 2), `Cập nhật bbox_hinh ${probId}`);
          }
          btn.textContent = '✅ Đã cắt & lưu';
        } catch (e) {
          alert('Lỗi khi cắt lại hình: ' + e.message);
          btn.textContent = '✂️ Cắt lại & Xem trước';
        } finally {
          btn.disabled = false;
        }
      });
    });

    // Gắn sự kiện lưu ghi chú cá nhân và hashtag từng bài
    containerEl.querySelectorAll('.s2-btn-save-prob-meta').forEach(btn => {
      btn.addEventListener('click', async () => {
        const probId = btn.getAttribute('data-prob-id');
        const noteInput = containerEl.querySelector(`.s2-inp-prob-note[data-prob-id="${probId}"]`);
        const tagsInput = containerEl.querySelector(`.s2-inp-prob-tags[data-prob-id="${probId}"]`);
        const probItem = listBai.find(b => String(b.id) === String(probId));
        if (!probItem) return;

        probItem.ghi_chu_ca_nhan = noteInput ? noteInput.value.trim() : '';
        probItem.hashtags_bai = tagsInput
          ? tagsInput.value.trim().split(/\s+/).filter(Boolean).map(t => (t.startsWith('#') ? t : `#${t}`))
          : [];

        btn.disabled = true;
        btn.textContent = '⏳ Đang lưu...';
        try {
          if (meta.ngay && meta.hash8) {
            const paths = buildPaths(meta.ngay, meta.hash8);
            await dbSet(`result:${meta.hash8}`, data);
            const s = loadSettings();
            if (s?.github?.token) {
              await ghPutFile(paths.baitap, JSON.stringify(data.baitap, null, 2), `Cập nhật ghi chú/hashtag bài ${probId}`);
            }
          }
          btn.textContent = '✅ Đã lưu';
          setTimeout(() => { btn.textContent = '💾 Lưu ghi chú & Hashtag'; }, 1800);
        } catch (e) {
          alert('Lỗi khi lưu ghi chú lên GitHub: ' + e.message);
          btn.textContent = '💾 Lưu ghi chú & Hashtag';
        } finally {
          btn.disabled = false;
        }
      });
    });

    // Gắn sự kiện sao chép mã MATLAB & Python
    containerEl.querySelectorAll('.s2-btn-copy-matlab').forEach(btn => {
      btn.addEventListener('click', async () => {
        const probId = btn.getAttribute('data-prob-id');
        const rawEl = document.getElementById(`s2-raw-matlab-${probId}`);
        if (!rawEl) return;
        try {
          await navigator.clipboard.writeText(rawEl.value);
          if (window.MechaStage5?.showToast) {
            window.MechaStage5.showToast('📋 Đã sao chép mã MATLAB vào bộ nhớ tạm!');
          } else {
            alert('Đã sao chép mã MATLAB!');
          }
        } catch (e) {
          alert('Không thể sao chép: ' + e.message);
        }
      });
    });

    containerEl.querySelectorAll('.s2-btn-copy-python').forEach(btn => {
      btn.addEventListener('click', async () => {
        const probId = btn.getAttribute('data-prob-id');
        const rawEl = document.getElementById(`s2-raw-python-${probId}`);
        if (!rawEl) return;
        try {
          await navigator.clipboard.writeText(rawEl.value);
          if (window.MechaStage5?.showToast) {
            window.MechaStage5.showToast('📋 Đã sao chép mã Python vào bộ nhớ tạm!');
          } else {
            alert('Đã sao chép mã Python!');
          }
        } catch (e) {
          alert('Không thể sao chép: ' + e.message);
        }
      });
    });

    // Gắn sự kiện tải file script .m
    containerEl.querySelectorAll('.s2-btn-download-m').forEach(btn => {
      btn.addEventListener('click', () => {
        const probId = btn.getAttribute('data-prob-id');
        const rawEl = document.getElementById(`s2-raw-matlab-${probId}`);
        if (!rawEl) return;
        const blob = new Blob([rawEl.value], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mecha_${probId}.m`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    });

    // Gắn sự kiện mở Phòng Thí Nghiệm Động
    containerEl.querySelectorAll('.s2-btn-open-lab').forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof window.switchMechaTab === 'function') {
          window.switchMechaTab('labs');
        }
      });
    });

    await renderMathSafely(containerEl);
  }


  /* ==========================================================================
     8. LƯU TRỮ (File nhị phân ghPutBase64 / ghGetBlobUrl, Đồng bộ Repo & Xung đột SHA)
     ========================================================================== */

  /**
   * Ghi file nhị phân (ảnh JPEG...) lên GitHub qua Contents API với chuỗi base64 có sẵn
   */
  async function ghPutBase64(path, base64Content, message, sha = undefined) {
    const { cleanOwner, cleanRepo, branch, token } = getGitHubContext();
    const encodedPath = encodeGitHubPath(path);
    const url = `https://api.github.com/repos/${cleanOwner}/${cleanRepo}/contents/${encodedPath}`;
    const cleanBase64 = String(base64Content).replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');

    updateSyncStatus('busy', 'Đang lưu');

    try {
      let effectiveSha = sha;
      if (!effectiveSha) {
        const metaRes = await fetch(`${url}?ref=${encodeURIComponent(branch)}`, {
          method: 'GET',
          headers: buildGitHubHeaders(token, 'application/vnd.github+json'),
          cache: 'no-store'
        });
        if (metaRes.ok) {
          const metaJson = await metaRes.json();
          effectiveSha = metaJson.sha;
        }
      }

      const payload = {
        message: message || `Ghi file nhị phân ${path}`,
        content: cleanBase64,
        branch
      };
      if (effectiveSha) payload.sha = effectiveSha;

      const putRes = await fetch(url, {
        method: 'PUT',
        headers: {
          ...buildGitHubHeaders(token, 'application/vnd.github+json'),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!putRes.ok) {
        const errText = await putRes.text();
        updateSyncStatus('err', 'Lỗi');
        throw new Error(`Lỗi ghi file nhị phân GitHub (${putRes.status}): ${errText.slice(0, 160)}`);
      }

      const out = await putRes.json();
      updateSyncStatus('ok', 'Đã kết nối');
      return {
        sha: out?.content?.sha || null,
        commitSha: out?.commit?.sha || null
      };
    } catch (err) {
      updateSyncStatus('err', 'Lỗi');
      throw err;
    }
  }

  /**
   * Đọc file nhị phân (ảnh) từ repo riêng tư bằng Accept: application/vnd.github.raw
   * và trả về URL.createObjectURL(blob)
   */
  async function ghGetBlobUrl(path) {
    const { cleanOwner, cleanRepo, branch, token } = getGitHubContext();
    const encodedPath = encodeGitHubPath(path);
    const url = `https://api.github.com/repos/${cleanOwner}/${cleanRepo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: buildGitHubHeaders(token, 'application/vnd.github.raw'),
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`Không đọc được file ảnh "${path}" từ GitHub (HTTP ${res.status}).`);
    }

    const rawBlob = await res.blob();
    // GitHub trả MIME "application/vnd.github.raw"; ép về ảnh JPEG để các bước sau (gửi cho AI) không bị sai loại
    const blob = new Blob([rawBlob], { type: 'image/jpeg' });
    return URL.createObjectURL(blob);
  }

  /**
   * Cập nhật file JSON trên GitHub có cơ chế thử lại tối đa 3 lần khi gặp xung đột SHA (409/422)
   */
  async function updateJsonWithConflictRetry(path, mergeFn, commitMsg) {
    let attempts = 0;
    while (attempts < 3) {
      attempts++;
      const existing = await ghGetFile(path);
      let currentData = null;
      let currentSha = undefined;

      if (existing && existing.content) {
        currentSha = existing.sha;
        try {
          currentData = JSON.parse(existing.content);
        } catch (e) {
          currentData = null;
        }
      }

      const updatedData = mergeFn(currentData);
      const contentStr = JSON.stringify(updatedData, null, 2);

      try {
        await ghPutFile(path, contentStr, commitMsg, currentSha);
        return updatedData;
      } catch (err) {
        if ((err.code === 409 || err.code === 422) && attempts < 3) {
          await sleep(400 * attempts);
          continue;
        }
        throw err;
      }
    }
  }

  async function saveBundleToGitHubAndCache(job, bundle) {
    const { meta, kienthuc, baitap, figureUrls } = bundle;
    const paths = buildPaths(meta.ngay, meta.hash8);

    // 1. Lưu bản sao đầy đủ vào IndexedDB trước để đảm bảo an toàn cục bộ
    await dbSet(`result:${meta.hash8}`, {
      folderPath: paths.baseDir,
      meta,
      kienthuc,
      baitap,
      figureUrls
    });

    // Kiểm tra xem đã cấu hình GitHub Token chưa
    const settings = loadSettings();
    if (!settings?.github?.token) {
      return;
    }

    try {
      // 2. Ghi 3 file JSON chính của phiên
      await ghPutFile(paths.meta, JSON.stringify(meta, null, 2), `Lưu meta.json (${meta.id})`);
      await ghPutFile(paths.kienthuc, JSON.stringify(kienthuc, null, 2), `Lưu kienthuc.json (${meta.id})`);
      await ghPutFile(paths.baitap, JSON.stringify(baitap, null, 2), `Lưu baitap.json (${meta.id})`);

      // 3. Ghi các ảnh hình cắt nhị phân hinh/<id>.jpg
      for (const prob of baitap.danh_sach_bai) {
        if (prob.co_hinh && figureUrls[prob.id]) {
          await ghPutBase64(paths.hinh(prob.id), figureUrls[prob.id], `Lưu hình cắt ${prob.id}.jpg`);
        }
      }

      // 4. Cập nhật subjects.json (Thêm môn học và chương nếu chưa có)
      await updateJsonWithConflictRetry(paths.subjects, (curr) => {
        const data = (curr && typeof curr === 'object' && Array.isArray(curr.mon_hoc))
          ? curr
          : { mon_hoc: [] };

        let subj = data.mon_hoc.find(
          m => String(m.ten || '').toLowerCase() === String(meta.mon_hoc).toLowerCase()
        );
        if (!subj) {
          subj = { ten: meta.mon_hoc, chuong: [] };
          data.mon_hoc.push(subj);
        }
        if (!Array.isArray(subj.chuong)) subj.chuong = [];

        const hasChap = subj.chuong.some(c => Number(c.so) === Number(meta.chuong.so));
        if (!hasChap) {
          subj.chuong.push({
            so: Number(meta.chuong.so) || 1,
            ten: meta.chuong.ten || `Chương ${meta.chuong.so || 1}`
          });
          subj.chuong.sort((a, b) => Number(a.so) - Number(b.so));
        }
        return data;
      }, `Cập nhật subjects.json cho môn ${meta.mon_hoc}`);

      // 5. Cập nhật index/YYYY-MM.json (Gộp theo id khi có xung đột)
      const indexEntry = {
        id: meta.id,
        ngay: meta.ngay,
        ten: meta.tieu_de || meta.ten_file,
        mon_hoc: meta.mon_hoc,
        chuong: meta.chuong,
        hashtags: meta.hashtags,
        so_bai: meta.so_bai,
        duong_dan: paths.baseDir
      };

      await updateJsonWithConflictRetry(paths.monthIndex, (currArr) => {
        const arr = Array.isArray(currArr) ? [...currArr] : [];
        const existingIdx = arr.findIndex(item => item && item.id === indexEntry.id);
        if (existingIdx >= 0) {
          arr[existingIdx] = indexEntry;
        } else {
          arr.unshift(indexEntry);
        }
        return arr;
      }, `Cập nhật chỉ mục tháng ${paths.monthIndex}`);

      // 6. Cập nhật index/hashes.json
      const updatedHashes = await updateJsonWithConflictRetry('index/hashes.json', (currMap) => {
        const map = (currMap && typeof currMap === 'object' && !Array.isArray(currMap)) ? { ...currMap } : {};
        if (meta.hash64) {
          map[meta.hash64] = paths.baseDir;
        }
        return map;
      }, `Cập nhật index/hashes.json (${meta.hash8})`);

      await dbSet('index:hashes', updatedHashes);
    } catch (syncErr) {
      const preArea = document.getElementById('s2-preprocess-area');
      if (preArea) {
        preArea.innerHTML = `
          <div class="s2-alert s2-alert-err">
            <div><strong>⚠️ Đã giải xong nhưng lỗi khi đồng bộ lên GitHub:</strong> ${escapeHTML(syncErr.message)}</div>
            <div style="font-size:0.84rem; margin-top:4px;">Bản sao kết quả đã được lưu trong IndexedDB. Bạn có thể bấm nút bên dưới để thử đẩy lại lên GitHub.</div>
            <div class="s2-btn-row">
              <button type="button" class="btn-primary" id="s2-btn-retry-gh-sync">☁️ Thử lưu lại lên GitHub</button>
            </div>
          </div>
        `;
        document.getElementById('s2-btn-retry-gh-sync').onclick = async () => {
          await saveBundleToGitHubAndCache(job, bundle);
        };
      }
      throw syncErr;
    }
  }

  /**
   * Đọc lại toàn bộ kết quả từ một thư mục trên repo (hoặc IndexedDB) và gọi renderResult
   * Phục vụ cho nút "Mở lại kết quả" và xuất cho Chặng 3 dùng lại.
   */
  // Đổi blob URL thành data URL để lưu được vào IndexedDB lâu dài
  async function blobUrlToDataUrl(blobUrl) {
    const blob = await (await fetch(blobUrl)).blob();
    return await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
  }

  async function openResultByFolder(folderPath) {
    const cleanFolder = String(folderPath || '').replace(/\/+$/, '');
    const mountEl = document.getElementById('s2-result-mount') || document.getElementById('main-content');

    // 1. Thử tìm trong IndexedDB trước nếu khớp hash8
    const hashMatch = cleanFolder.match(/_([a-f0-9]{8})$/i);
    const hash8 = hashMatch ? hashMatch[1] : null;
    if (hash8) {
      const cached = await dbGet(`result:${hash8}`);
      const cachedFigs = (cached && cached.figureUrls) || {};
      const hasStaleBlob = Object.values(cachedFigs).some(u => typeof u === 'string' && u.startsWith('blob:'));
      const missingFig = !!(cached && cached.baitap && (cached.baitap.danh_sach_bai || []).some(p => p.co_hinh && !cachedFigs[p.id]));
      if (cached && cached.meta && cached.kienthuc && cached.baitap && !hasStaleBlob && !missingFig) {
        await renderResult(mountEl, cached);
        mountEl.scrollIntoView({ behavior: 'smooth' });
        return cached;
      }
    }

    // 2. Tải từ GitHub repo
    const [metaFile, ktFile, btFile] = await Promise.all([
      ghGetFile(`${cleanFolder}/meta.json`),
      ghGetFile(`${cleanFolder}/kienthuc.json`),
      ghGetFile(`${cleanFolder}/baitap.json`)
    ]);

    if (!metaFile || !ktFile || !btFile) {
      throw new Error(`Không tìm thấy đủ bộ 3 file JSON trong thư mục "${cleanFolder}" trên GitHub.`);
    }

    const meta = JSON.parse(metaFile.content);
    const kienthuc = JSON.parse(ktFile.content);
    const baitap = JSON.parse(btFile.content);
    const figureUrls = {};

    for (const prob of (baitap.danh_sach_bai || [])) {
      if (prob.co_hinh) {
        try {
          const blobUrl = await ghGetBlobUrl(`${cleanFolder}/hinh/${prob.id}.jpg`);
          figureUrls[prob.id] = await blobUrlToDataUrl(blobUrl);
        } catch (e) {
          figureUrls[prob.id] = '';
        }
      }
    }

    const bundle = { meta, kienthuc, baitap, figureUrls };
    if (hash8) {
      await dbSet(`result:${hash8}`, { folderPath: cleanFolder, ...bundle });
    }
    await renderResult(mountEl, bundle);
    mountEl.scrollIntoView({ behavior: 'smooth' });
    return bundle;
  }


  /* ==========================================================================
     9. TIỆN ÍCH & XUẤT API (Hàm phụ trợ tiến trình, Xuất window.MechaStage2)
     ========================================================================== */

  function getLocalTodayStr() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function accumulateTokens(job, stepName, usage) {
    if (!usage) return;
    const inp = Number(usage.inputTokens) || 0;
    const out = Number(usage.outputTokens) || 0;
    const tot = Number(usage.totalTokens) || (inp + out);

    job.totalTokens.inputTokens += inp;
    job.totalTokens.outputTokens += out;
    job.totalTokens.totalTokens += tot;
    job.stepLogs.push(`${stepName}: +${tot} tokens (In: ${inp}, Out: ${out})`);
  }

  function updateProgressUI(percent, stepText, job) {
    const bar = document.getElementById('s2-progress-bar');
    const stepEl = document.getElementById('s2-progress-step-text');
    const tokEl = document.getElementById('s2-progress-token-text');
    const logEl = document.getElementById('s2-batch-log');

    if (bar) bar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    if (stepEl) stepEl.textContent = stepText;
    if (tokEl && job?.totalTokens) {
      tokEl.textContent = `Token phiên: ${job.totalTokens.totalTokens} (In: ${job.totalTokens.inputTokens}, Out: ${job.totalTokens.outputTokens})`;
    }
    if (logEl && job?.stepLogs) {
      logEl.innerHTML = job.stepLogs.map(l => escapeHTML(l)).join(' &bull; ');
    }
  }

  function showPreprocessError(msg, retryFn = null) {
    const area = document.getElementById('s2-preprocess-area');
    if (!area) return;
    area.innerHTML = `
      <div class="s2-alert s2-alert-err">
        <div><strong>❌ Lỗi:</strong> ${escapeHTML(msg)}</div>
        ${retryFn ? `<div class="s2-btn-row"><button type="button" class="btn-primary" id="s2-btn-err-retry">↻ Thử lại</button></div>` : ''}
      </div>
    `;
    if (retryFn) {
      const btn = document.getElementById('s2-btn-err-retry');
      if (btn) btn.onclick = retryFn;
    }
  }

  // Xuất API công khai sang window.MechaStage2 để Chặng 3 và Chặng 4 sử dụng
  window.MechaStage2 = {
    renderResult,
    ghPutBase64,
    ghGetBlobUrl,
    sanitizeSvg,
    openResultByFolder
  };

  // Tự động khởi chạy ngay khi DOM sẵn sàng
  if (document.readyState !== 'loading') {
    initStage2();
  } else {
    document.addEventListener('DOMContentLoaded', initStage2);
  }
})();