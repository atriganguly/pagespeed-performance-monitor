/**
 * Configuration file for the PageSpeed Performance Monitor.
 * All sheet mappings, column indices, and email templates should be modified here.
 * Do not place sensitive credentials (like API keys) in this file.
 */

const CONFIG = {
  // Execution Limits
  // Leaves a buffer to prevent the Google 6-minute hard timeout.
  MAX_EXECUTION_TIME_MS: 4.5 * 60 * 1000, 
  
  // Sheet Name Mappings
  SHEETS: {
    SETTINGS: 'Settings',
    DASHBOARD: 'Dashboard',
    HISTORY: 'History'
  },

  // Settings Sheet Column Mappings (1-based index: A=1, B=2, C=3, etc.)
  SETTINGS_COLS: {
    ORG_ID: 1,          // Column A
    ORGANIZATION: 2,    // Column B
    URL: 3,             // Column C
    LABEL: 4,           // Column D
    STATUS: 5,          // Column E
    FRIENDLY_NAME: 6,   // Column F
    SRE_EMAILS: 7,      // Column G
    LEAD_EMAILS: 8,     // Column H
    MOBILE_PASS: 9,     // Column I
    DESKTOP_PASS: 10    // Column J
  },

  // Starting row for processing settings data
  DATA_START_ROW: 2,

  // Default Pass/Fail Thresholds (Used if cells are empty)
  THRESHOLDS: {
    DEFAULT_MOBILE: 85,
    DEFAULT_DESKTOP: 90
  },

  // Email Content & Templates
  EMAIL: {
    SRE_SUBJECT: "Page Performance Alert || PageSpeed Insights",
    SRE_PARTIAL_SUBJECT: "Page Performance Alert || PageSpeed Insights (Partial Run)",
    LEAD_SUBJECT: "Page Performance Report || PageSpeed Insights",
    
    // Header for the weekly leadership report
    LEAD_HTML_HEADER: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #2c3e50;">Weekly Page Performance Report</h2>
        <p>Here is the current status of all monitored web properties.</p>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; font-size: 14px;">
          <tr style="background-color: #f2f2f2; text-align: left;">
            <th style="padding: 10px; border: 1px solid #ddd;">Org ID</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Organization</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Label</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Property</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Device</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Score</th>
            <th style="padding: 10px; border: 1px solid #ddd;">LCP (s)</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Status</th>
          </tr>`,
          
    // Footer for the weekly leadership report
    LEAD_HTML_FOOTER: `
        </table>
        <p style="font-size: 12px; color: #777; margin-top: 20px; line-height: 1.6;">
          Analyzed, Prepared & Delivered by <a href="https://github.com/atriganguly/pagespeed-performance-monitor" target="_blank" style="color: #2c3e50; font-weight: bold; text-decoration: none;">PageSpeed Performance Monitor</a>.
          <br>
          Bug Reports & Feature Requests: <a href="https://github.com/atriganguly/pagespeed-performance-monitor/issues" target="_blank" style="color: #777; text-decoration: underline;">Open an Issue</a>.
        </p>
      </div>`
  }
};

/**
 * Retrieves the API key securely from Script Properties.
 * @returns {string} The Google PageSpeed API Key.
 */
function getApiKey() {
  const key = PropertiesService.getScriptProperties().getProperty('PAGE_SPEED_API_KEY');
  if (!key) {
    throw new Error("API Key missing. Please set PAGE_SPEED_API_KEY in Script Properties.");
  }
  return key;
}