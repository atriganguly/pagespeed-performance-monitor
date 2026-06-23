document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Theme Engineering (Dark/Light Mode) ---
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = themeToggle.querySelector('i');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

  document.body.classList.remove('preload');

  /**
   * Updates the theme toggle icon based on the current active theme state.
   * @param {string} theme - The active theme ('dark' or 'light').
   */
  const updateThemeIcon = (theme) => {
    if (theme === 'dark') {
      themeIcon.classList.replace('fa-moon', 'fa-sun');
    } else {
      themeIcon.classList.replace('fa-sun', 'fa-moon');
    }
  };

  /**
   * Sets the theme attribute on the document element and persists the selection.
   * @param {string} theme - The target theme to apply ('dark' or 'light').
   */
  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcon(theme);
  };

  const currentTheme = localStorage.getItem('theme') || (prefersDarkScheme.matches ? 'dark' : 'light');
  setTheme(currentTheme);

  themeToggle.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  });

  prefersDarkScheme.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });


  // --- 2. Expanded Simulation Grid & UI Telemetry Elements (7 Database Rows) ---
  const mockData = [
    { orgId: "INT-01", org: "Internal", label: "Core", url: "google.com", device: "Mobile", targetScore: 98, lcp: "1.2", cls: "0.01", tbt: "45", inp: "40", status: "PASS", error: false },
    { orgId: "EXT-44", org: "External", label: "Misc", url: "github.com", device: "Desktop", targetScore: 95, lcp: "0.8", cls: "0.00", tbt: "20", inp: "35", status: "PASS", error: false },
    { orgId: "INT-02", org: "Internal", label: "Retail", url: "amazon.com", device: "Mobile", targetScore: 65, lcp: "3.4", cls: "0.25", tbt: "450", inp: "220", status: "FAIL", error: false },
    { orgId: "OTH-99", org: "Other", label: "News", url: "news.ycombinator.com", device: "Desktop", targetScore: 100, lcp: "0.4", cls: "0.00", tbt: "0", inp: "15", status: "PASS", error: false },
    { orgId: "INT-05", org: "Internal", label: "Docs", url: "developer.google.com", device: "Desktop", targetScore: 94, lcp: "0.9", cls: "0.02", tbt: "35", inp: "45", status: "PASS", error: false },
    { orgId: "INT-06", org: "Internal", label: "Cloud", url: "workspace.google.com", device: "Mobile", targetScore: 91, lcp: "1.5", cls: "0.04", tbt: "80", inp: "75", status: "PASS", error: false },
    { orgId: "INT-03", org: "Internal", label: "Dev", url: "internal-domain.local", device: "Mobile", targetScore: "--", lcp: "--", cls: "--", tbt: "--", inp: "--", status: "ERROR", error: true }
  ];

  const simulationContainer = document.getElementById("simulation-rows");
  const simulateBtn = document.getElementById("simulate-btn");
  const progressBarContainer = document.querySelector(".progress-bar-container");
  const progressBar = document.getElementById("progress-bar");
  
  // High-Tech Components Access Nodes
  const gaugeProgress = document.getElementById("gauge-progress");
  const gaugeText = document.getElementById("gauge-text");
  const terminalLog = document.getElementById("terminal-log");
  const terminalStatus = document.getElementById("terminal-status-badge");
  const sreToast = document.getElementById("sre-toast");
  const closeToastBtn = document.getElementById("close-toast-btn");
  const viewEmailBtn = document.getElementById("view-email-btn");
  const emailModal = document.getElementById("email-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");

  let toastDismissTimeout = null;
  let toastTimeRemaining = 7000;
  let toastLastActivated = 0;

  /**
   * Appends execution string logs into the mock terminal dashboard.
   * @param {string} text - The log entry text message.
   * @param {string} typeClass - The style configuration selector variant.
   */
  const logToTerminal = (text, typeClass = "execute-msg") => {
    const timestamp = new Date().toLocaleTimeString();
    const lineHtml = `<div class="log-line ${typeClass}">[${timestamp}] ${text}</div>`;
    terminalLog.insertAdjacentHTML('beforeend', lineHtml);
    terminalLog.scrollTop = terminalLog.scrollHeight;
  };

  /**
   * Driving execution matrix for the circular Lighthouse animation gauge.
   * @param {number|string} score - The evaluation performance value metrics.
   */
  const updateLighthouseGauge = (score) => {
    if (score === "--" || typeof score !== "number") {
      gaugeProgress.style.strokeDasharray = "0, 100";
      gaugeProgress.style.stroke = "var(--border-color)";
      gaugeText.textContent = "--";
      return;
    }
    
    gaugeProgress.style.strokeDasharray = `${score}, 100`;
    gaugeText.textContent = score;

    if (score >= 90) {
      gaugeProgress.style.stroke = "var(--pass-color)";
    } else if (score >= 50) {
      gaugeProgress.style.stroke = "var(--pending-color)";
    } else {
      gaugeProgress.style.stroke = "var(--fail-color)";
    }
  };

  /**
   * Compiles and outputs data rows inside the virtualization view layer.
   * @param {boolean} reset - Flag indicating if cells should be populated or cleared.
   */
  const renderRows = (reset = true) => {
    simulationContainer.innerHTML = "";
    mockData.forEach((row, index) => {
      const displayFormula = `=HYPERLINK("https://${row.url}", "${row.label} Target")`;
      const html = `
        <div class="sheet-row" id="sim-row-${index}">
          <span>${row.orgId}</span>
          <span>${row.org}</span>
          <span>${row.label}</span>
          <span title='Formula Definition: ${displayFormula}' style="cursor:help;"><strong>${row.url}</strong></span>
          <span>${row.device}</span>
          <span class="cell-score">${reset ? '--' : row.targetScore}</span>
          <span class="cell-lcp">${reset ? '--' : row.lcp}</span>
          <span class="cell-cls">${reset ? '--' : row.cls}</span>
          <span class="cell-tbt">${reset ? '--' : row.tbt}</span>
          <span class="cell-inp">${reset ? '--' : row.inp}</span>
          <span><span class="status-badge ${reset ? '' : (row.status === 'PASS' ? 'status-pass' : row.status === 'FAIL' ? 'status-fail' : 'status-error')}">${reset ? 'PENDING' : row.status}</span></span>
          <span class="cell-time">${reset ? '--' : new Date().toLocaleTimeString()}</span>
        </div>
      `;
      simulationContainer.insertAdjacentHTML('beforeend', html);
    });
  };

  renderRows(true);

  // --- 3. Flowchart Animation Sync Engine ---
  const nodes = {
    n1: document.getElementById("node-1"), a1: document.getElementById("arrow-1"),
    n2: document.getElementById("node-2"), a2: document.getElementById("arrow-2"),
    n3: document.getElementById("node-3"), aloop: document.getElementById("arrow-loop"),
    n4: document.getElementById("node-4"), a4: document.getElementById("arrow-4"),
    n5: document.getElementById("node-5"), a5: document.getElementById("arrow-5"),
    n6: document.getElementById("node-6")
  };

  /**
   * Resets status highlights across all diagnostic blueprint nodes.
   */
  const clearHighlights = () => {
    Object.values(nodes).forEach(el => {
      if (el) el.classList.remove("processing-highlight", "timeout-highlight");
    });
  };

  /**
   * Triggers background highlight active states during normal loops.
   */
  const highlightLoop = () => {
    clearHighlights();
    nodes.n2.classList.add("processing-highlight");
    nodes.a2.classList.add("processing-highlight");
    nodes.n3.classList.add("processing-highlight");
    if(window.innerWidth > 768 && nodes.aloop) nodes.aloop.classList.add("processing-highlight");
  };

  /**
   * Triggers timeout routing active configurations for critical visual thresholds.
   */
  const highlightTimeout = () => {
    clearHighlights();
    nodes.n4.classList.add("timeout-highlight");
    nodes.a4.classList.add("timeout-highlight");
    nodes.n5.classList.add("timeout-highlight");
    nodes.a5.classList.add("timeout-highlight");
    nodes.n6.classList.add("timeout-highlight");
  };

  // --- 4. Interactive SRE Emergency Pop-Up Auto-Dismiss Engine ---
  /**
   * Clears visibility flags and active lifecycles from toast overlays.
   */
  const dismissToast = () => {
    sreToast.classList.remove("toast-visible");
    if (toastDismissTimeout) {
      clearTimeout(toastDismissTimeout);
      toastDismissTimeout = null;
    }
  };

  /**
   * Initiates the auto-dismiss timer lifecycle framework.
   * @param {number} duration - The total countdown millisecond length.
   */
  const startToastTimer = (duration) => {
    if (toastDismissTimeout) clearTimeout(toastDismissTimeout);
    toastLastActivated = Date.now();
    toastDismissTimeout = setTimeout(() => {
      dismissToast();
    }, duration);
  };

  closeToastBtn.addEventListener("click", dismissToast);

  sreToast.addEventListener("mouseenter", () => {
    if (toastDismissTimeout) {
      clearTimeout(toastDismissTimeout);
      toastDismissTimeout = null;
      toastTimeRemaining -= (Date.now() - toastLastActivated);
    }
  });

  sreToast.addEventListener("mouseleave", () => {
    if (!toastDismissTimeout && sreToast.classList.contains("toast-visible")) {
      if (toastTimeRemaining < 1000) toastTimeRemaining = 2000;
      startToastTimer(toastTimeRemaining);
    }
  });

  // --- 5. Presentation System Core Simulation Logic ---
  let isSimulating = false;

  simulateBtn.addEventListener("click", async () => {
    if (isSimulating) return;
    isSimulating = true;

    // Reset components back to telemetry baseline
    simulateBtn.disabled = true;
    simulateBtn.textContent = "Executing Relay runner...";
    sreToast.classList.remove("toast-visible");
    if (toastDismissTimeout) clearTimeout(toastDismissTimeout);
    toastTimeRemaining = 7000;
    
    renderRows(true);
    updateLighthouseGauge("--");
    
    terminalLog.innerHTML = "";
    terminalStatus.textContent = "STATUS: INITIALIZING";
    terminalStatus.className = "terminal-status status-running";

    logToTerminal("Executing startDailyScanUI() entry logic pointer...", "system-msg");
    nodes.n1.classList.add("processing-highlight");
    nodes.a1.classList.add("processing-highlight");
    
    await new Promise(r => setTimeout(r, 1000));
    logToTerminal("PropertiesService.deleteProperty('VDB_STATE') flushed cleanly.", "system-msg");
    logToTerminal("Instantiating bulk 2D boundary grid reading operation from Settings tab.", "system-msg");
    
    progressBarContainer.classList.add("active");
    progressBar.style.width = "0%";
    
    await new Promise(r => setTimeout(r, 800));

    // Process Rows Sequentially
    for (let i = 0; i < mockData.length; i++) {
      const row = mockData[i];
      const rowEl = document.getElementById(`sim-row-${i}`);
      const rowProgress = ((i + 1) / mockData.length) * 100;
      
      // Simulate state machine handoff at row index 2 (amazon.com)
      if (i === 2) {
        terminalStatus.textContent = "STATUS: SERIALIZING STATE";
        terminalStatus.className = "terminal-status status-timeout";
        logToTerminal("CRITICAL: MAX_EXECUTION_TIME_MS execution window limit reached [4.5 Mins].", "warning-msg");
        
        highlightTimeout();
        logToTerminal("Halting active runtime loop. Compiling snapshot index metadata...", "warning-msg");
        logToTerminal(`writeBatchesToSheet() flushing partial dataset block indices [0 - ${i-1}] to History tab...`, "system-msg");
        
        await new Promise(r => setTimeout(r, 1200));
        logToTerminal(`PropertiesService.setValues() saving state machine token: { currentIndex: ${i} }`, "warning-msg");
        logToTerminal("ScriptApp.newTrigger() spawned temporary continueRelayScan event (60s).", "success-msg");
        
        await new Promise(r => setTimeout(r, 1200));
        terminalStatus.textContent = "STATUS: RESUMED SCAN";
        terminalStatus.className = "terminal-status status-running";
        logToTerminal("Execution continuity context restored by background trigger event wrapper.", "success-msg");
      }

      highlightLoop();
      logToTerminal(`API Request: Fetching PageSpeed Insights telemetry for ${row.url} [${row.device}]...`);
      
      // Live interaction gauge sync metrics
      if (typeof row.targetScore === "number") {
        updateLighthouseGauge(row.targetScore);
      } else {
        updateLighthouseGauge("--");
      }

      await new Promise(r => setTimeout(r, 1000));
      
      // Inject row text cell content data metrics and append native spreadsheet write highlights
      if (rowEl) {
        rowEl.classList.add("cell-flash-active");
        rowEl.querySelector(".cell-score").textContent = row.targetScore;
        rowEl.querySelector(".cell-score").style.color = row.error ? '' : (row.targetScore >= 90 ? 'var(--pass-color)' : 'var(--fail-color)');
        rowEl.querySelector(".cell-lcp").textContent = row.lcp;
        rowEl.querySelector(".cell-cls").textContent = row.cls;
        rowEl.querySelector(".cell-tbt").textContent = row.tbt;
        rowEl.querySelector(".cell-inp").textContent = row.inp;
        rowEl.querySelector(".cell-time").textContent = new Date().toLocaleTimeString();
        
        const badge = rowEl.querySelector(".status-badge");
        badge.textContent = row.status;
        badge.className = `status-badge ${row.status === 'PASS' ? 'status-pass' : row.status === 'FAIL' ? 'status-fail' : 'status-error'}`;
      }

      if (row.error) {
        logToTerminal(`MANUAL CAUGHT OUTAGE EXCEPTION: Row ${i + 1} execution degradation handled gracefully.`, "warning-msg");
      } else {
        logToTerminal(`writeBatchesToSheet() successfully pushed metrics for ${row.url}. Status: <span>${row.status}</span>`);
      }

      // SRE Alert incident simulation event with automatic dismissal timer
      if (row.status === "FAIL") {
        logToTerminal(`ALERT DISPATCH: SLA breakdown on ${row.url}. Transmitting structured email alert parameters...`, "warning-msg");
        sreToast.classList.add("toast-visible");
        startToastTimer(toastTimeRemaining);
      }

      progressBar.style.width = `${rowProgress}%`;
      await new Promise(r => setTimeout(r, 400));
    }

    // Cleanup and complete deployment routines
    clearHighlights();
    terminalStatus.textContent = "STATUS: IDLE";
    terminalStatus.className = "terminal-status";
    logToTerminal("Batch scan complete. All memory registers cleared. Temporary cron triggers destroyed.", "success-msg");

    setTimeout(() => {
      simulateBtn.textContent = "Simulate API Scan";
      simulateBtn.disabled = false;
      progressBarContainer.classList.remove("active");
      isSimulating = false;
    }, 1000);
  });

  // --- 6. Presentation Layer Modals Control Mechanics ---
  viewEmailBtn.addEventListener("click", () => {
    emailModal.classList.add("modal-open");
  });

  closeModalBtn.addEventListener("click", () => {
    emailModal.classList.remove("modal-open");
  });

  emailModal.addEventListener("click", (e) => {
    if (e.target === emailModal) {
      emailModal.classList.remove("modal-open");
    }
  });

  // --- 7. Passive Layout Elements Scroll Intersector ---
  const flowElements = document.querySelectorAll('.flow-node, .flow-arrow');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.8 });

  flowElements.forEach(el => observer.observe(el));
});