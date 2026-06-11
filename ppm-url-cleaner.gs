/**
 * Batch processes missing friendly names in the Settings sheet.
 * Replaces the fragile @customfunction approach with a stable batch job.
 */
function batchFetchFriendlyNames() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.SETTINGS);
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Settings sheet not found. Check configuration.");
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < CONFIG.DATA_START_ROW) return;

  // Retrieve the URL, Name, and Status columns based on config mappings
  const numRows = lastRow - CONFIG.DATA_START_ROW + 1;
  const urls = sheet.getRange(CONFIG.DATA_START_ROW, CONFIG.SETTINGS_COLS.URL, numRows, 1).getValues();
  const statuses = sheet.getRange(CONFIG.DATA_START_ROW, CONFIG.SETTINGS_COLS.STATUS, numRows, 1).getValues();
  const namesRange = sheet.getRange(CONFIG.DATA_START_ROW, CONFIG.SETTINGS_COLS.FRIENDLY_NAME, numRows, 1);
  const names = namesRange.getValues();

  let updatesMade = false;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i][0];
    const currentName = names[i][0];
    const rowStatus = statuses[i][0];

    // Only fetch if status is not explicitly FALSE, there is a URL, and the friendly name is blank
    if (rowStatus !== false && url && !currentName) {
      names[i][0] = fetchTitle(url);
      updatesMade = true;
      // Polite delay to avoid aggressive rate limiting from target web servers
      Utilities.sleep(500);
    }
  }

  if (updatesMade) {
    namesRange.setValues(names);
    SpreadsheetApp.getActiveSpreadsheet().toast("Friendly names updated successfully.", "Complete");
  } else {
    SpreadsheetApp.getActiveSpreadsheet().toast("All valid URLs already have friendly names.", "Complete");
  }
}

/**
 * Attempts to fetch the HTML title tag of a given URL.
 * @param {string} url The target URL.
 * @returns {string} The page title or a cleaned domain fallback.
 */
function fetchTitle(url) {
  let cleanUrl = url.trim();
  if (!cleanUrl.match(/^http/i)) cleanUrl = 'https://' + cleanUrl;

  try {
    const response = UrlFetchApp.fetch(cleanUrl, {muteHttpExceptions: true});
    const html = response.getContentText();
    
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      let title = titleMatch[1].trim();
      title = title.split(/ \| | - |: /)[0];
      return decodeHtmlEntities(title);
    }
    return generateDomainFallback(cleanUrl);
  } catch (e) {
    return generateDomainFallback(cleanUrl);
  }
}

/**
 * Generates a fallback name based on the domain.
 */
function generateDomainFallback(url) {
  try {
    const domain = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch (e) {
    return "Unknown Site";
  }
}

/**
 * Utility to parse HTML entities in titles.
 */
function decodeHtmlEntities(str) {
  return str.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'");
}