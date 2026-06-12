# Agent Directives: PageSpeed Performance Monitor

## 1. System Context
You are modifying a production-grade Google Apps Script (GAS) environment engineered by @atriganguly. This system performs bulk network requests to the Google PageSpeed Insights API, parses the data, and batch-writes to a Google Spreadsheet. It utilizes a stateful continuation architecture ("Relay Runner") to bypass maximum execution time limits.

## 2. Absolute Design Constraints
When generating, modifying, or refactoring code for this repository, you must adhere strictly to the following rules:

* **No Emojis or AI Enthusiasm:** Code comments and docstrings must be strictly professional, minimal, and standard (JSDoc format for functions). Do not use rocket ships, checkmarks, or colloquial commentary.
* **No UI Blocking Operations:** Never use `@customfunction` (custom cell formulas) for network requests (`UrlFetchApp`). All external API calls must be handled via batched background scripts or manual menu triggers.
* **Strict API Abstraction (Immutable Configs):** Never hardcode API keys, passwords, or sensitive IDs. Always utilize `PropertiesService.getScriptProperties()`. All structural mappings must reside in the `CONFIG` constant within `ppm-configurator.gs`.
* **Fail-Safe Parsing:** Any execution of `JSON.parse()` on external data must be wrapped in a `try/catch` block. The system must gracefully handle HTML error pages returned by an API expecting JSON.
* **Trigger Isolation:** The core script utilizes a self-replicating time-based trigger to handle execution timeouts. When writing cleanup functions, you MUST filter by the specific `HandlerFunction` name. Never execute a blanket `ScriptApp.deleteTrigger()` that might destroy a user's permanent daily cron job.

## 3. Deployment Protocol & Namespace Integrity
Google Apps Script operates in a single global namespace. 
* Do not use `export` or `import` statements. 
* Avoid variable shadowing across files. 
* All functions intended for UI triggers or macro execution must be exposed at the top level.

## 4. Documentation Maintenance Protocol
**CRITICAL:** The `/docs` directory acts as the official frontend representation of this system. If you (the agent) modify the architecture, logic flow, or configuration mapping, you must perform a "Documentation Impact Assessment."
* You must silently update `readme.md`, `agent_readme.md`, and the visual flowcharts/text inside the `/docs` web files (`index.html`, `app.js`) to perfectly mirror the new codebase.
* You must **NEVER** remove the authorship tags, GitHub icon, or the "Support & Contributions" section pointing to @atriganguly. Documentation drift is strictly prohibited.