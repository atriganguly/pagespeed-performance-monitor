<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://thesvg.org/icons/pagespeed-insights/default.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://thesvg.org/icons/pagespeed-insights/mono.svg">
    <img src="https://thesvg.org/icons/pagespeed-insights/default.svg" width="40" height="40" alt="Performance Icon"/>
  </picture>
  <h1>PageSpeed Performance Monitor</h1>

**Automated, zero-infrastructure enterprise web performance tracking suite built natively inside Google Apps Script and Google Sheets.**

Created by [@atriganguly](https://github.com/atriganguly)

[Repository](https://github.com/atriganguly/pagespeed-performance-monitor) | [Live Demo](https://atriganguly.github.io/pagespeed-performance-monitor/) | [Documentation](https://github.com/atriganguly/pagespeed-performance-monitor#readme)

</div>

---

![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-GPL--3.0-green)
![Language](https://img.shields.io/badge/Language-Google%20Apps%20Script%20%2F%20JavaScript-informational)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement & Solution](#problem-statement--solution)
3. [Target Audience & Use Cases](#target-audience--use-cases)
4. [System Architecture](#system-architecture)
5. [Core Engineering Mechanics](#core-engineering-mechanics)
6. [Technology Stack](#technology-stack)
7. [Environment Configuration](#environment-configuration)
8. [Installation & Quick Start](#installation--quick-start)
9. [Operational Execution Modes](#operational-execution-modes)
10. [Data Lifecycle & Output Schema](#data-lifecycle--output-schema)
11. [Deployment & Infrastructure](#deployment--infrastructure)
12. [Troubleshooting & Diagnostics](#troubleshooting--diagnostics)
13. [AI Agent Execution Boundaries](#ai-agent-execution-boundaries)
14. [Support & Contributions](#support--contributions)
15. [License](#license)

---

## Executive Summary

PageSpeed Performance Monitor is an enterprise-grade web performance automation engine designed to execute automated Google PageSpeed Insights (v5) audits across large fleets of digital properties. Built entirely within Google Apps Script (GAS) and Google Sheets, it delivers persistent historical metric logging, real-time SRE incident alerting, and executive email reports with a **zero-infrastructure footprint**.

The system utilizes a stateful continuation pattern ("Relay Runner") to bypass Google Apps Script's strict 6-minute execution limit, enabling seamless, scalable processing of hundreds of mobile and desktop endpoints without data loss or execution failures.

---

## Problem Statement & Solution

### The Problem
Monitoring Core Web Vitals and Lighthouse metrics across enterprise portfolios typically requires costly third-party SaaS subscriptions or complex serverless cloud deployments. When developers attempt to build lightweight spreadsheet-based monitors using Google Apps Script, they encounter significant platform limitations:

* **System Volatility & Hard Timeouts:** Google Apps Script enforces a strict 6-minute maximum execution time limit. Scanning multiple desktop and mobile URLs sequentially causes scripts to crash abruptly, leaving datasets incomplete.
* **High Infrastructure Overhead:** External synthetic monitoring agents (e.g., Datadog, Catchpoint) introduce monthly recurring SaaS fees and dedicated container setups for simple URL monitoring pipelines.
* **Telemetry Gaps & Fragile Custom Functions:** Calling external APIs via custom spreadsheet cell formulas (`@customfunction`) creates UI blocking, severe rate-limiting penalties, and unhandled 502/503 HTML error payloads that corrupt cell outputs.

### The Solution
PageSpeed Performance Monitor resolves these structural constraints through an isolated, event-driven state machine architecture:

* **Stateful Relay Runner Pattern:** Monitors elapsed execution time in real-time, safely halting execution at the 4.5-minute safety threshold. The current loop state is serialized to `PropertiesService`, and a temporary 60-second continuation trigger is spawned to resume execution automatically.
* **Zero Infrastructure & Zero Monthly Cost:** Runs entirely inside Google Workspace using native Google Apps Script engines and Google Sheets I/O.
* **Fail-Safe Parsing & Batched Writing:** Wraps API operations in strict error boundaries, capturing non-JSON error pages gracefully and writing telemetry in bulk 2D memory arrays to prevent spreadsheet I/O bottlenecks.

---

## Target Audience & Use Cases

* **Site Reliability Engineers (SRE) & DevOps Teams:** Real-time automated HTML email alerts dispatched instantly when web properties drop below defined SLA performance thresholds (e.g., Mobile Score < 85, LCP > 2.5s).
* **SEO Specialists & Technical Webmasters:** Comprehensive historical logging of Core Web Vitals (FCP, LCP, TBT, CLS, INP, TTFB) and diagnostic metrics (DOM size, JS bootup time, render-blocking resources) across both Mobile and Desktop viewports.
* **Engineering Leadership & Executives:** Automated weekly performance summary digests delivered straight to leadership inboxes with pass/fail indicators and deep-link debug reports.

---

## System Architecture

The application separates UI presentation, orchestration, API integration, and persistent Google Sheets storage into clean operational layers.

```
+-------------------------------------------------------------------+
|                        Google Sheets UI                           |
|       (Custom 'PPM Tools' Menu / Settings / Dashboard / History)  |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                    Orchestration Layer                            |
|    startDailyScanUI() / runDailyScan() / continueRelayScan()      |
+-------------------------------------------------------------------+
       |                          |                          |
       v                          v                          v
+--------------+          +----------------+          +--------------+
| CONFIG State |          | Relay Runner   |          | Batch Title  |
| (CONFIG /    |          | State Machine  |          | Cleaner      |
|  Properties) |          | (VDB_STATE)    |          | (UrlFetch)   |
+--------------+          +----------------+          +--------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                      Execution & API Layer                        |
|       PageSpeed Insights API v5 (Performance/SEO/PWA/CWV)         |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                     Persistence & Alerts Layer                    |
|   History Sheet (24 Cols) | Dashboard Sheet (12 Cols) | MailApp   |
+-------------------------------------------------------------------+
```

### Component Breakdown

* **Orchestration & Relay Core (`pagespeed-performance-monitor.gs`):** Manages the daily audit pipeline, evaluates the 4.5-minute timeout window, handles batch writes, and controls state continuations.
* **Configuration Module (`ppm-configurator.gs`):** Contains the immutable `CONFIG` object, structural column mappings, default SLA thresholds, email templates, and secure API key lookup wrappers.
* **Utility Module (`ppm-url-cleaner.gs`):** Batch processes missing URL friendly names by scraping `<title>` tags and decoding HTML entities without blocking UI threads.
* **Frontend Presentation (`/docs`):** Interactive static Web UI featuring dark/light modes, live state machine flowcharts, interactive terminal logs, and SRE email preview modals.

---

## Core Engineering Mechanics

To guarantee operational stability under platform limits, PageSpeed Performance Monitor incorporates four key engineering patterns:

### 1. Stateful Continuation & Relay ("Relay Runner")
When `runDailyScan()` executes, it tracks its runtime using `Date.now()`. If elapsed time exceeds `CONFIG.MAX_EXECUTION_TIME_MS` (4.5 minutes), the script:
1. Flushes currently processed memory arrays (`dashboardBatch`, `historyBatch`) to Google Sheets.
2. Serializes the current array index into `PropertiesService.getScriptProperties()` as `VDB_STATE`.
3. Calls `setupRelayBaton()` to dynamically spawn a one-time background trigger for `continueRelayScan` set to fire after 60 seconds.
4. Halts execution cleanly.

### 2. Deterministic Trigger Isolation
When cleaning up continuation triggers, `cleanUpRelayBatons()` explicitly filters project triggers by function name (`trigger.getHandlerFunction() === 'continueRelayScan'`). This mathematically guarantees that permanent, user-scheduled daily or weekly cron jobs are never accidentally deleted.

### 3. Memory-Bounded Batch I/O
Instead of writing cell-by-cell inside API loops (which causes high latency and DOM locking), metrics are accumulated in 2D memory arrays (`historyBatch` and `dashboardBatch`). The engine flushes data in single dynamic range operations (`setValues()`) using unbounded edge detection (`getLastRow() + 1`).

### 4. Graceful Error & Failure Isolation
All external network interactions (`fetchPageSpeedData`) are wrapped in `try/catch` blocks. If an endpoint returns invalid JSON, an HTTP error, or an HTML crash page (e.g., 502 Bad Gateway), the error is intercepted and recorded as an `ERROR` status row in the Dashboard, preventing a single broken target from aborting the entire scan batch.

---

## Technology Stack

| Category | Technology | Operational Purpose |
| :--- | :--- | :--- |
| **Execution Engine** | Google Apps Script (V8 Engine) | Serverless JavaScript runtime executing batch jobs, API parsing, and state serialization. |
| **Audit API Layer** | PageSpeed Insights API v5 | Google's Lighthouse auditing API providing field data (CrUX) and lab metrics. |
| **Data Store & UI** | Google Sheets API (`SpreadsheetApp`) | Persistent storage layer for raw telemetry, dashboard reporting, and configuration. |
| **Notification Engine**| Google Apps Script `MailApp` | HTML email rendering engine for real-time SRE alerting and weekly executive digests. |
| **Documentation UI** | HTML5 / CSS3 / ES6 JavaScript | Interactive browser-based presentation console with dark/light mode and architecture diagrams. |

---

## Environment Configuration

System settings, column mappings, and threshold defaults are configured inside `ppm-configurator.gs` in the `CONFIG` object. Secure credentials are managed via `PropertiesService`.

### Configuration Matrix (`ppm-configurator.gs`)

| Parameter / Key | Type | Default / Value | Description |
| :--- | :--- | :--- | :--- |
| `MAX_EXECUTION_TIME_MS` | Integer | `270000` (4.5 Mins) | Time limit before triggering state serialization and continuation. |
| `SHEETS.SETTINGS` | String | `'Settings'` | Tab name containing target URLs and alert rules. |
| `SHEETS.DASHBOARD` | String | `'Dashboard'` | Tab name displaying latest audit run results. |
| `SHEETS.HISTORY` | String | `'History'` | Tab name for persistent historical metric append logs. |
| `DATA_START_ROW` | Integer | `2` | Starting row index for user data (skipping headers). |
| `THRESHOLDS.DEFAULT_MOBILE` | Integer | `85` | Default mobile performance score SLA passing threshold. |
| `THRESHOLDS.DEFAULT_DESKTOP`| Integer | `90` | Default desktop performance score SLA passing threshold. |
| `PAGE_SPEED_API_KEY` | String | *Script Property* | Google Cloud PageSpeed API Key retrieved securely via `PropertiesService`. |

---

## Installation & Quick Start

### Prerequisites

* A Google Account with access to Google Sheets and Google Apps Script.
* A Google Cloud PageSpeed Insights API Key ([Get an API Key](https://developers.google.com/speed/docs/insights/v5/get-started)).

### Step-by-Step Setup

1. **Create Google Sheet & Tabs**
   Create a new Google Sheet and rename three tabs to match `CONFIG`:
   * `Settings`
   * `Dashboard`
   * `History`

2. **Add Script Files**
   Open **Extensions > Apps Script** and copy the codebase files into the editor:
   * `ppm-configurator.gs`
   * `pagespeed-performance-monitor.gs`
   * `ppm-url-cleaner.gs`

3. **Configure API Credentials**
   In the Apps Script IDE:
   * Go to **Project Settings** (gear icon) > **Script Properties**.
   * Click **Add script property**.
   * Set **Property**: `PAGE_SPEED_API_KEY`
   * Set **Value**: `<YOUR_GOOGLE_CLOUD_API_KEY>`

4. **Populate Settings Header Columns**
   In the `Settings` tab, set up the following columns (Row 1):
   * `Col A`: Org ID
   * `Col B`: Organization
   * `Col C`: URL
   * `Col D`: Label
   * `Col E`: Status (`TRUE`/`FALSE`)
   * `Col F`: Friendly Name
   * `Col G`: SRE Emails
   * `Col H`: Lead Emails
   * `Col I`: Mobile Pass Threshold
   * `Col J`: Desktop Pass Threshold

5. **Initialize System**
   Refresh your Google Sheet. The custom **PPM Tools** menu will automatically appear in the top toolbar.

---

## Operational Execution Modes

The engine supports five primary operational workflows triggered via UI menus or automated triggers:

* **Manual On-Demand Scan (`startDailyScanUI`):** Accessible via `PPM Tools > Run Daily Scan`. Clears leftover state tokens, purges stale continuation triggers, resets the Dashboard tab, and executes a full scan sweep.
* **Automated Cron Scan (`runDailyScan`):** Bound to a daily time-driven trigger in Apps Script IDE. Runs the automated scan in the background.
* **Relay Continuation (`continueRelayScan`):** Spawns automatically when a scan exceeds 4.5 minutes. Resumes execution at `currentIndex` until all URLs are audited.
* **Batch Friendly Name Fetcher (`batchFetchFriendlyNames`):** Accessible via `PPM Tools > Fetch Missing Friendly Names`. Iterates through active URLs without names, scrapes the HTML `<title>`, decodes entities, and updates Column F with polite 500ms request delays.
* **Weekly Executive Report (`sendWeeklyReport`):** Accessible via `PPM Tools > Send Weekly Report`. Compiles the `Dashboard` sheet into an HTML summary table and emails key leadership stakeholders.

---

## Data Lifecycle & Output Schema

### Tab 1: `Dashboard` (Latest Run Overview)
Re-written on every fresh run sweep to reflect current status across all monitored endpoints.

| Col Index | Field Name | Data Type | Description |
| :---: | :--- | :--- | :--- |
| 1 | Org ID | String | Unique organization or business unit identifier. |
| 2 | Organization | String | Parent organization name. |
| 3 | Label | String | Custom categorization label (e.g., Core, Retail). |
| 4 | Property | Formula | `=HYPERLINK("cleanUrl", "Friendly Name")` |
| 5 | Device | String | Viewport strategy (`mobile` or `desktop`). |
| 6 | Score | Integer / String | Lighthouse Performance Score (0–100) or `ERROR`. |
| 7 | LCP (s) | String | Largest Contentful Paint metric in seconds. |
| 8 | CLS | String | Cumulative Layout Shift score. |
| 9 | TBT (ms) | Integer | Total Blocking Time metric in milliseconds. |
| 10 | INP | String | Field Interaction to Next Paint metric (CrUX). |
| 11 | Status | String | Execution result (`PASS`, `FAIL`, or `ERROR`). |
| 12 | Timestamp | Date/Time | Execution timestamp. |

### Tab 2: `History` (Persistent Historical Log)
Unbounded append log accumulating continuous telemetry data over time.

| Col Index | Field Name | Data Type | Description |
| :---: | :--- | :--- | :--- |
| 1–3 | Timestamp, URL, Device | Date, String, String | Core run identification metadata. |
| 4–8 | Perf, Access, BestPrac, SEO, PWA | Integer (0–100) | Full Lighthouse category scores. |
| 9–14 | FCP, LCP, TBT, CLS, SI, TTI | Numeric Strings | Lab metrics (FCP, LCP, TBT, CLS, Speed Index, TTI). |
| 15–18 | Field LCP, Field FID, Field CLS, Field INP | Numeric Strings / N/A | Chrome User Experience Report (CrUX) field metrics. |
| 19–24 | TTFB, Bytes, DOM, MainThread, JS, RenderBlock | Numbers | In-depth diagnostic metrics (TTFB, Page Weight, DOM size, JS time). |

---

## Deployment & Infrastructure

### Setting Up Automated Cron Triggers

To automate PageSpeed Performance Monitor without manual intervention:

1. Open the Google Apps Script Editor (**Extensions > Apps Script**).
2. Select **Triggers** (clock icon) in the left sidebar.
3. Click **Add Trigger** (bottom right):
   * **Choose function to run:** `startDailyScanUI`
   * **Choose deployment:** `Head`
   * **Select event source:** `Time-driven`
   * **Select type of time based trigger:** `Day timer`
   * **Select time of day:** Choose preferred off-peak execution hours (e.g., 1am to 2am).
4. Click **Save**.

---

## Troubleshooting & Diagnostics

* **Error: `API Key missing. Please set PAGE_SPEED_API_KEY in Script Properties.`**
  * *Cause:* The `PAGE_SPEED_API_KEY` property has not been defined in Script Properties.
  * *Resolution:* Go to Apps Script **Project Settings > Script Properties** and add `PAGE_SPEED_API_KEY` with a valid Google Cloud API key.

* **Issue: Execution stops mid-way and does not finish the URL list.**
  * *Cause:* Normal behavior when batch processing exceeds 4.5 minutes.
  * *Resolution:* Check **Triggers** in Apps Script IDE. You will see a temporary `continueRelayScan` trigger scheduled to fire within 60 seconds to resume processing.

* **Dashboard shows `ERROR` with message `Invalid API Response`.**
  * *Cause:* Target server returned non-JSON output (e.g., 502 Bad Gateway, Cloudflare challenge screen, or HTML 404 page).
  * *Resolution:* Verify target URL accessibility in a browser or check if the target site blocks automated user-agents.

* **Issue: Custom daily trigger was unexpectedly deleted.**
  * *Cause:* Third-party script executed a blanket `ScriptApp.deleteTrigger()` function.
  * *Resolution:* Ensure custom cleanup functions filter explicitly by function name (`continueRelayScan`) as implemented in `cleanUpRelayBatons()`.

---

## AI Agent Execution Boundaries

Autonomous LLMs, coding agents, and automated refactoring routines operating on this codebase must strictly adhere to these design directives:

1. **No Emojis or AI Commentary:** Code comments, functions, and docstrings must maintain standard JSDoc format without colloquial enthusiasm or emojis.
2. **No UI Blocking Operations:** Never use `@customfunction` (cell formulas) for network calls (`UrlFetchApp`). External calls must strictly run in background batches.
3. **Strict API Abstraction:** Never hardcode credentials, URLs, or tab names. All structural parameters must reside in `CONFIG` (`ppm-configurator.gs`) or `PropertiesService`.
4. **Fail-Safe Parsing:** All `JSON.parse()` calls on external network data must be wrapped in `try/catch` error boundaries.
5. **Trigger Isolation:** Teardown routines must filter triggers by handler name (`continueRelayScan`) before calling `deleteTrigger()`.
6. **Namespace Integrity:** Google Apps Script runs in a single global namespace. Do not use `export` or `import` statements or variable shadowing across `.gs` files.
7. **Documentation Maintenance:** Modifications to system architecture or mappings require updating visual flowcharts and text in `/docs` files (`index.html`, `app.js`) while maintaining author attributions for `@atriganguly`.

---

## Support & Contributions

This open-source project is maintained by [@atriganguly](https://github.com/atriganguly).

* **Bug Reports & Feature Suggestions:** [Open an Issue on GitHub](https://github.com/atriganguly/pagespeed-performance-monitor/issues)
* **Contributions:** Pull requests are welcome! Ensure all agent directives and JSDoc rules are met before submitting code changes.

---

## License

This project is licensed under the **GNU General Public License v3.0** (GPL-3.0) - see the [LICENSE](LICENSE) file for details.