<div align="center">
  <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/master/svgs/solid/stopwatch.svg" width="40" height="40" alt="Performance Icon"/>
  <h1>PageSpeed Performance Monitor</h1>
  <p>Automated, enterprise-grade web performance tracking built entirely within Google Sheets.</p>
  
  <p>
    Created by <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/master/svgs/brands/github.svg" width="16" height="16" style="vertical-align: middle; margin-bottom: 2px;" alt="GitHub"/> <a href="https://github.com/atriganguly"><b>@atriganguly</b></a> &nbsp;&bull;&nbsp; 
    <a href="https://github.com/atriganguly/pagespeed-performance-monitor"><b>View Repository</b></a> &nbsp;&bull;&nbsp; 
    <a href="https://atriganguly.github.io/pagespeed-performance-monitor/"><b>🌐 Official Website</b></a>
  </p>
</div>

<br>

## Overview

Website performance is no longer just a technical metric; it is a core business driver. Google's PageSpeed Insights determines how fast your site feels to users and heavily influences search engine rankings (SEO).

The PageSpeed Performance Monitor automates the tedious process of running these audits. It silently evaluates an unlimited number of web properties every day, logs historical data, and alerts your team the moment a site drops below acceptable thresholds. 

No complex servers. No recurring SaaS fees. Just clean data, delivered where you work.

<br>

## Getting Started

### 1. Generate Your PageSpeed API Key
To communicate with Google's performance servers, you need an access key.
1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., "Performance Monitor").
3. Navigate to **APIs & Services** > **Library**.
4. Search for **PageSpeed Insights API** and click **Enable**.
5. Navigate to **Credentials**, click **Create Credentials**, and select **API Key**. Copy this key.

### 2. Configure the Environment
For security, this script does not store your API key in the source code.
1. Open your Google Sheet and navigate to **Extensions > Apps Script**.
2. Click the **Project Settings** (gear icon) on the left sidebar.
3. Scroll down to **Script Properties** and click **Add script property**.
4. Set the Property name to `PAGE_SPEED_API_KEY` and paste your copied key into the Value field.
5. Save the properties.

### 3. Usage
Once authorized, a new menu titled **Monitor Tools** will appear in your Google Sheet.
* **Run Daily Scan:** Initiates a full audit of all active URLs in your Settings tab.
* **Fetch Missing Friendly Names:** Automatically fetches the website titles for any new URLs you add.
* **Send Weekly Report:** Dispatches a clean HTML email summary to leadership, including organizational metadata.

To automate the tool entirely, open the Apps Script editor, navigate to **Triggers** (clock icon), and set `startDailyScanUI` to run daily at your preferred time.

<br>

## Configuration & Data Management

The system is designed to be highly flexible without requiring code changes. All structural mapping is handled in the `ppm-configurator.gs` file. 

* **Organizational Metadata:** The system supports deep tracking via `Org ID`, `Organization`, and `Label` columns. Empty cells automatically default to 'N/A' to prevent pipeline breaks.
* **Status Toggles:** You can temporarily disable scanning for any specific property by setting its Status column to `FALSE`. The Relay Runner will mathematically bypass these rows.
* **Thresholds:** Adjust the passing scores for Mobile (default: 85) and Desktop (default: 90).
* **Grid Mapping:** If your team inserts a new column in the spreadsheet, simply update the column index in the `SETTINGS_COLS` object.

<br>

---

<br>

## Architecture & System Design
*A brief technical overview of the system's underlying engineering principles.*

This tool was engineered to overcome the inherent limitations of the Google Apps Script runtime environment—specifically the strict 6-minute execution limits and aggressive API rate limiting—while maintaining a zero-infrastructure footprint.

* **Stateful Relay Runner Pattern:** To process large arrays of URLs without hitting execution timeouts, the primary scan operates as a state machine. It monitors its own execution time. As it approaches the safety threshold, it halts the loop, serializes its current array index into `PropertiesService`, dumps its current batch queue to the spreadsheet, and dynamically spawns an isolated trigger to resume execution exactly where it left off. 
* **Event-Driven Trigger Isolation:** Trigger management in Apps Script is notoriously fragile. The system utilizes a wrapper architecture (`continueRelayScan`) specifically for continuation events. When a relay finishes, the teardown function specifically filters and destroys *only* temporary continuation triggers, mathematically guaranteeing that permanent user schedules remain untouched.
* **Batched I/O & Dynamic Bounds:** Reading and writing cell-by-cell is the primary bottleneck in Apps Script. The application pulls data using unbounded edge detection (`getLastRow()`) to construct tightly packed 2D arrays in memory. Data is only written to the DOM at the very end of an execution cycle.
* **Graceful API Degradation:** External network calls are wrapped in strict error boundaries. The script manually catches non-JSON payloads (e.g., 502 HTML pages from Google) before parsing, converting fatal syntax errors into localized row failures that do not halt the broader batch execution.

<br>

## Support & Contributions

I built this tool to solve complex, scale-heavy tracking challenges without relying on expensive SaaS infrastructure. 

If you encounter any bugs, have ideas for feature enhancements, or need help patching an edge case, please feel free to reach out. I actively maintain this project and welcome community feedback.

* **Bug Reports & Feature Requests:** [Open an Issue](https://github.com/atriganguly/pagespeed-performance-monitor/issues)
* **Connect:** Reach out via my [GitHub Profile](https://github.com/atriganguly) for patches, suggestions, or technical discussions.