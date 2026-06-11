/**
 * Core execution file for the PageSpeed Performance Monitor.
 * Handles batched API fetching, script continuation, and reporting.
 */

/**
 * Primary entry point. Wraps the relay scan to ensure state is clean on manual runs.
 */
function startDailyScanUI() {
  PropertiesService.getScriptProperties().deleteProperty('VDB_STATE');
  cleanUpRelayBatons();
  runDailyScan();
}

/**
 * Executes the performance audit, handling state and execution timeouts.
 */
function runDailyScan() {
  const startTime = Date.now();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName(CONFIG.SHEETS.SETTINGS);
  const histSheet = ss.getSheetByName(CONFIG.SHEETS.HISTORY);
  const dashSheet = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD);
  const scriptProps = PropertiesService.getScriptProperties();

  let state = JSON.parse(scriptProps.getProperty('VDB_STATE'));
  if (!state) {
    const lastDashRow = dashSheet.getLastRow();
    const lastDashCol = dashSheet.getLastColumn();
    if (lastDashRow > 1 && lastDashCol > 0) {
      dashSheet.getRange(2, 1, lastDashRow - 1, lastDashCol).clearContent();
    }
    state = { currentIndex: 0, isContinuation: false };
  }

  // Determine dynamic bounds of the settings sheet to prevent looping empty rows
  const lastSettingRow = settingsSheet.getLastRow();
  if (lastSettingRow < CONFIG.DATA_START_ROW) return;

  const numRows = lastSettingRow - CONFIG.DATA_START_ROW + 1;
  const urls = settingsSheet.getRange(CONFIG.DATA_START_ROW, CONFIG.SETTINGS_COLS.URL, numRows, 1).getValues();
  const names = settingsSheet.getRange(CONFIG.DATA_START_ROW, CONFIG.SETTINGS_COLS.FRIENDLY_NAME, numRows, 1).getValues();
  const statuses = settingsSheet.getRange(CONFIG.DATA_START_ROW, CONFIG.SETTINGS_COLS.STATUS, numRows, 1).getValues();
  
  // Fetch new metadata columns into memory
  const orgIds = settingsSheet.getRange(CONFIG.DATA_START_ROW, CONFIG.SETTINGS_COLS.ORG_ID, numRows, 1).getValues();
  const orgs = settingsSheet.getRange(CONFIG.DATA_START_ROW, CONFIG.SETTINGS_COLS.ORGANIZATION, numRows, 1).getValues();
  const labels = settingsSheet.getRange(CONFIG.DATA_START_ROW, CONFIG.SETTINGS_COLS.LABEL, numRows, 1).getValues();

  // Read configuration cells based on mapping
  const sreEmails = settingsSheet.getRange(CONFIG.DATA_START_ROW, CONFIG.SETTINGS_COLS.SRE_EMAILS).getValue();
  const mobileThreshold = settingsSheet.getRange(CONFIG.DATA_START_ROW, CONFIG.SETTINGS_COLS.MOBILE_PASS).getValue() || CONFIG.THRESHOLDS.DEFAULT_MOBILE;
  const desktopThreshold = settingsSheet.getRange(CONFIG.DATA_START_ROW, CONFIG.SETTINGS_COLS.DESKTOP_PASS).getValue() || CONFIG.THRESHOLDS.DEFAULT_DESKTOP;

  let alertQueue = [];
  let dashboardBatch = [];
  let historyBatch = [];

  const getVal = (audit) => audit && audit.numericValue ? audit.numericValue : 0;
  const getDisp = (audit) => audit && audit.displayValue ? audit.displayValue : 'N/A';

  for (let i = state.currentIndex; i < urls.length; i++) {
    let rawUrl = urls[i][0];
    let rowStatus = statuses[i][0];
    let friendlyName = names[i][0] || rawUrl;
    
    // Apply N/A fallbacks for empty metadata fields
    let currentOrgId = orgIds[i][0] || 'N/A';
    let currentOrg = orgs[i][0] || 'N/A';
    let currentLabel = labels[i][0] || 'N/A';
    
    if (rowStatus === false) continue; // Skip execution if status toggle is false
    if (!rawUrl) continue;

    let cleanUrl = rawUrl.trim();
    if (!cleanUrl.match(/^http/i)) cleanUrl = 'https://' + cleanUrl;
    let safeName = friendlyName.toString().replace(/"/g, '""');
    let hyperLinkFormula = `=HYPERLINK("${cleanUrl}", "${safeName}")`;

    ['mobile', 'desktop'].forEach(device => {
      try {
        const data = fetchPageSpeedData(cleanUrl, device);
        
        if (!data.lighthouseResult || !data.lighthouseResult.audits) {
          throw new Error("API returned incomplete data structure.");
        }

        const audits = data.lighthouseResult.audits;
        const cats = data.lighthouseResult.categories;
        const loading = data.loadingExperience || {};

        const metrics = {
          timestamp: new Date(),
          url: cleanUrl,
          device: device,
          perf: cats.performance ? Math.round(cats.performance.score * 100) : 0,
          access: cats.accessibility ? Math.round(cats.accessibility.score * 100) : 0,
          bestPrac: cats['best-practices'] ? Math.round(cats['best-practices'].score * 100) : 0,
          seo: cats.seo ? Math.round(cats.seo.score * 100) : 0,
          pwa: (cats.pwa) ? Math.round(cats.pwa.score * 100) : 'N/A',
          lcp: (getVal(audits['largest-contentful-paint']) / 1000).toFixed(2),
          fcp: (getVal(audits['first-contentful-paint']) / 1000).toFixed(2),
          tbt: Math.round(getVal(audits['total-blocking-time'])),
          cls: getDisp(audits['cumulative-layout-shift']),
          si: (getVal(audits['speed-index']) / 1000).toFixed(2),
          tti: (getVal(audits['interactive']) / 1000).toFixed(2),
          field_lcp: loading.metrics?.FIRST_CONTENTFUL_PAINT_MS?.percentile ? (loading.metrics.FIRST_CONTENTFUL_PAINT_MS.percentile / 1000).toFixed(2) : 'N/A',
          field_fid: loading.metrics?.FIRST_INPUT_DELAY_MS?.percentile || 'N/A',
          field_cls: loading.metrics?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile ? (loading.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100).toFixed(2) : 'N/A',
          field_inp: loading.metrics?.INTERACTION_TO_NEXT_PAINT?.percentile || 'N/A',
          ttfb: Math.round(getVal(audits['server-response-time'])),
          bytes: getVal(audits['total-byte-weight']),
          dom: getVal(audits['dom-size']),
          mainThread: Math.round(getVal(audits['mainthread-work-breakdown'])),
          jsTime: Math.round(getVal(audits['bootup-time'])),
          renderBlock: Math.round(getVal(audits['render-blocking-resources']))
        };

        historyBatch.push([
          metrics.timestamp, metrics.url, metrics.device, metrics.perf, metrics.access, 
          metrics.bestPrac, metrics.seo, metrics.pwa, metrics.fcp, metrics.lcp, 
          metrics.tbt, metrics.cls, metrics.si, metrics.tti, metrics.field_lcp, 
          metrics.field_fid, metrics.field_cls, metrics.field_inp, metrics.ttfb, 
          metrics.bytes, metrics.dom, metrics.mainThread, metrics.jsTime, metrics.renderBlock
        ]);

        const threshold = (device === 'mobile') ? mobileThreshold : desktopThreshold;
        const status = (metrics.perf >= threshold) ? 'PASS' : 'FAIL';

        // Prepend metadata fields to the dashboard row
        dashboardBatch.push([
          currentOrgId, currentOrg, currentLabel,
          hyperLinkFormula, metrics.device, metrics.perf, metrics.lcp, metrics.cls, 
          metrics.tbt, metrics.field_inp, status, metrics.timestamp
        ]);

        if (metrics.perf < threshold) {
          alertQueue.push({
            orgId: currentOrgId,
            org: currentOrg,
            label: currentLabel,
            name: friendlyName,
            url: cleanUrl,
            device: device,
            score: metrics.perf,
            threshold: threshold,
            lcp: metrics.lcp,
            tbt: metrics.tbt
          });
        }

      } catch (e) {
        dashboardBatch.push([currentOrgId, currentOrg, currentLabel, hyperLinkFormula, device, 'ERROR', e.message, '', '', '', 'ERROR', new Date()]);
      }
    });

    if (Date.now() - startTime > CONFIG.MAX_EXECUTION_TIME_MS) {
      writeBatchesToSheet(histSheet, dashSheet, historyBatch, dashboardBatch);
      if (alertQueue.length > 0 && sreEmails) {
        sendSREAlert(alertQueue, sreEmails, true);
      }

      scriptProps.setProperty('VDB_STATE', JSON.stringify({
        currentIndex: i + 1,
        isContinuation: true
      }));
      setupRelayBaton();
      return;
    }
  }

  writeBatchesToSheet(histSheet, dashSheet, historyBatch, dashboardBatch);
  if (alertQueue.length > 0 && sreEmails) {
    sendSREAlert(alertQueue, sreEmails, false);
  }

  scriptProps.deleteProperty('VDB_STATE');
  cleanUpRelayBatons();
}

/**
 * Handles communication with the Google API, with strict JSON validation.
 */
function fetchPageSpeedData(url, strategy) {
  const apiEndpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`;
  const params = [
    `url=${encodeURIComponent(url)}`,
    `key=${getApiKey()}`,
    `strategy=${strategy}`,
    `category=performance`,
    `category=accessibility`,
    `category=best-practices`,
    `category=seo`,
    `category=pwa`
  ].join('&');

  const response = UrlFetchApp.fetch(`${apiEndpoint}?${params}`, { muteHttpExceptions: true });
  const contentText = response.getContentText();
  
  let json;
  try {
    json = JSON.parse(contentText);
  } catch (e) {
    throw new Error("Invalid API Response. Target server may be blocking requests or returning HTML errors.");
  }

  if (json.error) {
    throw new Error(`${json.error.code}: ${json.error.message}`);
  }
  return json;
}

/**
 * Writes data arrays to sheets using dynamic bounds to prevent row/column limits.
 */
function writeBatchesToSheet(histSheet, dashSheet, historyBatch, dashboardBatch) {
  if (historyBatch.length > 0) {
    histSheet.getRange(histSheet.getLastRow() + 1, 1, historyBatch.length, historyBatch[0].length).setValues(historyBatch);
  }
  if (dashboardBatch.length > 0) {
    const startRow = dashSheet.getLastRow() === 0 ? 2 : dashSheet.getLastRow() + 1;
    dashSheet.getRange(startRow, 1, dashboardBatch.length, dashboardBatch[0].length).setValues(dashboardBatch);
  }
}

/**
 * Sets a time-based trigger specifically tied to the continuation function.
 */
function setupRelayBaton() {
  cleanUpRelayBatons();
  ScriptApp.newTrigger('continueRelayScan')
    .timeBased()
    .after(60 * 1000)
    .create();
}

/**
 * Dedicated continuation wrapper to prevent accidental deletion of manual daily triggers.
 */
function continueRelayScan() {
  runDailyScan();
}

/**
 * Safely removes only the temporary triggers created by the script execution.
 */
function cleanUpRelayBatons() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'continueRelayScan') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

/**
 * Compiles and sends the weekly performance digest.
 */
function sendWeeklyReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName(CONFIG.SHEETS.SETTINGS);
  const dashSheet = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD);
  
  const emails = settingsSheet.getRange(CONFIG.DATA_START_ROW, CONFIG.SETTINGS_COLS.LEAD_EMAILS).getValue();
  if (!emails) return;

  const lastCol = dashSheet.getLastColumn();
  const lastRow = dashSheet.getLastRow();
  if (lastRow <= 1) return;
  
  // Fetch both the text values and the underlying formulas
  const range = dashSheet.getRange(2, 1, lastRow - 1, lastCol);
  const data = range.getValues();
  const formulas = range.getFormulas();
  
  let html = CONFIG.EMAIL.LEAD_HTML_HEADER;

  data.forEach((row, index) => {
    // Array indices are shifted +3 due to Org ID, Organization, and Label insertion
    if(!row[3]) return; 
    
    // Status is now at row[10]
    const scoreColor = (row[10] === 'PASS') ? '#27ae60' : '#c0392b'; 
    const scoreStyle = `font-weight: bold; color: ${scoreColor};`;

    // Extract URL from the HYPERLINK formula
    let propertyUrl = "#";
    const cellFormula = formulas[index][3];
    if (cellFormula) {
      const match = cellFormula.match(/HYPERLINK\("([^"]+)"/i);
      if (match && match[1]) {
        propertyUrl = match[1];
      }
    }
    
    html += `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${row[0]}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${row[1]}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${row[2]}</td>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong><a href="${propertyUrl}" target="_blank" style="color: #2c3e50; text-decoration: underline;">${row[3]}</a></strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${row[4]}</td>
        <td style="padding: 8px; border: 1px solid #ddd; ${scoreStyle}">${row[5]}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${row[6]}</td>
        <td style="padding: 8px; border: 1px solid #ddd; ${scoreStyle}">${row[10]}</td>
      </tr>`;
  });

  html += CONFIG.EMAIL.LEAD_HTML_FOOTER;

  MailApp.sendEmail({
    to: emails,
    subject: CONFIG.EMAIL.LEAD_SUBJECT,
    htmlBody: html
  });
}

/**
 * Dispatches targeted alerts for properties failing to meet passing thresholds.
 */
function sendSREAlert(failures, recipients, isChunk = false) {
  const subjectLine = isChunk ? CONFIG.EMAIL.SRE_PARTIAL_SUBJECT : CONFIG.EMAIL.SRE_SUBJECT;
  let html = `
    <div style="font-family: Consolas, monospace; color: #333;">
      <h2 style="color: #c0392b;">${subjectLine}</h2>
      <p>The following properties have dropped below acceptable thresholds.</p>
      <hr>
  `;

  failures.forEach(f => {
    html += `
      <p><strong>Property:</strong> ${f.name}<br>
      <strong>Metadata:</strong> [Org ID: ${f.orgId}] [Org: ${f.org}] [Label: ${f.label}]<br>
      <strong>URL:</strong> <a href="${f.url}">${f.url}</a><br>
      <strong>Device:</strong> ${f.device}<br>
      <strong>Score:</strong> <span style="color:red; font-weight:bold;">${f.score}</span> (Threshold: ${f.threshold})<br>
      <strong>Metrics:</strong> LCP: ${f.lcp}s | TBT: ${f.tbt}ms<br>
      <a href="https://pagespeed.web.dev/report?url=${encodeURIComponent(f.url)}">View Debug Report</a></p>
      <hr>
    `;
  });

  html += `<p>Please investigate.</p></div>`;

  MailApp.sendEmail({
    to: recipients,
    subject: subjectLine,
    htmlBody: html
  });
}

/**
 * Initializes the custom menu upon opening the spreadsheet.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Monitor Tools')
    .addItem('Run Daily Scan', 'startDailyScanUI')
    .addItem('Fetch Missing Friendly Names', 'batchFetchFriendlyNames')
    .addItem('Send Weekly Report', 'sendWeeklyReport')
    .addToUi();
}