document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Theme Engineering (Dark/Light Mode) ---
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = themeToggle.querySelector('i');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

  // Prevent flash of unstyled content during reload
  document.body.classList.remove('preload');

  const updateThemeIcon = (theme) => {
    if (theme === 'dark') {
      themeIcon.classList.replace('fa-moon', 'fa-sun');
    } else {
      themeIcon.classList.replace('fa-sun', 'fa-moon');
    }
  };

  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcon(theme);
  };

  // Initialization
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


  // --- 2. Simulation Grid Engine ---
  const mockData = [
    { orgId: "INT-01", org: "Internal", label: "Core", url: "google.com", device: "Mobile", targetScore: 98, lcp: "1.2", cls: "0.01", tbt: "45", inp: "40", status: "PASS", error: false },
    { orgId: "EXT-44", org: "External", label: "Misc", url: "github.com", device: "Desktop", targetScore: 95, lcp: "0.8", cls: "0.00", tbt: "20", inp: "35", status: "PASS", error: false },
    { orgId: "INT-02", org: "Internal", label: "Retail", url: "amazon.com", device: "Mobile", targetScore: 65, lcp: "3.4", cls: "0.25", tbt: "450", inp: "220", status: "FAIL", error: false },
    { orgId: "OTH-99", org: "Other", label: "News", url: "news.ycombinator.com", device: "Desktop", targetScore: 100, lcp: "0.4", cls: "0.00", tbt: "0", inp: "15", status: "PASS", error: false },
    { orgId: "INT-03", org: "Internal", label: "Dev", url: "internal-domain.local", device: "Mobile", targetScore: "--", lcp: "--", cls: "--", tbt: "--", inp: "--", status: "ERROR", error: true }
  ];

  const simulationContainer = document.getElementById("simulation-rows");
  const simulateBtn = document.getElementById("simulate-btn");
  const progressBarContainer = document.querySelector(".progress-bar-container");
  const progressBar = document.getElementById("progress-bar");

  // Render initial grid rows
  const renderRows = (reset = true) => {
    simulationContainer.innerHTML = "";
    mockData.forEach((row, index) => {
      const html = `
        <div class="sheet-row" id="sim-row-${index}">
          <span>${row.orgId}</span>
          <span>${row.org}</span>
          <span>${row.label}</span>
          <span><strong>${row.url}</strong></span>
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

  renderRows(true); // Initial Render

  // --- 3. Flowchart Animation Sync Engine ---
  const nodes = {
    n1: document.getElementById("node-1"), a1: document.getElementById("arrow-1"),
    n2: document.getElementById("node-2"), a2: document.getElementById("arrow-2"),
    n3: document.getElementById("node-3"), aloop: document.getElementById("arrow-loop"),
    n4: document.getElementById("node-4"), a4: document.getElementById("arrow-4"),
    n5: document.getElementById("node-5"), a5: document.getElementById("arrow-5"),
    n6: document.getElementById("node-6")
  };

  const clearHighlights = () => {
    Object.values(nodes).forEach(el => {
      el.classList.remove("processing-highlight", "timeout-highlight");
    });
  };

  const highlightLoop = () => {
    clearHighlights();
    nodes.n2.classList.add("processing-highlight");
    nodes.a2.classList.add("processing-highlight");
    nodes.n3.classList.add("processing-highlight");
    if(window.innerWidth > 768) nodes.aloop.classList.add("processing-highlight");
  };

  const highlightTimeout = () => {
    clearHighlights();
    nodes.n4.classList.add("timeout-highlight");
    nodes.a4.classList.add("timeout-highlight");
    nodes.n5.classList.add("timeout-highlight");
    nodes.a5.classList.add("timeout-highlight");
    nodes.n6.classList.add("timeout-highlight");
  };

  // Core Simulation Logic
  let isSimulating = false;

  simulateBtn.addEventListener("click", async () => {
    if (isSimulating) return;
    isSimulating = true;

    // Reset UI
    simulateBtn.disabled = true;
    simulateBtn.textContent = "Running Relay Scan...";
    renderRows(true);
    progressBarContainer.classList.add("active");
    progressBar.style.width = "0%";
    
    nodes.n1.classList.add("processing-highlight");
    nodes.a1.classList.add("processing-highlight");
    await new Promise(r => setTimeout(r, 800));

    // Process Rows Sequentially
    for (let i = 0; i < mockData.length; i++) {
      const row = mockData[i];
      const rowEl = document.getElementById(`sim-row-${i}`);
      const rowProgress = ((i + 1) / mockData.length) * 100;
      
      // Simulate Timeout Wall at Row 3 (Amazon)
      if (i === 2) {
        highlightTimeout();
        simulateBtn.textContent = "Timeout Wall Hit. Serializing State...";
        await new Promise(r => setTimeout(r, 1500));
        simulateBtn.textContent = "Spawning Continuation Trigger...";
        await new Promise(r => setTimeout(r, 1000));
        simulateBtn.textContent = "Resuming Scan...";
      }

      highlightLoop();
      
      // Artificial delay for API fetch
      await new Promise(r => setTimeout(r, 800));
      
      // Inject Data
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

      progressBar.style.width = `${rowProgress}%`;
    }

    // Cleanup
    clearHighlights();
    setTimeout(() => {
      simulateBtn.textContent = "Simulate API Scan";
      simulateBtn.disabled = false;
      progressBarContainer.classList.remove("active");
      isSimulating = false;
    }, 1000);
  });

  // --- 4. Passive Scroll Observer ---
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