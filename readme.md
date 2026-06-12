<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.iconify.design/fa6-solid/stopwatch.svg?color=white">
    <source media="(prefers-color-scheme: light)" srcset="https://api.iconify.design/fa6-solid/stopwatch.svg?color=111827">
    <img src="https://api.iconify.design/fa6-solid/stopwatch.svg?color=111827" width="40" height="40" alt="Performance Icon"/>
  </picture>
  <h1>PageSpeed Performance Monitor</h1>
  <p>Automated, enterprise-grade web performance tracking built entirely within Google Sheets.</p>
  
  <p>
    Created by 
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://api.iconify.design/fa6-brands/github.svg?color=white">
      <source media="(prefers-color-scheme: light)" srcset="https://api.iconify.design/fa6-brands/github.svg?color=111827">
      <img src="https://api.iconify.design/fa6-brands/github.svg?color=111827" width="16" height="16" style="vertical-align: middle; margin-bottom: 2px;" alt="GitHub"/>
    </picture>
    <a href="https://github.com/atriganguly"><b>@atriganguly</b></a> &nbsp;&bull;&nbsp; 
    <a href="https://github.com/atriganguly/pagespeed-performance-monitor"><b>View Repository</b></a> &nbsp;&bull;&nbsp; 
    <a href="https://atriganguly.github.io/pagespeed-performance-monitor/"><b>Official Website</b></a>
  </p>
</div>

<br>

## Overview

Website performance is no longer just a technical metric; it is a core business driver. Google's PageSpeed Insights determines how fast your site feels to users and heavily influences search engine rankings (SEO).

The PageSpeed Performance Monitor automates the tedious process of running these audits. It silently evaluates an unlimited number of web properties every day, logs historical data, and alerts your team the moment a site drops below acceptable thresholds. 

No complex servers. No recurring SaaS fees. Just clean data, delivered where you work.

<br>

## Technology Stack

* **[Google Apps Script (V8 Engine)](https://developers.google.com/apps-script):** Serverless execution environment hosted by Google.
* **[PageSpeed Insights API v5](https://developers.google.com/speed/docs/insights/v5/get-started):** Core engine for fetching Lighthouse audit data.
* **[Google Sheets API](https://developers.google.com/sheets/api):** Data layer used for persistent logging and dashboard rendering.

<br>

## Getting Started

### 1. Generate Your PageSpeed API Key
To communicate with Google's performance servers, you need a free access key.
1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown in the top-left navigation bar and select **New Project**. Name it "Performance Monitor".
3. Open the left-hand hamburger menu, navigate to **APIs & Services** > **Library**.
4. Search for **PageSpeed Insights API** and click **Enable**.
5. Navigate to **Credentials** on the left menu, click **+ Create Credentials** at the top, and select **API Key**. Copy this key securely.

### 2. Configure the Environment
For security, this script does not store your API key in the source code.
1. Open your Google Sheet and navigate to **Extensions > Apps Script** in the top menu bar.
2. Click the **Project Settings** (gear icon) on the left-hand sidebar of the Apps Script editor.
3. Scroll down to the **Script Properties** section and click **Add script property**.
4. Set the *Property* name exactly to `PAGE_SPEED_API_KEY` and paste your copied key into the *Value* field.
5. Click **Save script properties**.

### 3. Usage
Once authorized, a new menu titled **Monitor Tools** will automatically appear in your Google Sheet's top navigation bar.
* **Run Daily Scan:** Initiates a full audit of all active URLs in your Settings tab.
* **Fetch Missing Friendly Names:** Automatically fetches the HTML website titles for any new URLs you add.
* **Send Weekly Report:** Dispatches a clean HTML email summary to leadership, including organizational metadata.

To automate the tool entirely, open the Apps Script editor, navigate to **Triggers** (clock icon), and set `startDailyScanUI` to run daily at your preferred time.

<br>

## Architecture & System Design
*A brief technical overview of the system's underlying engineering principles.*

This tool was engineered to overcome the inherent limitations of the Google Apps Script runtime environment—specifically the strict 6-minute execution limits that plague non-developers and developers alike—while maintaining a zero-infrastructure footprint.

* **Stateful Relay Runner Pattern:** To process large arrays of URLs without hitting the 6-minute execution timeout (which would instantly kill the script and lose all data), the primary scan operates as a state machine. It monitors its own execution time. As it approaches the safety threshold (4.5 minutes), it halts the loop, serializes its current array index into `PropertiesService`, dumps its current batch queue to the spreadsheet, and dynamically spawns an isolated background trigger to resume execution exactly where it left off 60 seconds later.
* **Event-Driven Trigger Isolation:** Trigger management in Apps Script is notoriously fragile. The system utilizes a wrapper architecture (`continueRelayScan`) specifically for continuation events. When a relay finishes, the teardown function filters and destroys *only* the temporary continuation triggers, mathematically guaranteeing that permanent user schedules remain untouched.
* **Batched I/O & Dynamic Bounds:** Reading and writing cell-by-cell is the primary bottleneck in Apps Script. The application pulls data using unbounded edge detection (`getLastRow()`) to construct tightly packed 2D arrays in memory. Data is only written to the Document Object Model (DOM) at the very end of an execution cycle.
* **Graceful API Degradation:** External network calls are wrapped in strict error boundaries. The script manually catches non-JSON payloads (e.g., 502 HTML outage pages from Google) before parsing, converting fatal syntax errors into localized row failures that do not halt the broader batch execution.

<br>

## Support & Contributions

I built this tool to solve complex, scale-heavy tracking challenges without relying on expensive SaaS infrastructure. 

If you encounter any bugs, have ideas for feature enhancements, or need help patching an edge case, please feel free to reach out. I actively maintain this project and welcome community feedback.

* **Bug Reports & Feature Requests:** [Open an Issue](https://github.com/atriganguly/pagespeed-performance-monitor/issues)
* **Connect:** Reach out via my [GitHub Profile](https://github.com/atriganguly) for patches, suggestions, or technical discussions.