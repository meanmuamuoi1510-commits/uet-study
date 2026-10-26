/**
 * MechaStudy VNU - PHÒNG THÍ NGHIỆM ĐỘNG HỌC ẢO & MATLAB STUDIO (mecha-labs.js)
 * Chuyên biệt hóa cho sinh viên ngành Kỹ thuật Cơ điện tử - ĐHQGHN (VNU-UET)
 * Bao gồm:
 *  1. Năm phòng thí nghiệm ảo tương tác thời gian thực (Mechanisms, Vibrations, Inverted Pendulum, Op-Amp/Oscilloscope, DC Motor PID)
 *  2. MATLAB & Python Studio (Bộ sinh script mô phỏng, phân tích hệ thống và xuất báo cáo)
 */
(function () {
  'use strict';

  /* ==========================================================================
     1. TIỆN ÍCH DÙNG CHUNG (Math, Canvas HiDPI, RK4 Runge-Kutta)
     ========================================================================== */

  const TWO_PI = Math.PI * 2;

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function setupHiDPICanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.width || 600;
    const h = rect.height || canvas.height || 360;

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    return { ctx, width: w, height: h };
  }

  function rk4(f, y, t, dt) {
    const n = y.length;
    const k1 = f(t, y);
    const y2 = new Array(n);
    for (let i = 0; i < n; i++) y2[i] = y[i] + 0.5 * dt * k1[i];

    const k2 = f(t + 0.5 * dt, y2);
    const y3 = new Array(n);
    for (let i = 0; i < n; i++) y3[i] = y[i] + 0.5 * dt * k2[i];

    const k3 = f(t + 0.5 * dt, y3);
    const y4 = new Array(n);
    for (let i = 0; i < n; i++) y4[i] = y[i] + dt * k3[i];

    const k4 = f(t + dt, y4);
    const yNext = new Array(n);
    for (let i = 0; i < n; i++) {
      yNext[i] = y[i] + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    }
    return yNext;
  }

  /* ==========================================================================
     2. GIAO DIỆN & STYLE CỦA PHÒNG THÍ NGHIỆM ẢO
     ========================================================================== */

  function injectLabsStyles() {
    if (document.getElementById('mecha-labs-styles')) return;
    const style = document.createElement('style');
    style.id = 'mecha-labs-styles';
    style.textContent = `
      .lab-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .lab-header-card {
        background: var(--bg-panel);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 16px 20px;
        box-shadow: var(--shadow);
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
      }
      .lab-nav {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 6px;
      }
      .lab-tab-btn {
        padding: 7px 14px;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--bg-sidebar);
        color: var(--text-main);
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .lab-tab-btn:hover {
        border-color: var(--primary);
        background: color-mix(in srgb, var(--primary) 12%, var(--bg-sidebar));
      }
      .lab-tab-btn.active {
        background: var(--primary);
        color: #fff;
        border-color: var(--primary);
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      }
      .lab-grid {
        display: grid;
        grid-template-columns: minmax(320px, 1fr) minmax(300px, 360px);
        gap: 16px;
        align-items: start;
      }
      @media (max-width: 900px) {
        .lab-grid { grid-template-columns: 1fr; }
      }
      .lab-view-card {
        background: var(--bg-panel);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 14px;
        box-shadow: var(--shadow);
        display: flex;
        flex-direction: column;
      }
      .lab-canvas {
        width: 100%;
        height: 380px;
        background: #0f172a;
        border-radius: 8px;
        display: block;
      }
      .lab-ctrl-card {
        background: var(--bg-panel);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 16px;
        box-shadow: var(--shadow);
      }
      .lab-ctrl-title {
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--primary);
        margin-bottom: 12px;
        padding-bottom: 6px;
        border-bottom: 1px dashed var(--border);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .lab-slider-group {
        margin-bottom: 12px;
      }
      .lab-slider-label {
        display: flex;
        justify-content: space-between;
        font-size: 0.82rem;
        font-weight: 600;
        margin-bottom: 4px;
      }
      .lab-slider-input {
        width: 100%;
        cursor: pointer;
      }
      .lab-info-badge {
        padding: 4px 8px;
        border-radius: 6px;
        background: var(--bg-sidebar);
        font-size: 0.8rem;
        font-family: 'JetBrains Mono', monospace;
      }
      .lab-btn-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 14px;
      }
      .lab-theory-card {
        background: var(--bg-panel);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 16px 20px;
        box-shadow: var(--shadow);
        font-size: 0.9rem;
        line-height: 1.6;
      }
      .lab-theory-card h4 {
        color: var(--primary);
        margin-bottom: 6px;
        font-size: 0.98rem;
      }

      /* MATLAB Studio Styles */
      .matlab-studio-wrap {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .matlab-preset-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 12px;
        margin-bottom: 14px;
      }
      .matlab-preset-card {
        padding: 12px;
        background: var(--bg-sidebar);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .matlab-preset-card:hover, .matlab-preset-card.active {
        border-color: var(--primary);
        background: color-mix(in srgb, var(--primary) 8%, var(--bg-panel));
        transform: translateY(-2px);
      }
      .matlab-code-area {
        background: #0f172a;
        color: #f8fafc;
        border-radius: 8px;
        padding: 14px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.84rem;
        line-height: 1.5;
        overflow-x: auto;
        max-height: 440px;
        white-space: pre;
      }
    `;
    document.head.appendChild(style);
  }

  /* ==========================================================================
     3. ĐỊNH NGHĨA 5 PHÒNG THÍ NGHIỆM ẢO (VIRTUAL LABS)
     ========================================================================== */

  const LABS_CONFIG = [
    {
      id: 'fourbar',
      title: '1. Cơ cấu 4 khâu & Con trượt',
      subtitle: 'Động học khâu, Cơ cấu Grashof & Quỹ đạo điểm',
      monHoc: 'Cơ kỹ thuật & Cơ học máy'
    },
    {
      id: 'vibration',
      title: '2. Dao động Lò xo - Giảm chấn',
      subtitle: 'Hệ m-c-k, Tần số riêng, Tắt dần & Cộng hưởng',
      monHoc: 'Cơ kỹ thuật (Dao động)'
    },
    {
      id: 'pendulum',
      title: '3. Xe trượt - Con lắc ngược',
      subtitle: 'Mô hình phi tuyến kinh điển & Cân bằng tự động LQR',
      monHoc: 'Lý thuyết Điều khiển & Cơ điện tử'
    },
    {
      id: 'opamp',
      title: '4. Mạch Op-Amp & Dao động',
      subtitle: 'Máy hiện sóng ảo 2 kênh, KĐ đảo, Không đảo & Lọc RLC',
      monHoc: 'Kỹ thuật Điện tử & Mạch'
    },
    {
      id: 'dcmotor',
      title: '5. Điều khiển Động cơ DC (PID)',
      subtitle: 'Hàm truyền đạt, Đáp ứng bước, Tinh chỉnh Kp-Ki-Kd',
      monHoc: 'Lý thuyết Điều khiển tự động'
    }
  ];

  let currentActiveLab = 'fourbar';
  let labAnimFrameId = null;
  let labSimState = {};

  /**
   * Khởi tạo giao diện chính cho Phòng Thí Nghiệm Ảo
   */
  function initWorkspace() {
    injectLabsStyles();
    const wsEl = document.getElementById('mecha-labs-workspace');
    if (!wsEl) return;

    wsEl.innerHTML = `
      <div class="lab-container">
        <!-- Thanh chọn bài thí nghiệm -->
        <div class="lab-header-card">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.3rem;">🔬</span>
              <strong style="font-size:1.1rem; color:var(--primary);">Phòng Thí Nghiệm Động Học Cơ Điện Tử (MechaLabs VNU)</strong>
              <span class="s2-badge" style="background:var(--primary); color:#fff;">Interactive 60 FPS</span>
            </div>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">
              Trực quan hóa mô hình động lực học, mạch điện tử và hệ thống điều khiển theo giáo trình Trường ĐH Công nghệ (VNU-UET).
            </p>
          </div>
          <button type="button" class="btn-sm" id="btn-labs-help">📖 Hướng dẫn sử dụng Lab</button>
        </div>

        <div class="lab-nav">
          ${LABS_CONFIG.map(l => `
            <button type="button" class="lab-tab-btn ${l.id === currentActiveLab ? 'active' : ''}" data-lab="${l.id}">
              ${l.title}
            </button>
          `).join('')}
        </div>

        <!-- Khung làm việc của Lab hiện hành -->
        <div id="lab-active-content"></div>
      </div>
    `;

    // Gắn sự kiện chuyển đổi Lab
    wsEl.querySelectorAll('.lab-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const labId = btn.getAttribute('data-lab');
        if (labId && labId !== currentActiveLab) {
          switchLab(labId);
        }
      });
    });

    const helpBtn = wsEl.querySelector('#btn-labs-help');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        if (window.MechaStage5?.showToast) {
          window.MechaStage5.showToast('💡 Kéo thanh trượt tham số để thấy phản ứng động thời gian thực!');
        } else {
          alert('Kéo các thanh trượt tham số để quan sát sự thay đổi động lực học thời gian thực.');
        }
      });
    }

    renderCurrentLab();
  }

  function switchLab(labId) {
    if (labAnimFrameId) {
      cancelAnimationFrame(labAnimFrameId);
      labAnimFrameId = null;
    }
    currentActiveLab = labId;
    document.querySelectorAll('.lab-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lab') === labId);
    });
    renderCurrentLab();
  }

  function renderCurrentLab() {
    const hostEl = document.getElementById('lab-active-content');
    if (!hostEl) return;

    if (currentActiveLab === 'fourbar') {
      renderLabFourBar(hostEl);
    } else if (currentActiveLab === 'vibration') {
      renderLabVibration(hostEl);
    } else if (currentActiveLab === 'pendulum') {
      renderLabPendulum(hostEl);
    } else if (currentActiveLab === 'opamp') {
      renderLabOpAmp(hostEl);
    } else if (currentActiveLab === 'dcmotor') {
      renderLabDCMotor(hostEl);
    }
  }

  /* --------------------------------------------------------------------------
     LAB 1: CƠ CẤU 4 KHÂU BẢN LỀ & CON TRƯỢT THANH TRUYỀN
     -------------------------------------------------------------------------- */
  function renderLabFourBar(hostEl) {
    hostEl.innerHTML = `
      <div class="lab-grid">
        <div class="lab-view-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <strong style="font-size:0.95rem;">⚙️ Trực Quan Động Học Cơ Cấu</strong>
            <div style="display:flex; gap:6px;">
              <button type="button" class="btn-sm" id="btn-fourbar-pause">⏸️ Tạm dừng</button>
              <button type="button" class="btn-sm" id="btn-fourbar-clear-trail">🧹 Xóa quỹ đạo</button>
            </div>
          </div>
          <canvas class="lab-canvas" id="canvas-fourbar"></canvas>
          <div style="margin-top:8px; display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-muted);">
            <span>Đường màu vàng: Quỹ đạo điểm thanh truyền (Coupler Curve)</span>
            <span id="fourbar-grashof-badge" class="lab-info-badge">Điều kiện Grashof</span>
          </div>
        </div>

        <div class="lab-ctrl-card">
          <div class="lab-ctrl-title">
            <span>Bảng Điều Khiển Cơ Cấu</span>
            <span class="lab-info-badge" id="fourbar-omega-badge">ω = 2.0 rad/s</span>
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Dạng cơ cấu:</span></div>
            <select id="fourbar-type" style="width:100%; padding:6px; border-radius:6px; margin-bottom:8px;">
              <option value="fourbar">Cơ cấu 4 khâu bản lề (Crank-Rocker)</option>
              <option value="slider">Cơ cấu Con trượt - Thanh truyền (Slider-Crank)</option>
            </select>
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Chiều dài tay quay L1 (m):</span> <strong id="lbl-l1">0.12</strong></div>
            <input type="range" class="lab-slider-input" id="inp-l1" min="0.05" max="0.30" step="0.01" value="0.12">
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Chiều dài thanh truyền L2 (m):</span> <strong id="lbl-l2">0.32</strong></div>
            <input type="range" class="lab-slider-input" id="inp-l2" min="0.15" max="0.60" step="0.01" value="0.32">
          </div>

          <div class="lab-slider-group" id="group-l3">
            <div class="lab-slider-label"><span>Chiều dài cần lắc L3 (m):</span> <strong id="lbl-l3">0.24</strong></div>
            <input type="range" class="lab-slider-input" id="inp-l3" min="0.10" max="0.50" step="0.01" value="0.24">
          </div>

          <div class="lab-slider-group" id="group-l0">
            <div class="lab-slider-label"><span>Khoảng cách giá cố định L0 (m):</span> <strong id="lbl-l0">0.30</strong></div>
            <input type="range" class="lab-slider-input" id="inp-l0" min="0.15" max="0.60" step="0.01" value="0.30">
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Tốc độ quay ω1 (rad/s):</span> <strong id="lbl-w1">2.0</strong></div>
            <input type="range" class="lab-slider-input" id="inp-w1" min="0.2" max="8.0" step="0.2" value="2.0">
          </div>

          <div class="lab-btn-row">
            <button type="button" class="btn-primary btn-sm" id="btn-fourbar-export-m" style="width:100%;">
              📋 Xuất mã mô phỏng MATLAB (.m)
            </button>
          </div>
        </div>
      </div>

      <div class="lab-theory-card" style="margin-top:16px;">
        <h4>📐 Cơ sở Lý thuyết & Công thức Động học VNU-UET</h4>
        <p>
          <strong>Điều kiện Grashof:</strong> Với cơ cấu 4 khâu phẳng có các chiều dài \(s\) (khâu ngắn nhất), \(l\) (khâu dài nhất), \(p\) và \(q\):<br>
          - Nếu \(s + l \le p + q\): Khâu ngắn nhất có thể quay toàn vòng \(360^\circ\). Khi khâu ngắn nhất làm tay quay (khâu 1), ta có cơ cấu <em>Tay quay - Cần lắc (Crank-Rocker)</em>.<br>
          - Nếu \(s + l > p + q\): Cơ cấu không thỏa mãn Grashof (tất cả các khâu chỉ lắc qua lại - <em>Double-Rocker</em>).
        </p>
      </div>
    `;

    const canvas = hostEl.querySelector('#canvas-fourbar');
    let isPaused = false;
    let trail = [];

    const state = {
      type: 'fourbar',
      L1: 0.12,
      L2: 0.32,
      L3: 0.24,
      L0: 0.30,
      w1: 2.0,
      theta1: 0
    };

    // UI Bindings
    const inpType = hostEl.querySelector('#fourbar-type');
    const inpL1 = hostEl.querySelector('#inp-l1');
    const inpL2 = hostEl.querySelector('#inp-l2');
    const inpL3 = hostEl.querySelector('#inp-l3');
    const inpL0 = hostEl.querySelector('#inp-l0');
    const inpW1 = hostEl.querySelector('#inp-w1');

    function syncLabels() {
      hostEl.querySelector('#lbl-l1').textContent = state.L1.toFixed(2);
      hostEl.querySelector('#lbl-l2').textContent = state.L2.toFixed(2);
      hostEl.querySelector('#lbl-l3').textContent = state.L3.toFixed(2);
      hostEl.querySelector('#lbl-l0').textContent = state.L0.toFixed(2);
      hostEl.querySelector('#lbl-w1').textContent = state.w1.toFixed(1);

      // Check Grashof
      if (state.type === 'fourbar') {
        const lens = [state.L1, state.L2, state.L3, state.L0].sort((a,b)=>a-b);
        const s = lens[0], l = lens[3], p = lens[1], q = lens[2];
        const isGrashof = (s + l) <= (p + q);
        const badge = hostEl.querySelector('#fourbar-grashof-badge');
        if (badge) {
          badge.textContent = isGrashof ? '✓ Thỏa Grashof (Crank-Rocker)' : '⚠️ Non-Grashof (Không quay tròn)';
          badge.style.color = isGrashof ? 'var(--success)' : 'var(--danger)';
        }
      } else {
        const badge = hostEl.querySelector('#fourbar-grashof-badge');
        if (badge) {
          badge.textContent = 'Cơ cấu Con trượt - Piston';
          badge.style.color = 'var(--primary)';
        }
      }
    }

    inpType.onchange = () => {
      state.type = inpType.value;
      trail = [];
      hostEl.querySelector('#group-l3').style.display = state.type === 'slider' ? 'none' : 'block';
      hostEl.querySelector('#group-l0').style.display = state.type === 'slider' ? 'none' : 'block';
      syncLabels();
    };
    inpL1.oninput = () => { state.L1 = parseFloat(inpL1.value); syncLabels(); trail = []; };
    inpL2.oninput = () => { state.L2 = parseFloat(inpL2.value); syncLabels(); trail = []; };
    inpL3.oninput = () => { state.L3 = parseFloat(inpL3.value); syncLabels(); trail = []; };
    inpL0.oninput = () => { state.L0 = parseFloat(inpL0.value); syncLabels(); trail = []; };
    inpW1.oninput = () => { state.w1 = parseFloat(inpW1.value); syncLabels(); };

    hostEl.querySelector('#btn-fourbar-pause').onclick = (e) => {
      isPaused = !isPaused;
      e.target.textContent = isPaused ? '▶ Tiếp tục' : '⏸️ Tạm dừng';
    };
    hostEl.querySelector('#btn-fourbar-clear-trail').onclick = () => { trail = []; };

    hostEl.querySelector('#btn-fourbar-export-m').onclick = () => {
      const script = generateMatlabForFourbar(state);
      copyTextToClipboard(script, 'Đã copy script MATLAB mô phỏng 4 khâu bản lề!');
    };

    syncLabels();

    // Loop
    let lastTs = performance.now();
    function loop(ts) {
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;

      if (!isPaused) {
        state.theta1 = (state.theta1 + state.w1 * dt) % TWO_PI;
      }

      const { ctx, width, height } = setupHiDPICanvas(canvas);

      // Coordinate scaling (center of canvas)
      const scale = Math.min(width, height) / 0.85;
      const ox = width * 0.35;
      const oy = height * 0.60;

      const toPxX = (x) => ox + x * scale;
      const toPxY = (y) => oy - y * scale;

      // Clear background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Draw Grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // Kinematic calculations
      const Ax = 0, Ay = 0;
      const Bx = state.L1 * Math.cos(state.theta1);
      const By = state.L1 * Math.sin(state.theta1);

      let Cx = 0, Cy = 0, Dx = 0, Dy = 0;
      let valid = true;

      if (state.type === 'fourbar') {
        Dx = state.L0; Dy = 0;
        // Intersect circle B(Bx, By, r=L2) and circle D(Dx, Dy, r=L3)
        const dBD = Math.hypot(Dx - Bx, Dy - By);
        if (dBD > state.L2 + state.L3 || dBD < Math.abs(state.L2 - state.L3) || dBD === 0) {
          valid = false;
        } else {
          const a = (state.L2 * state.L2 - state.L3 * state.L3 + dBD * dBD) / (2 * dBD);
          const h = Math.sqrt(Math.max(0, state.L2 * state.L2 - a * a));
          const x2 = Bx + (a * (Dx - Bx)) / dBD;
          const y2 = By + (a * (Dy - By)) / dBD;
          // Pick branch
          Cx = x2 - (h * (Dy - By)) / dBD;
          Cy = y2 + (h * (Dx - Bx)) / dBD;
        }
      } else {
        // Slider-crank
        const sinPhi = (By - 0) / state.L2;
        if (Math.abs(sinPhi) > 1) {
          valid = false;
        } else {
          Cx = Bx + Math.sqrt(state.L2 * state.L2 - By * By);
          Cy = 0;
        }
      }

      // Draw Trail
      if (valid) {
        const Px = (Bx + Cx) / 2;
        const Py = (By + Cy) / 2;
        trail.push({ x: toPxX(Px), y: toPxY(Py) });
        if (trail.length > 250) trail.shift();
      }

      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < trail.length; i++) {
        if (i === 0) ctx.moveTo(trail[i].x, trail[i].y);
        else ctx.lineTo(trail[i].x, trail[i].y);
      }
      ctx.stroke();

      if (valid) {
        // Draw Links
        // Link 0 (Ground)
        if (state.type === 'fourbar') {
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(toPxX(Ax), toPxY(Ay));
          ctx.lineTo(toPxX(Dx), toPxY(Dy));
          ctx.stroke();
        }

        // Link 1 (Crank - Cyan)
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(toPxX(Ax), toPxY(Ay));
        ctx.lineTo(toPxX(Bx), toPxY(By));
        ctx.stroke();

        // Link 2 (Coupler - Emerald)
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(toPxX(Bx), toPxY(By));
        ctx.lineTo(toPxX(Cx), toPxY(Cy));
        ctx.stroke();

        // Link 3 (Follower - Violet) OR Slider Box
        if (state.type === 'fourbar') {
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(toPxX(Dx), toPxY(Dy));
          ctx.lineTo(toPxX(Cx), toPxY(Cy));
          ctx.stroke();
        } else {
          // Draw Slider Piston
          const pw = 48, ph = 26;
          ctx.fillStyle = '#f97316';
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.fillRect(toPxX(Cx) - pw/2, toPxY(Cy) - ph/2, pw, ph);
          ctx.strokeRect(toPxX(Cx) - pw/2, toPxY(Cy) - ph/2, pw, ph);

          // Guide rail
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(toPxX(-0.1), toPxY(Cy) + 16);
          ctx.lineTo(toPxX(0.7), toPxY(Cy) + 16);
          ctx.moveTo(toPxX(-0.1), toPxY(Cy) - 16);
          ctx.lineTo(toPxX(0.7), toPxY(Cy) - 16);
          ctx.stroke();
        }

        // Draw Joints
        const drawJoint = (x, y, name, color = '#ffffff') => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(toPxX(x), toPxY(y), 6, 0, TWO_PI);
          ctx.fill();
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 12px "JetBrains Mono", sans-serif';
          ctx.fillText(name, toPxX(x) + 8, toPxY(y) - 8);
        };

        drawJoint(Ax, Ay, 'A (Khớp quay)');
        drawJoint(Bx, By, 'B');
        drawJoint(Cx, Cy, state.type === 'fourbar' ? 'C' : 'C (Con trượt)');
        if (state.type === 'fourbar') drawJoint(Dx, Dy, 'D (Giá cố định)');
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.font = '16px "Be Vietnam Pro", sans-serif';
        ctx.fillText('⚠️ Cơ cấu ở vị trí kẹt / Không thể khép kín hình học!', 30, height / 2);
      }

      labAnimFrameId = requestAnimationFrame(loop);
    }
    labAnimFrameId = requestAnimationFrame(loop);
  }

  function generateMatlabForFourbar(state) {
    return `% =========================================================================
% MechaStudy VNU - Mô Phỏng Động Học Cơ Cấu 4 Khâu Bản Lề
% Khoa Cơ học kỹ thuật và Tự động hóa - VNU-UET
% =========================================================================
clc; clear; close all;

%% 1. THAM SỐ CƠ CẤU (Mét)
L1 = ${state.L1}; % Khâu 1 (Tay quay)
L2 = ${state.L2}; % Khâu 2 (Thanh truyền)
L3 = ${state.L3}; % Khâu 3 (Cần lắc)
L0 = ${state.L0}; % Khâu 0 (Giá cố định)
omega1 = ${state.w1}; % Vận tốc góc tay quay (rad/s)

%% 2. TÍNH TOÁN QUỸ ĐẠO THEO GÓC QUAY THETA_1
theta1 = linspace(0, 2*pi, 360);
t = theta1 / omega1;
Bx = L1 * cos(theta1);
By = L1 * sin(theta1);

Cx = zeros(size(theta1));
Cy = zeros(size(theta1));

for i = 1:length(theta1)
    dBD = hypot(L0 - Bx(i), -By(i));
    a = (L2^2 - L3^2 + dBD^2) / (2 * dBD);
    h = sqrt(max(0, L2^2 - a^2));
    x2 = Bx(i) + a * (L0 - Bx(i)) / dBD;
    y2 = By(i) - a * By(i) / dBD;
    Cx(i) = x2 + h * By(i) / dBD;
    Cy(i) = y2 + h * (L0 - Bx(i)) / dBD;
end

%% 3. VẼ QUỸ ĐẠO ĐIỂM GIỮA THANH TRUYỀN (COUPLER CURVE)
Px = (Bx + Cx) / 2;
Py = (By + Cy) / 2;

figure('Name', 'Mo phong Co cau 4 khau VNU', 'Color', 'w');
plot(Px, Py, 'r-', 'LineWidth', 2); hold on; grid on; axis equal;
plot([0, L0], [0, 0], 'ko-', 'LineWidth', 3, 'MarkerFaceColor', 'k');
title('Quỹ đạo điểm thanh truyền (Coupler Curve) - VNU-UET');
xlabel('Trục Ox (m)'); ylabel('Trục Oy (m)');
legend('Quỹ đạo điểm P', 'Giá cố định AD');
`;
  }

  /* --------------------------------------------------------------------------
     LAB 2: HỆ DAO ĐỘNG LÒ XO - KHỐI LƯỢNG - GIẢM CHẤN
     -------------------------------------------------------------------------- */
  function renderLabVibration(hostEl) {
    hostEl.innerHTML = `
      <div class="lab-grid">
        <div class="lab-view-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <strong style="font-size:0.95rem;">〰️ Mô Hình Vật Lý & Đồ Thị Li Độ x(t)</strong>
            <button type="button" class="btn-sm" id="btn-vib-reset">↺ Đặt lại vị trí ban đầu</button>
          </div>
          <canvas class="lab-canvas" id="canvas-vibration"></canvas>
          <div style="margin-top:8px; display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-muted);">
            <span id="vib-status-text">Đang dao động điều hòa</span>
            <span id="vib-resonance-badge" class="lab-info-badge">Hệ số cản ζ = 0.15</span>
          </div>
        </div>

        <div class="lab-ctrl-card">
          <div class="lab-ctrl-title">
            <span>Tham Số Hệ Dao Động</span>
            <span class="lab-info-badge" id="vib-wn-badge">ωn = 5.0 rad/s</span>
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Khối lượng m (kg):</span> <strong id="lbl-vm">2.0</strong></div>
            <input type="range" class="lab-slider-input" id="inp-vm" min="0.5" max="10.0" step="0.5" value="2.0">
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Độ cứng lò xo k (N/m):</span> <strong id="lbl-vk">50.0</strong></div>
            <input type="range" class="lab-slider-input" id="inp-vk" min="10" max="200" step="5" value="50.0">
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Hệ số cản nhớt c (N·s/m):</span> <strong id="lbl-vc">1.5</strong></div>
            <input type="range" class="lab-slider-input" id="inp-vc" min="0.0" max="15.0" step="0.5" value="1.5">
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Lực kích thích F0 (N):</span> <strong id="lbl-vf0">0.0</strong></div>
            <input type="range" class="lab-slider-input" id="inp-vf0" min="0.0" max="20.0" step="1.0" value="0.0">
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Tần số kích thích ω (rad/s):</span> <strong id="lbl-vw">5.0</strong></div>
            <input type="range" class="lab-slider-input" id="inp-vw" min="1.0" max="15.0" step="0.5" value="5.0">
          </div>

          <div class="lab-btn-row">
            <button type="button" class="btn-sm" id="btn-vib-kick" style="flex:1;">⚡ Kích dao động (+0.5m)</button>
            <button type="button" class="btn-primary btn-sm" id="btn-vib-export-m" style="flex:1;">📋 Xuất mã MATLAB</button>
          </div>
        </div>
      </div>

      <div class="lab-theory-card" style="margin-top:16px;">
        <h4>📐 Phương Trình Vi Phân Dao Động & Hiện Tượng Cộng Hưởng</h4>
        <p>
          Phương trình vi phân tổng quát: \(m \ddot{x} + c \dot{x} + k x = F_0 \cos(\omega t)\).<br>
          - Tần số dao động riêng: \(\omega_n = \sqrt{k/m}\).<br>
          - Hệ số cản tỉ đối: \(\zeta = \frac{c}{2\sqrt{km}}\).<br>
          Khi \(\zeta < 1\): Dao động tắt dần dưới hạn; khi \(\zeta = 1\): Tắt dần tới hạn (không dao động); khi \(\omega \approx \omega_n\): Hiện tượng <strong>Cộng hưởng (Resonance)</strong> làm biên độ dao động vọt lên cực đại!
        </p>
      </div>
    `;

    const canvas = hostEl.querySelector('#canvas-vibration');
    let plotBuffer = [];

    const state = {
      m: 2.0,
      k: 50.0,
      c: 1.5,
      F0: 0.0,
      w: 5.0,
      x: 0.4,
      v: 0.0,
      t: 0
    };

    const inpM = hostEl.querySelector('#inp-vm');
    const inpK = hostEl.querySelector('#inp-vk');
    const inpC = hostEl.querySelector('#inp-vc');
    const inpF0 = hostEl.querySelector('#inp-vf0');
    const inpW = hostEl.querySelector('#inp-vw');

    function syncLabels() {
      hostEl.querySelector('#lbl-vm').textContent = state.m.toFixed(1);
      hostEl.querySelector('#lbl-vk').textContent = state.k.toFixed(1);
      hostEl.querySelector('#lbl-vc').textContent = state.c.toFixed(1);
      hostEl.querySelector('#lbl-vf0').textContent = state.F0.toFixed(1);
      hostEl.querySelector('#lbl-vw').textContent = state.w.toFixed(1);

      const wn = Math.sqrt(state.k / state.m);
      const zeta = state.c / (2 * Math.sqrt(state.k * state.m));
      hostEl.querySelector('#vib-wn-badge').textContent = `ωn = ${wn.toFixed(2)} rad/s`;
      const zBadge = hostEl.querySelector('#vib-resonance-badge');
      if (zBadge) {
        let typeStr = 'Tắt dần (Damped)';
        if (zeta < 0.01) typeStr = 'Tự do không cản (Undamped)';
        else if (Math.abs(zeta - 1.0) < 0.05) typeStr = 'Tới hạn (Critical)';
        else if (zeta > 1.0) typeStr = 'Quá cản (Overdamped)';
        zBadge.textContent = `ζ = ${zeta.toFixed(2)} (${typeStr})`;
      }
    }

    inpM.oninput = () => { state.m = parseFloat(inpM.value); syncLabels(); };
    inpK.oninput = () => { state.k = parseFloat(inpK.value); syncLabels(); };
    inpC.oninput = () => { state.c = parseFloat(inpC.value); syncLabels(); };
    inpF0.oninput = () => { state.F0 = parseFloat(inpF0.value); syncLabels(); };
    inpW.oninput = () => { state.w = parseFloat(inpW.value); syncLabels(); };

    hostEl.querySelector('#btn-vib-reset').onclick = () => {
      state.x = 0; state.v = 0; state.t = 0; plotBuffer = [];
    };
    hostEl.querySelector('#btn-vib-kick').onclick = () => {
      state.x += 0.4;
    };
    hostEl.querySelector('#btn-vib-export-m').onclick = () => {
      const script = generateMatlabForVibration(state);
      copyTextToClipboard(script, 'Đã copy script MATLAB mô phỏng dao động m-c-k!');
    };

    syncLabels();

    let lastTs = performance.now();
    function loop(ts) {
      const dt = Math.min((ts - lastTs) / 1000, 0.03);
      lastTs = ts;

      // Numerical RK4 step
      const f = (curT, y) => {
        const x = y[0], v = y[1];
        const Fext = state.F0 * Math.cos(state.w * curT);
        const a = (Fext - state.c * v - state.k * x) / state.m;
        return [v, a];
      };

      const nextY = rk4(f, [state.x, state.v], state.t, dt);
      state.x = clamp(nextY[0], -0.9, 0.9);
      state.v = nextY[1];
      state.t += dt;

      plotBuffer.push(state.x);
      if (plotBuffer.length > 300) plotBuffer.shift();

      const { ctx, width, height } = setupHiDPICanvas(canvas);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Split canvas: Left 40% Physical Model, Right 60% Scrolling Graph
      const splitX = width * 0.38;

      // Physical Model (Left)
      const centerX = splitX / 2;
      const wallY = 50;
      const massY = 220 + state.x * 120; // Equilibrium at y=220
      const massW = 90, massH = 50;

      // Ceiling
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(centerX - 80, wallY);
      ctx.lineTo(centerX + 80, wallY);
      ctx.stroke();

      // Hatching
      ctx.lineWidth = 1;
      for (let hx = centerX - 80; hx <= centerX + 80; hx += 12) {
        ctx.beginPath();
        ctx.moveTo(hx, wallY);
        ctx.lineTo(hx + 8, wallY - 10);
        ctx.stroke();
      }

      // Spring (Zigzag)
      const springX = centerX - 24;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(springX, wallY);
      const coils = 12;
      const dy = (massY - wallY) / coils;
      for (let i = 1; i <= coils; i++) {
        const sx = springX + (i % 2 === 0 ? 12 : -12);
        ctx.lineTo(sx, wallY + i * dy);
      }
      ctx.lineTo(springX, massY);
      ctx.stroke();

      // Damper (Piston cylinder)
      const dampX = centerX + 24;
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      // Cylinder
      ctx.strokeRect(dampX - 10, wallY + (massY - wallY) * 0.4, 20, 50);
      // Piston rod
      ctx.beginPath();
      ctx.moveTo(dampX, wallY);
      ctx.lineTo(dampX, wallY + (massY - wallY) * 0.4 + 25);
      ctx.moveTo(dampX, wallY + (massY - wallY) * 0.4 + 50);
      ctx.lineTo(dampX, massY);
      ctx.stroke();

      // Mass block
      ctx.fillStyle = '#3b82f6';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.fillRect(centerX - massW/2, massY, massW, massH);
      ctx.strokeRect(centerX - massW/2, massY, massW, massH);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px "JetBrains Mono", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`m = ${state.m}kg`, centerX, massY + 28);
      ctx.textAlign = 'left';

      // Graph Divider
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(splitX, 0); ctx.lineTo(splitX, height);
      ctx.stroke();

      // Right Scrolling Graph: x(t)
      const graphW = width - splitX - 20;
      const graphH = height - 60;
      const graphMidY = height / 2;

      // Graph Grid & Centerline
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.strokeRect(splitX + 10, 30, graphW, graphH);

      ctx.strokeStyle = '#475569';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(splitX + 10, graphMidY);
      ctx.lineTo(splitX + 10 + graphW, graphMidY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Waveform
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i < plotBuffer.length; i++) {
        const px = splitX + 10 + (i / 300) * graphW;
        const py = graphMidY - plotBuffer[i] * (graphH * 0.45);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText('Đồ thị li độ x(t)', splitX + 16, 46);
      ctx.fillText('+0.8m', splitX + 16, graphMidY - graphH * 0.4);
      ctx.fillText('-0.8m', splitX + 16, graphMidY + graphH * 0.4 + 10);

      labAnimFrameId = requestAnimationFrame(loop);
    }
    labAnimFrameId = requestAnimationFrame(loop);
  }

  function generateMatlabForVibration(state) {
    return `% =========================================================================
% MechaStudy VNU - Mô Phỏng Dao Động Lò Xo - Khối Lượng - Giảm Chấn (m-c-k)
% Khoa Cơ học kỹ thuật và Tự động hóa - VNU-UET
% =========================================================================
clc; clear; close all;

m = ${state.m};     % Khối lượng (kg)
k = ${state.k};    % Độ cứng lò xo (N/m)
c = ${state.c};     % Hệ số cản (N.s/m)
F0 = ${state.F0};   % Biên độ lực cưỡng bức (N)
omega = ${state.w}; % Tần số lực cưỡng bức (rad/s)

% Tần số riêng và hệ số cản tỉ đối
omega_n = sqrt(k/m);
zeta = c / (2*sqrt(k*m));
fprintf('Tần số riêng omega_n = %.2f rad/s\\n', omega_n);
fprintf('Hệ số cản tỉ đối zeta = %.2f\\n', zeta);

% Hàm vi phân trạng thái: dy/dt = [v; (F0*cos(omega*t) - c*v - k*x)/m]
dydt = @(t, y) [y(2); (F0*cos(omega*t) - c*y(2) - k*y(1))/m];

tspan = [0 15];
y0 = [0.4; 0]; % Điều kiện đầu: x0 = 0.4m, v0 = 0

[t, y] = ode45(dydt, tspan, y0);

figure('Name', 'Mo phong Dao dong m-c-k VNU', 'Color', 'w');
plot(t, y(:,1), 'b-', 'LineWidth', 2); grid on;
title(sprintf('Đáp ứng dao động m-c-k (\\omega_n = %.2f rad/s, \\zeta = %.2f)', omega_n, zeta));
xlabel('Thời gian t (s)'); ylabel('Li độ x (m)');
legend('Li độ x(t)');
`;
  }

  /* --------------------------------------------------------------------------
     LAB 3: XE TRƯỢT - CON LẮC NGƯỢC (INVERTED PENDULUM ON CART)
     -------------------------------------------------------------------------- */
  function renderLabPendulum(hostEl) {
    hostEl.innerHTML = `
      <div class="lab-grid">
        <div class="lab-view-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <strong style="font-size:0.95rem;">⚖️ Xe Trượt & Con Lắc Tự Cân Bằng</strong>
            <button type="button" class="btn-sm" id="btn-pen-disturb">💨 Tác động lực nhiễu (+15N)</button>
          </div>
          <canvas class="lab-canvas" id="canvas-pendulum"></canvas>
          <div style="margin-top:8px; display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-muted);">
            <span id="pen-status-text">Bộ điều khiển LQR đang giữ thăng bằng thẳng đứng</span>
            <span id="pen-angle-badge" class="lab-info-badge">θ = 0.00°</span>
          </div>
        </div>

        <div class="lab-ctrl-card">
          <div class="lab-ctrl-title">
            <span>Tham Số Xe & Bộ Điều Khiển</span>
            <span class="lab-info-badge">VNU Inverted Pendulum</span>
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Chế độ điều khiển:</span></div>
            <select id="pen-ctrl-mode" style="width:100%; padding:6px; border-radius:6px; margin-bottom:8px;">
              <option value="auto">Tự động giữ thăng bằng (LQR State-Feedback)</option>
              <option value="manual">Điều khiển thủ công (Phím ← → hoặc chuột)</option>
            </select>
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Khối lượng xe M (kg):</span> <strong id="lbl-pm">1.5</strong></div>
            <input type="range" class="lab-slider-input" id="inp-pm" min="0.5" max="5.0" step="0.2" value="1.5">
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Khối lượng con lắc m (kg):</span> <strong id="lbl-pmm">0.3</strong></div>
            <input type="range" class="lab-slider-input" id="inp-pmm" min="0.05" max="1.5" step="0.05" value="0.3">
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Chiều dài thanh L (m):</span> <strong id="lbl-pl">0.40</strong></div>
            <input type="range" class="lab-slider-input" id="inp-pl" min="0.15" max="0.80" step="0.05" value="0.40">
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Hệ số khuếch đại Kp (Góc nghiêng):</span> <strong id="lbl-pkp">120</strong></div>
            <input type="range" class="lab-slider-input" id="inp-pkp" min="20" max="300" step="10" value="120">
          </div>

          <div class="lab-btn-row">
            <button type="button" class="btn-sm" id="btn-pen-reset" style="flex:1;">↺ Cân bằng lại</button>
            <button type="button" class="btn-primary btn-sm" id="btn-pen-export-m" style="flex:1;">📋 Xuất mã MATLAB</button>
          </div>
        </div>
      </div>

      <div class="lab-theory-card" style="margin-top:16px;">
        <h4>📐 Mô Hình Toán Học Xe Trượt - Con Lắc Ngược (Euler-Lagrange)</h4>
        <p>
          Hệ hai phương trình vi phân phi tuyến ghép cặp:<br>
          \[ (M + m)\ddot{x} + m L \ddot{\theta}\cos\theta - m L \dot{\theta}^2\sin\theta = F \]<br>
          \[ m L \ddot{x}\cos\theta + (I + m L^2)\ddot{\theta} - m g L \sin\theta = 0 \]<br>
          Khi tuyến tính hóa quanh điểm cân bằng thẳng đứng \(\theta \approx 0\), bộ điều khiển phản hồi trạng thái \(F = -K \mathbf{x} = -(K_1 x + K_2 \dot{x} + K_3 \theta + K_4 \dot{\theta})\) tính toán lực đẩy bánh xe để con lắc luôn đứng thăng bằng tự động.
        </p>
      </div>
    `;

    const canvas = hostEl.querySelector('#canvas-pendulum');
    const state = {
      M: 1.5,
      m: 0.3,
      L: 0.40,
      Kp: 120,
      mode: 'auto',
      x: 0,
      vx: 0,
      theta: 0.08, // Nhẹ ban đầu để thấy tự cân bằng
      omega: 0
    };

    const inpM = hostEl.querySelector('#inp-pm');
    const inpMm = hostEl.querySelector('#inp-pmm');
    const inpL = hostEl.querySelector('#inp-pl');
    const inpKp = hostEl.querySelector('#inp-pkp');
    const inpMode = hostEl.querySelector('#pen-ctrl-mode');

    function syncLabels() {
      hostEl.querySelector('#lbl-pm').textContent = state.M.toFixed(1);
      hostEl.querySelector('#lbl-pmm').textContent = state.m.toFixed(2);
      hostEl.querySelector('#lbl-pl').textContent = state.L.toFixed(2);
      hostEl.querySelector('#lbl-pkp').textContent = String(state.Kp);
    }

    inpM.oninput = () => { state.M = parseFloat(inpM.value); syncLabels(); };
    inpMm.oninput = () => { state.m = parseFloat(inpMm.value); syncLabels(); };
    inpL.oninput = () => { state.L = parseFloat(inpL.value); syncLabels(); };
    inpKp.oninput = () => { state.Kp = parseFloat(inpKp.value); syncLabels(); };
    inpMode.onchange = () => { state.mode = inpMode.value; };

    hostEl.querySelector('#btn-pen-disturb').onclick = () => {
      state.omega += 1.8;
      state.vx -= 0.6;
    };
    hostEl.querySelector('#btn-pen-reset').onclick = () => {
      state.x = 0; state.vx = 0; state.theta = 0.05; state.omega = 0;
    };
    hostEl.querySelector('#btn-pen-export-m').onclick = () => {
      const script = generateMatlabForPendulum(state);
      copyTextToClipboard(script, 'Đã copy script MATLAB xe trượt con lắc ngược!');
    };

    syncLabels();

    let lastTs = performance.now();
    function loop(ts) {
      const dt = Math.min((ts - lastTs) / 1000, 0.03);
      lastTs = ts;

      // Dynamics Integration
      const g = 9.81;
      let F = 0;

      if (state.mode === 'auto') {
        // State feedback control: F = - (k_x * x + k_v * vx + k_th * theta + k_w * omega)
        const kth = state.Kp;
        const kw = state.Kp * 0.18;
        const kx = 12.0;
        const kv = 14.0;
        F = -(kx * state.x + kv * state.vx + kth * state.theta + kw * state.omega);
        F = clamp(F, -80, 80);
      }

      // Non-linear equations of motion
      const sinTh = Math.sin(state.theta);
      const cosTh = Math.cos(state.theta);
      const I = (1/3) * state.m * state.L * state.L;

      const d11 = state.M + state.m;
      const d12 = state.m * state.L * cosTh;
      const d21 = state.m * state.L * cosTh;
      const d22 = I + state.m * state.L * state.L;

      const b1 = F + state.m * state.L * state.omega * state.omega * sinTh;
      const b2 = state.m * g * state.L * sinTh;

      const det = d11 * d22 - d12 * d21;
      const ax = (d22 * b1 - d12 * b2) / det;
      const alpha = (-d21 * b1 + d11 * b2) / det;

      state.vx += ax * dt;
      state.x += state.vx * dt;
      state.omega += alpha * dt;
      state.theta += state.omega * dt;

      // Friction
      state.vx *= 0.998;
      state.omega *= 0.998;
      state.x = clamp(state.x, -1.2, 1.2);

      const deg = (state.theta * 180 / Math.PI);
      const badge = hostEl.querySelector('#pen-angle-badge');
      if (badge) badge.textContent = `θ = ${deg.toFixed(1)}°`;

      const { ctx, width, height } = setupHiDPICanvas(canvas);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Track line
      const trackY = height * 0.72;
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(30, trackY);
      ctx.lineTo(width - 30, trackY);
      ctx.stroke();

      // Convert x (m) to pixels
      const scale = width / 3.0;
      const cartX = width / 2 + state.x * scale;
      const cartW = 100, cartH = 45;

      // Cart wheels
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(cartX - 30, trackY - 10, 10, 0, TWO_PI);
      ctx.arc(cartX + 30, trackY - 10, 10, 0, TWO_PI);
      ctx.fill();

      // Cart body
      ctx.fillStyle = '#2563eb';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.fillRect(cartX - cartW/2, trackY - cartH - 10, cartW, cartH);
      ctx.strokeRect(cartX - cartW/2, trackY - cartH - 10, cartW, cartH);

      // Pivot
      const pivotX = cartX;
      const pivotY = trackY - cartH - 10;

      // Pendulum rod
      const rodLenPx = state.L * scale * 1.6;
      // theta = 0 is straight UP
      const bobX = pivotX + rodLenPx * Math.sin(state.theta);
      const bobY = pivotY - rodLenPx * Math.cos(state.theta);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      // Pendulum Bob
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(bobX, bobY, 14, 0, TWO_PI);
      ctx.fill();
      ctx.stroke();

      // Pivot dot
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 6, 0, TWO_PI);
      ctx.fill();

      // Force Arrow
      if (Math.abs(F) > 2) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        const arrowLen = clamp(F * 1.5, -60, 60);
        ctx.beginPath();
        ctx.moveTo(cartX, trackY - cartH/2 - 10);
        ctx.lineTo(cartX + arrowLen, trackY - cartH/2 - 10);
        ctx.stroke();
      }

      labAnimFrameId = requestAnimationFrame(loop);
    }
    labAnimFrameId = requestAnimationFrame(loop);
  }

  function generateMatlabForPendulum(state) {
    return `% =========================================================================
% MechaStudy VNU - Mô Phỏng Xe Trượt Con Lắc Ngược & Thiết Kế LQR
% Khoa Cơ học kỹ thuật và Tự động hóa - Trường ĐH Công nghệ, ĐHQGHN
% =========================================================================
clc; clear; close all;

M = ${state.M};    % Khối lượng xe trượt (kg)
m = ${state.m};    % Khối lượng con lắc (kg)
L = ${state.L};    % Chiều dài con lắc (m)
g = 9.81;   % Gia tốc trọng trường (m/s^2)
I = (1/3)*m*L^2;

%% 1. KHÔNG GIAN TRẠNG THÁI TUYẾN TÍNH HÓA (x = [pos; vel; theta; omega])
p = I*(M + m) + M*m*L^2;
A = [0      1              0           0;
     0      0        -(m^2*g*L^2)/p    0;
     0      0              0           1;
     0      0         m*g*L*(M+m)/p    0];

B = [0; (I + m*L^2)/p; 0; -(m*L)/p];
C = eye(4);
D = zeros(4,1);

sys = ss(A, B, C, D);

%% 2. THIẾT KẾ BỘ ĐIỀU KHIỂN PHẢN HỒI LQR
Q = diag([10, 1, 100, 10]); % Trọng số phạt sai số
R = 0.01;                   % Trọng số năng lượng điều khiển
K = lqr(A, B, Q, R);
fprintf('Vecto độ lợi LQR: K = [%.2f, %.2f, %.2f, %.2f]\\n', K(1), K(2), K(3), K(4));

%% 3. MÔ PHỎNG ĐÁP ỨNG HỆ KÍN KHI CÓ NHIỄU BAN ĐẦU
sys_cl = ss(A - B*K, zeros(4,1), C, D);
t = 0:0.01:6;
x0 = [0; 0; 0.15; 0]; % Góc lệch ban đầu ~8.6 độ

[y, t] = initial(sys_cl, x0, t);

figure('Name', 'Mo phong Xe truot Con lac nguoc VNU', 'Color', 'w');
subplot(2,1,1);
plot(t, y(:,1), 'b-', 'LineWidth', 2); grid on;
title('Vị trí xe trượt x(t)'); xlabel('t (s)'); ylabel('x (m)');
subplot(2,1,2);
plot(t, y(:,3)*180/pi, 'r-', 'LineWidth', 2); grid on;
title('Góc nghiêng con lắc \\theta(t)'); xlabel('t (s)'); ylabel('\\theta (độ)');
`;
  }

  /* --------------------------------------------------------------------------
     LAB 4: MẠCH OP-AMP & MÁY HIỆN SÓNG ẢO (OSCILLOSCOPE)
     -------------------------------------------------------------------------- */
  function renderLabOpAmp(hostEl) {
    hostEl.innerHTML = `
      <div class="lab-grid">
        <div class="lab-view-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <strong style="font-size:0.95rem;">⚡ Máy Hiện Sóng Ảo 2 Kênh (Dual-Channel Scope)</strong>
            <div style="font-size:0.8rem; display:flex; gap:10px;">
              <span style="color:#eab308;">■ CH1: Vin</span>
              <span style="color:#06b6d4;">■ CH2: Vout</span>
            </div>
          </div>
          <canvas class="lab-canvas" id="canvas-opamp"></canvas>
          <div style="margin-top:8px; display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-muted);">
            <span id="opamp-gain-badge" class="lab-info-badge">Hệ số KĐ Av = -3.0</span>
            <span id="opamp-fc-badge" class="lab-info-badge">Tần số cắt fc = 1.59 kHz</span>
          </div>
        </div>

        <div class="lab-ctrl-card">
          <div class="lab-ctrl-title">
            <span>Cấu Hình Mạch Thuật Toán</span>
            <span class="lab-info-badge">Kỹ thuật Điện tử</span>
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Cấu hình mạch Op-Amp:</span></div>
            <select id="opamp-mode" style="width:100%; padding:6px; border-radius:6px; margin-bottom:8px;">
              <option value="inverting">Mạch Khuếch Đại Đảo (Inverting Amplifier)</option>
              <option value="noninverting">Mạch Khuếch Đại Không Đảo (Non-Inverting)</option>
              <option value="lowpass">Bộ Lọc Thông Thấp Tích Cực (Active Low-Pass)</option>
              <option value="integrator">Mạch Tích Phân Thuật Toán (Integrator)</option>
            </select>
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Tần số tín hiệu vào f (Hz):</span> <strong id="lbl-of">200</strong></div>
            <input type="range" class="lab-slider-input" id="inp-of" min="20" max="2000" step="20" value="200">
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Biên độ vào Vin (V):</span> <strong id="lbl-ov">1.0</strong></div>
            <input type="range" class="lab-slider-input" id="inp-ov" min="0.2" max="5.0" step="0.2" value="1.0">
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Điện trở R1 (kΩ):</span> <strong id="lbl-or1">10</strong></div>
            <input type="range" class="lab-slider-input" id="inp-or1" min="1" max="50" step="1" value="10">
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Điện trở hồi tiếp R2 (kΩ):</span> <strong id="lbl-or2">30</strong></div>
            <input type="range" class="lab-slider-input" id="inp-or2" min="1" max="100" step="2" value="30">
          </div>

          <div class="lab-slider-group" id="group-cap">
            <div class="lab-slider-label"><span>Tụ điện lọc C (nF):</span> <strong id="lbl-oc">10</strong></div>
            <input type="range" class="lab-slider-input" id="inp-oc" min="1" max="100" step="1" value="10">
          </div>

          <div class="lab-btn-row">
            <button type="button" class="btn-primary btn-sm" id="btn-opamp-export-m" style="width:100%;">
              📋 Xuất mã phân tích đáp ứng MATLAB (.m)
            </button>
          </div>
        </div>
      </div>

      <div class="lab-theory-card" style="margin-top:16px;">
        <h4>📐 Công Thức Mạch Op-Amp & Bộ Lọc Tích Cực Chuẩn VNU-UET</h4>
        <p>
          - <strong>Khuếch đại đảo:</strong> \(V_{out} = -\frac{R_2}{R_1} V_{in}\) (Lệch pha \(180^\circ\)).<br>
          - <strong>Khuếch đại không đảo:</strong> \(V_{out} = \left(1 + \frac{R_2}{R_1}\right) V_{in}\) (Đồng pha).<br>
          - <strong>Bộ lọc thông thấp (Low-pass Filter):</strong> Tần số cắt \(f_c = \frac{1}{2\pi R_2 C}\). Khi \(f > f_c\), biên độ suy giảm \(20\text{ dB/decade}\).
        </p>
      </div>
    `;

    const canvas = hostEl.querySelector('#canvas-opamp');
    const state = {
      mode: 'inverting',
      f: 200,
      vin: 1.0,
      R1: 10,
      R2: 30,
      C: 10,
      t: 0
    };

    const inpMode = hostEl.querySelector('#opamp-mode');
    const inpF = hostEl.querySelector('#inp-of');
    const inpV = hostEl.querySelector('#inp-ov');
    const inpR1 = hostEl.querySelector('#inp-or1');
    const inpR2 = hostEl.querySelector('#inp-or2');
    const inpC = hostEl.querySelector('#inp-oc');

    function syncLabels() {
      hostEl.querySelector('#lbl-of').textContent = state.f;
      hostEl.querySelector('#lbl-ov').textContent = state.vin.toFixed(1);
      hostEl.querySelector('#lbl-or1').textContent = state.R1;
      hostEl.querySelector('#lbl-or2').textContent = state.R2;
      hostEl.querySelector('#lbl-oc').textContent = state.C;

      let gain = 1;
      let fcStr = '--';

      if (state.mode === 'inverting') {
        gain = -(state.R2 / state.R1);
      } else if (state.mode === 'noninverting') {
        gain = 1 + (state.R2 / state.R1);
      } else if (state.mode === 'lowpass') {
        const fc = 1 / (2 * Math.PI * (state.R2 * 1e3) * (state.C * 1e-9));
        gain = -(state.R2 / state.R1) / Math.sqrt(1 + Math.pow(state.f / fc, 2));
        fcStr = `fc = ${(fc / 1000).toFixed(2)} kHz`;
      } else if (state.mode === 'integrator') {
        gain = 1 / (2 * Math.PI * state.f * (state.R1 * 1e3) * (state.C * 1e-9));
      }

      hostEl.querySelector('#opamp-gain-badge').textContent = `Độ lợi Av = ${gain.toFixed(2)}`;
      hostEl.querySelector('#opamp-fc-badge').textContent = fcStr;
    }

    inpMode.onchange = () => { state.mode = inpMode.value; syncLabels(); };
    inpF.oninput = () => { state.f = parseFloat(inpF.value); syncLabels(); };
    inpV.oninput = () => { state.vin = parseFloat(inpV.value); syncLabels(); };
    inpR1.oninput = () => { state.R1 = parseFloat(inpR1.value); syncLabels(); };
    inpR2.oninput = () => { state.R2 = parseFloat(inpR2.value); syncLabels(); };
    inpC.oninput = () => { state.C = parseFloat(inpC.value); syncLabels(); };

    hostEl.querySelector('#btn-opamp-export-m').onclick = () => {
      const script = generateMatlabForOpAmp(state);
      copyTextToClipboard(script, 'Đã copy script MATLAB phân tích mạch Op-Amp!');
    };

    syncLabels();

    let lastTs = performance.now();
    function loop(ts) {
      const dt = Math.min((ts - lastTs) / 1000, 0.03);
      lastTs = ts;
      state.t += dt;

      const { ctx, width, height } = setupHiDPICanvas(canvas);

      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Oscilloscope Graticule Grid (8 divisions high, 10 wide)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const stepX = width / 10;
      const stepY = height / 8;
      for (let x = 0; x <= width; x += stepX) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y <= height; y += stepY) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // Center crosshairs
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2);
      ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height);
      ctx.stroke();

      // Signal synthesis
      const samples = width;
      const timeWindow = 0.015; // 15 ms display
      const vScale = (height / 8) / 2.0; // 2V per division

      // CH1 (Vin - Yellow)
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let px = 0; px < samples; px++) {
        const simT = state.t + (px / samples) * timeWindow;
        const vIn = state.vin * Math.sin(TWO_PI * state.f * simT);
        const py = height / 2 - vIn * vScale;
        if (px === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // CH2 (Vout - Cyan)
      let gain = 1, phase = 0;
      if (state.mode === 'inverting') {
        gain = -(state.R2 / state.R1);
      } else if (state.mode === 'noninverting') {
        gain = 1 + (state.R2 / state.R1);
      } else if (state.mode === 'lowpass') {
        const fc = 1 / (2 * Math.PI * (state.R2 * 1e3) * (state.C * 1e-9));
        gain = -(state.R2 / state.R1) / Math.sqrt(1 + Math.pow(state.f / fc, 2));
        phase = -Math.atan(state.f / fc);
      } else if (state.mode === 'integrator') {
        gain = 1 / (2 * Math.PI * state.f * (state.R1 * 1e3) * (state.C * 1e-9));
        phase = Math.PI / 2;
      }

      // Saturation at ±12V opamp rail
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let px = 0; px < samples; px++) {
        const simT = state.t + (px / samples) * timeWindow;
        let vOut = state.vin * gain * Math.sin(TWO_PI * state.f * simT + phase);
        vOut = clamp(vOut, -12, 12);
        const py = height / 2 - vOut * vScale;
        if (px === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Overlay readouts
      ctx.fillStyle = '#f8fafc';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText(`CH1: 2V/div (${state.vin}V pk)`, 14, 22);
      ctx.fillText(`CH2: 2V/div (Av: ${gain.toFixed(2)})`, 14, 40);
      ctx.fillText(`TIME: ${(timeWindow*1000/10).toFixed(1)}ms/div`, width - 150, 22);

      labAnimFrameId = requestAnimationFrame(loop);
    }
    labAnimFrameId = requestAnimationFrame(loop);
  }

  function generateMatlabForOpAmp(state) {
    return `% =========================================================================
% MechaStudy VNU - Phân Tích Mạch Op-Amp & Đáp Ứng Tần Số (Bode)
% Khoa Cơ học kỹ thuật và Tự động hóa - VNU-UET
% =========================================================================
clc; clear; close all;

R1 = ${state.R1}e3; % Ohm
R2 = ${state.R2}e3; % Ohm
C = ${state.C}e-9;   % Farad

s = tf('s');

% Hàm truyền đạt bộ lọc tích cực: H(s) = -(R2/R1) / (1 + s*R2*C)
H = -(R2/R1) / (1 + s*R2*C);

fc = 1 / (2*pi*R2*C);
fprintf('Tần số cắt fc = %.2f Hz\\n', fc);

figure('Name', 'Dap ung tan so Mach Op-Amp VNU', 'Color', 'w');
bode(H); grid on;
title('Biểu đồ Bode: Biên độ (dB) và Pha (độ) của Mạch Op-Amp');
`;
  }

  /* --------------------------------------------------------------------------
     LAB 5: ĐIỀU KHIỂN VẬN TỐC & VỊ TRÍ ĐỘNG CƠ DC VỚI PID
     -------------------------------------------------------------------------- */
  function renderLabDCMotor(hostEl) {
    hostEl.innerHTML = `
      <div class="lab-grid">
        <div class="lab-view-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <strong style="font-size:0.95rem;">🎯 Đĩa Quay Động Cơ & Đường Cong Đáp Ứng Bước (Step)</strong>
            <button type="button" class="btn-sm" id="btn-dc-step">⚡ Phát xung bước (Step)</button>
          </div>
          <canvas class="lab-canvas" id="canvas-dcmotor"></canvas>
          <div style="margin-top:8px; display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-muted);">
            <span id="dc-perf-badge">Thời gian xác lập ts = 0.45s</span>
            <span id="dc-overshoot-badge" class="lab-info-badge">Độ quá điều chỉnh Mp = 8.2%</span>
          </div>
        </div>

        <div class="lab-ctrl-card">
          <div class="lab-ctrl-title">
            <span>Chỉnh Định Bộ Điều Khiển PID</span>
            <span class="lab-info-badge">DC Motor Servo</span>
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Mục tiêu điều khiển:</span></div>
            <select id="dc-target-mode" style="width:100%; padding:6px; border-radius:6px; margin-bottom:8px;">
              <option value="speed">Điều khiển Vận tốc quay (RPM)</option>
              <option value="position">Điều khiển Vị trí góc quay (Góc θ)</option>
            </select>
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Giá trị đặt (Set-point):</span> <strong id="lbl-dsp">1000</strong></div>
            <input type="range" class="lab-slider-input" id="inp-dsp" min="100" max="2500" step="50" value="1000">
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Hệ số tỉ lệ Kp:</span> <strong id="lbl-dkp">1.20</strong></div>
            <input type="range" class="lab-slider-input" id="inp-dkp" min="0.1" max="8.0" step="0.1" value="1.2">
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Hệ số tích phân Ki:</span> <strong id="lbl-dki">0.80</strong></div>
            <input type="range" class="lab-slider-input" id="inp-dki" min="0.0" max="5.0" step="0.1" value="0.8">
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Hệ số vi phân Kd:</span> <strong id="lbl-dkd">0.05</strong></div>
            <input type="range" class="lab-slider-input" id="inp-dkd" min="0.0" max="0.5" step="0.01" value="0.05">
          </div>

          <div class="lab-slider-group">
            <div class="lab-slider-label"><span>Mô men cản phụ tải TL (N·m):</span> <strong id="lbl-dtl">0.0</strong></div>
            <input type="range" class="lab-slider-input" id="inp-dtl" min="0.0" max="1.5" step="0.1" value="0.0">
          </div>

          <div class="lab-btn-row">
            <button type="button" class="btn-primary btn-sm" id="btn-dc-export-m" style="width:100%;">
              📋 Xuất mã tinh chỉnh PID MATLAB (.m)
            </button>
          </div>
        </div>
      </div>

      <div class="lab-theory-card" style="margin-top:16px;">
        <h4>📐 Hàm Truyền Đạt Động Cơ DC & Chỉnh Định PID (Ziegler-Nichols)</h4>
        <p>
          Mô hình cơ điện kết hợp: \(J \frac{d\omega}{dt} + b \omega = K_t i - T_L\) và \(L_a \frac{di}{dt} + R_a i = u - K_e \omega\).<br>
          Hàm truyền đạt vận tốc: \(G(s) = \frac{\Omega(s)}{U(s)} = \frac{K_t}{(J s + b)(L_a s + R_a) + K_t K_e}\).<br>
          - \(K_p\): Tăng tốc độ đáp ứng, giảm sai số xác lập nhưng tăng độ vọt lố.<br>
          - \(K_i\): Triệt tiêu hoàn toàn sai số xác lập (\(e_{ss} \to 0\)) khi có tải cản \(T_L\).<br>
          - \(K_d\): Giảm độ vọt lố \(M_p\) và tăng độ ổn định của hệ thống.
        </p>
      </div>
    `;

    const canvas = hostEl.querySelector('#canvas-dcmotor');
    let stepPlot = [];

    const state = {
      mode: 'speed',
      sp: 1000,
      Kp: 1.2,
      Ki: 0.8,
      Kd: 0.05,
      TL: 0.0,
      omega: 0,
      theta: 0,
      integral: 0,
      lastErr: 0,
      t: 0
    };

    const inpMode = hostEl.querySelector('#dc-target-mode');
    const inpSp = hostEl.querySelector('#inp-dsp');
    const inpKp = hostEl.querySelector('#inp-dkp');
    const inpKi = hostEl.querySelector('#inp-dki');
    const inpKd = hostEl.querySelector('#inp-dkd');
    const inpTL = hostEl.querySelector('#inp-dtl');

    function syncLabels() {
      hostEl.querySelector('#lbl-dsp').textContent = state.sp;
      hostEl.querySelector('#lbl-dkp').textContent = state.Kp.toFixed(2);
      hostEl.querySelector('#lbl-dki').textContent = state.Ki.toFixed(2);
      hostEl.querySelector('#lbl-dkd').textContent = state.Kd.toFixed(2);
      hostEl.querySelector('#lbl-dtl').textContent = state.TL.toFixed(1);
    }

    inpMode.onchange = () => {
      state.mode = inpMode.value;
      if (state.mode === 'position') {
        state.sp = 180;
        inpSp.min = 30; inpSp.max = 360; inpSp.step = 10; inpSp.value = 180;
      } else {
        state.sp = 1000;
        inpSp.min = 100; inpSp.max = 2500; inpSp.step = 50; inpSp.value = 1000;
      }
      syncLabels();
    };
    inpSp.oninput = () => { state.sp = parseFloat(inpSp.value); syncLabels(); };
    inpKp.oninput = () => { state.Kp = parseFloat(inpKp.value); syncLabels(); };
    inpKi.oninput = () => { state.Ki = parseFloat(inpKi.value); syncLabels(); };
    inpKd.oninput = () => { state.Kd = parseFloat(inpKd.value); syncLabels(); };
    inpTL.oninput = () => { state.TL = parseFloat(inpTL.value); syncLabels(); };

    hostEl.querySelector('#btn-dc-step').onclick = () => {
      state.omega = 0;
      state.theta = 0;
      state.integral = 0;
      state.lastErr = 0;
      stepPlot = [];
    };
    hostEl.querySelector('#btn-dc-export-m').onclick = () => {
      const script = generateMatlabForDCMotor(state);
      copyTextToClipboard(script, 'Đã copy script MATLAB tinh chỉnh PID động cơ DC!');
    };

    syncLabels();

    let lastTs = performance.now();
    function loop(ts) {
      const dt = Math.min((ts - lastTs) / 1000, 0.03);
      lastTs = ts;

      // Motor parameters
      const J = 0.015, b = 0.02, Kt = 0.08, Ke = 0.08, Ra = 1.2;

      // Current feedback
      const currentVal = state.mode === 'speed' ? state.omega * (60 / TWO_PI) : state.theta * (180 / Math.PI);
      const err = state.sp - currentVal;
      state.integral += err * dt;
      state.integral = clamp(state.integral, -1000, 1000);
      const deriv = (err - state.lastErr) / dt;
      state.lastErr = err;

      // PID voltage output
      let u = state.Kp * err * 0.05 + state.Ki * state.integral * 0.01 + state.Kd * deriv * 0.05;
      u = clamp(u, -24, 24); // Saturation 24V

      // Motor dynamics: J * domega/dt + b * omega = Kt * (u - Ke*omega)/Ra - TL
      const dOmega = (Kt * (u - Ke * state.omega) / Ra - b * state.omega - state.TL) / J;
      state.omega = Math.max(0, state.omega + dOmega * dt);
      state.theta = (state.theta + state.omega * dt);

      stepPlot.push(currentVal);
      if (stepPlot.length > 280) stepPlot.shift();

      const { ctx, width, height } = setupHiDPICanvas(canvas);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Left 35%: Rotating Motor Disc with Encoder
      const splitX = width * 0.35;
      const cx = splitX / 2;
      const cy = height / 2;
      const r = Math.min(cx, cy) * 0.72;

      // Stator housing
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(cx, cy, r + 16, 0, TWO_PI);
      ctx.fill();

      // Rotor disc
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TWO_PI);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Optical encoder tick marks
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      for (let a = 0; a < TWO_PI; a += TWO_PI / 16) {
        const tx1 = cx + (r - 12) * Math.cos(state.theta + a);
        const ty1 = cy + (r - 12) * Math.sin(state.theta + a);
        const tx2 = cx + r * Math.cos(state.theta + a);
        const ty2 = cy + r * Math.sin(state.theta + a);
        ctx.beginPath(); ctx.moveTo(tx1, ty1); ctx.lineTo(tx2, ty2); ctx.stroke();
      }

      // Center shaft & marker
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + r * Math.cos(state.theta), cy + r * Math.sin(state.theta));
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, TWO_PI);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(currentVal)} ${state.mode === 'speed' ? 'RPM' : '°'}`, cx, cy + r + 32);
      ctx.textAlign = 'left';

      // Right 65%: Step Response Graph
      const gw = width - splitX - 30;
      const gh = height - 60;
      const gx = splitX + 15;
      const gy = 30;

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.strokeRect(gx, gy, gw, gh);

      // Set-point dotted line
      const spY = gy + gh - (state.sp / (state.sp * 1.5)) * gh;
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(gx, spY); ctx.lineTo(gx + gw, spY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ef4444';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText(`Target: ${state.sp}`, gx + 8, spY - 6);

      // Step response curve
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i < stepPlot.length; i++) {
        const px = gx + (i / 280) * gw;
        const py = gy + gh - (stepPlot[i] / (state.sp * 1.5)) * gh;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      labAnimFrameId = requestAnimationFrame(loop);
    }
    labAnimFrameId = requestAnimationFrame(loop);
  }

  function generateMatlabForDCMotor(state) {
    return `% =========================================================================
% MechaStudy VNU - Mô Phỏng & Tinh Chỉnh Bộ Điều Khiển PID Cho Động Cơ DC
% Khoa Cơ học kỹ thuật và Tự động hóa - Trường ĐH Công nghệ (VNU-UET)
% =========================================================================
clc; clear; close all;

%% 1. THAM SỐ ĐỘNG CƠ DC
J = 0.015;  % Mô men quán tính rô to (kg.m^2)
b = 0.02;   % Hệ số ma sát nhớt (N.m.s)
Kt = 0.08;  % Hằng số mô men (N.m/A)
Ke = 0.08;  % Hằng số suất điện động phản hồi (V.s/rad)
Ra = 1.2;   % Điện trở phần ứng (Ohm)
La = 0.005; % Điện cảm phần ứng (H)

s = tf('s');
% Hàm truyền đạt hở: G(s) = Omega(s) / V(s)
G = Kt / ((J*s + b)*(La*s + Ra) + Kt*Ke);

%% 2. THIẾT KẾ BỘ ĐIỀU KHIỂN PID
Kp = ${state.Kp};
Ki = ${state.Ki};
Kd = ${state.Kd};

C = pid(Kp, Ki, Kd);

% Hệ kín có phản hồi âm đơn vị
T = feedback(C*G, 1);

%% 3. KHẢO SÁT ĐÁP ỨNG BƯỚC (STEP RESPONSE)
figure('Name', 'Dap ung buoc Dong co DC - VNU', 'Color', 'w');
step(${state.sp} * T); grid on;
title(sprintf('Đáp ứng bước hệ kín PID (Kp=%.2f, Ki=%.2f, Kd=%.2f)', Kp, Ki, Kd));
xlabel('Thời gian t (giây)'); ylabel('Vận tốc góc \\omega (RPM)');

% Thông số chỉ tiêu chất lượng
info = stepinfo(T);
fprintf('Thời gian tăng tr = %.3f s\\n', info.RiseTime);
fprintf('Thời gian xác lập ts = %.3f s\\n', info.SettlingTime);
fprintf('Độ quá điều chỉnh Mp = %.2f%%\\n', info.Overshoot);
`;
  }

  /* ==========================================================================
     4. MATLAB & PYTHON STUDIO WORKSPACE
     ========================================================================== */

  const MATLAB_TEMPLATES = [
    {
      id: 'stat_truss',
      name: 'Tĩnh học: Cân bằng giàn & Phản lực liên kết',
      monHoc: 'Cơ kỹ thuật 1',
      desc: 'Giải hệ phương trình cân bằng tĩnh học (FBD), tính phản lực gối đỡ và nội lực thanh giàn',
      generate: () => `% =========================================================================
% MechaStudy VNU - Giải Hệ Cân Bằng Tĩnh Học & Phản Lực Gối Tựa
% Khoa Cơ học kỹ thuật và Tự động hóa - VNU-UET
% =========================================================================
clc; clear; close all;

% Giả sử dầm chịu lực tập trung F và mô men M
L = 4.0;      % Chiều dài dầm (m)
F1 = 12.0;    % Lực tập trung tại x = 2m (kN)
M0 = 8.0;     % Mô men tập trung tại x = 3m (kN.m)
q = 3.0;      % Tải phân bố đều từ x=0 đến x=2m (kN/m)

% Cân bằng mô men tại điểm A (gối cố định):
% sum(M_A) = 0 => RB*L - F1*2 - M0 - q*2*1 = 0
RB = (F1*2 + M0 + q*2*1) / L;

% Cân bằng lực theo phương Y:
% sum(Fy) = 0 => RA + RB - F1 - q*2 = 0
RA = F1 + q*2 - RB;

fprintf('Phản lực tại gối tựa A: RA = %.2f kN\\n', RA);
fprintf('Phản lực tại gối tựa B: RB = %.2f kN\\n', RB);

% Vẽ biểu đồ lực cắt Q(x) và mô men uốn M(x)
x = linspace(0, L, 500);
Q = zeros(size(x));
M = zeros(size(x));

for i = 1:length(x)
    xi = x(i);
    q_load = q * min(xi, 2.0);
    f_load = (xi >= 2.0) * F1;
    Q(i) = RA - q_load - f_load;
end

figure('Name', 'Bieu do Noi luc Dam VNU', 'Color', 'w');
subplot(2,1,1);
plot(x, Q, 'b-', 'LineWidth', 2); grid on;
title('Biểu đồ lực cắt Q(x) [kN]'); xlabel('x (m)'); ylabel('Q (kN)');
`
    },
    {
      id: 'ode_lagrange',
      name: 'Động lực học: Giải vi phân phương trình Lagrange',
      monHoc: 'Cơ kỹ thuật 2',
      desc: 'Thiết lập phương trình Lagrange loại II và giải vi phân quỹ đạo bằng ode45',
      generate: () => `% =========================================================================
% MechaStudy VNU - Giải Phương Trình Lagrange Loại II Bằng ode45
% Khoa Cơ học kỹ thuật và Tự động hóa - VNU-UET
% =========================================================================
clc; clear; close all;

% Phương trình con lắc vật lý phi tuyến: theta'' + (g/L)*sin(theta) + b*theta' = 0
g = 9.81; L = 0.8; b = 0.25;

dydt = @(t, y) [y(2); -(g/L)*sin(y(1)) - b*y(2)];

tspan = [0 10];
y0 = [pi/3; 0]; % Góc ban đầu 60 độ

[t, y] = ode45(dydt, tspan, y0);

figure('Name', 'Giai Lagrange ode45 VNU', 'Color', 'w');
plot(t, y(:,1)*180/pi, 'r-', 'LineWidth', 2); grid on;
title('Dao động con lắc phi tuyến (Nghiệm Lagrange loại II)');
xlabel('Thời gian t (giây)'); ylabel('Góc nghiêng \\theta (độ)');
`
    },
    {
      id: 'control_bode_pid',
      name: 'Lý thuyết điều khiển: Đồ thị Bode & Thiết kế PID',
      monHoc: 'Lý thuyết Điều khiển tự động',
      desc: 'Khảo sát hàm truyền G(s), độ dự trữ biên độ/pha và đóng vòng kín PID',
      generate: () => `% =========================================================================
% MechaStudy VNU - Phân Tích Hệ Thống Điều Khiển & Thiết Kế PID
% Khoa Cơ học kỹ thuật và Tự động hóa - Trường ĐH Công nghệ
% =========================================================================
clc; clear; close all;

s = tf('s');
% Hàm truyền đối tượng điều khiển (vd: lò nhiệt hoặc vị trí động cơ)
G = 2.5 / (s^3 + 3*s^2 + 4*s + 2);

% 1. Khảo sát ổn định hệ hở
figure('Name', 'Bode & Root Locus VNU', 'Color', 'w');
subplot(1,2,1);
bode(G); grid on;
title('Đồ thị Bode hệ hở G(s)');
subplot(1,2,2);
rlocus(G); grid on;
title('Quỹ đạo nghiệm số (Root Locus)');

% 2. Bộ điều khiển PID
C = pid(4.5, 2.0, 0.8);
T = feedback(C*G, 1);

figure('Name', 'Dap ung he kin PID', 'Color', 'w');
step(T); grid on;
title('Đáp ứng bước hệ kín có bộ điều khiển PID');
`
    }
  ];

  let currentTemplateId = 'stat_truss';

  function initMatlabStudio() {
    injectLabsStyles();
    const wsEl = document.getElementById('mecha-matlab-workspace');
    if (!wsEl) return;

    wsEl.innerHTML = `
      <div class="matlab-studio-wrap">
        <div class="lab-header-card">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.3rem;">💻</span>
              <strong style="font-size:1.1rem; color:var(--primary);">MATLAB & Python Studio (VNU-UET Mechatronics)</strong>
              <span class="s2-badge" style="background:#0e8a9a; color:#fff;">Code Generator</span>
            </div>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">
              Sinh mã nguồn chuẩn hóa (.m và .py) phục vụ học tập, giải bài tập lớn và làm báo cáo thực hành môn học.
            </p>
          </div>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn-primary btn-sm" id="btn-studio-copy">📋 Copy toàn bộ mã</button>
            <button type="button" class="btn-sm" id="btn-studio-download">💾 Tải file .m</button>
          </div>
        </div>

        <div>
          <div style="font-weight:700; font-size:0.9rem; margin-bottom:8px; color:var(--text-main);">
            Chọn chuyên đề Cơ điện tử cần xuất mã:
          </div>
          <div class="matlab-preset-grid">
            ${MATLAB_TEMPLATES.map(t => `
              <div class="matlab-preset-card ${t.id === currentTemplateId ? 'active' : ''}" data-tid="${t.id}">
                <div style="font-weight:700; font-size:0.88rem; color:var(--primary); margin-bottom:4px;">
                  ${t.name}
                </div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">
                  Môn: <strong>${t.monHoc}</strong>
                </div>
                <div style="font-size:0.8rem; line-height:1.4;">${t.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="position:relative;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="font-size:0.88rem; color:var(--primary);">Mã nguồn MATLAB / Octave (.m):</strong>
            <span style="font-size:0.78rem; color:var(--text-muted);">Tương thích hoàn toàn với MATLAB R2020a – R2026</span>
          </div>
          <div class="matlab-code-area" id="studio-code-display"></div>
        </div>
      </div>
    `;

    const displayEl = wsEl.querySelector('#studio-code-display');

    function updateCode() {
      const tmpl = MATLAB_TEMPLATES.find(t => t.id === currentTemplateId) || MATLAB_TEMPLATES[0];
      const code = tmpl.generate();
      displayEl.textContent = code;
    }

    wsEl.querySelectorAll('.matlab-preset-card').forEach(card => {
      card.addEventListener('click', () => {
        currentTemplateId = card.getAttribute('data-tid');
        wsEl.querySelectorAll('.matlab-preset-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        updateCode();
      });
    });

    wsEl.querySelector('#btn-studio-copy').onclick = () => {
      copyTextToClipboard(displayEl.textContent, 'Đã copy mã MATLAB Studio vào bộ nhớ tạm!');
    };

    wsEl.querySelector('#btn-studio-download').onclick = () => {
      const blob = new Blob([displayEl.textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vnu_mecha_${currentTemplateId}.m`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    updateCode();
  }

  function copyTextToClipboard(text, successMsg) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (window.MechaStage5?.showToast) {
        window.MechaStage5.showToast(successMsg || 'Đã sao chép thành công!');
      } else {
        alert(successMsg || 'Đã sao chép!');
      }
    }).catch(err => {
      alert('Lỗi sao chép: ' + err.message);
    });
  }

  /* ==========================================================================
     5. XUẤT WINDOW API
     ========================================================================== */

  window.MechaLabs = {
    initWorkspace,
    initMatlabStudio,
    switchLab
  };

})();
