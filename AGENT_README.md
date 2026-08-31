# Agent Directives: PageSpeed Performance Monitor

## 1. System Context
You are modifying a production-grade Google Apps Script (GAS) environment engineered by @atriganguly[cite: 2]. This system performs bulk network requests to the Google PageSpeed Insights API, parses the data, and batch-writes to a Google Spreadsheet[cite: 2]. It utilizes a stateful continuation architecture ("Relay Runner") to bypass maximum execution time limits[cite: 2]. The repository also includes a static frontend presentation layer located in the `/docs` directory[cite: 1, 2].

## 2. Absolute Design Constraints
When generating, modifying, or refactoring code for this repository, you must adhere strictly to the following rules[cite: 2]:

* **No Emojis or AI Enthusiasm:** Code comments and docstrings must be strictly professional, minimal, and standard (JSDoc format for functions)[cite: 2]. Do not use rocket ships, checkmarks, or colloquial commentary[cite: 2].
* **No UI Blocking Operations:** Never use `@customfunction` (custom cell formulas) for network requests (`UrlFetchApp`)[cite: 2]. All external API calls must be handled via batched background scripts or manual menu triggers[cite: 2].
* **Strict API Abstraction (Immutable Configs):** Never hardcode API keys, passwords, or sensitive IDs[cite: 2]. Always utilize `PropertiesService.getScriptProperties()`[cite: 2]. All structural mappings must reside in the `CONFIG` constant within `ppm-configurator.gs`[cite: 2].
* **Fail-Safe Parsing:** Any execution of `JSON.parse()` on external data must be wrapped in a `try/catch` block[cite: 2]. The system must gracefully handle HTML error pages returned by an API expecting JSON[cite: 2].
* **Trigger Isolation:** The core script utilizes a self-replicating time-based trigger to handle execution timeouts[cite: 2]. When writing cleanup functions, you MUST filter by the specific `HandlerFunction` name[cite: 2]. Never execute a blanket `ScriptApp.deleteTrigger()` that might destroy a user's permanent daily cron job[cite: 2].

## 3. Deployment Protocol & Namespace Integrity
Google Apps Script operates in a single global namespace[cite: 2]. 
* Do not use `export` or `import` statements[cite: 2]. 
* Avoid variable shadowing across files[cite: 2]. 
* All functions intended for UI triggers or macro execution must be exposed at the top level[cite: 2].
* The frontend `/docs` directory is deployed independently as static files (e.g., via GitHub Pages)[cite: 1]. Do not introduce server-side rendering logic or backend dependencies into this directory.

## 4. Local Development & Testing Guardrails
When suggesting testing or local development workflows:
* **Backend Syncing:** Always assume the use of Google `clasp` (`@google/clasp`) for pulling and pushing `.gs` files locally without corrupting the cloud environment.
* **Non-Destructive Testing:** When directing tests for regex sanitization or state machine logic (e.g., `ppm-url-cleaner.gs`), ensure procedures bypass live API calls to prevent exhausting Google Cloud quotas. Propose temporary `CONFIG` alterations (e.g., lowering `MAX_EXECUTION_TIME_MS`) for verifying trigger behavior safely.

## 5. Documentation Maintenance Protocol
**CRITICAL:** The `/docs` directory acts as the official frontend representation of this system[cite: 2]. If you (the agent) modify the architecture, logic flow, or configuration mapping, you must perform a "Documentation Impact Assessment"[cite: 2].
* You must silently update `README.md`, `AGENT_README.md`, and the visual flowcharts/text inside the `/docs` web files (`index.html`, `app.js`) to perfectly mirror the new codebase, including step-by-step deployment instructions[cite: 2].
* You must **NEVER** remove the authorship tags, GitHub icon, or the "Support & Contributions" section pointing to @atriganguly[cite: 2]. Documentation drift is strictly prohibited[cite: 2].