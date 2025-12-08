#!/usr/bin/env osascript -l JavaScript

// Precompiled regular expressions for better performance
const PROTOCOL_REGEX = /(^\w+:|^)\/\//;
const NON_WORD_REGEX = /[^\w]/g;

/**
 * Safely decodes a URL string
 * @param {string} url - URL to decode
 * @returns {string} Decoded URL or original if decoding fails
 */
function safeDecodeURL(url) {
    try {
        return decodeURIComponent(url);
    } catch (e) {
        return url;
    }
}

/**
 * Processes URL for matching purposes
 * @param {string} url - Raw URL string
 * @returns {string} Cleaned URL suitable for fuzzy matching
 */
function processURL(url) {
    const withoutProtocol = url.replace(PROTOCOL_REGEX, "");
    const decoded = safeDecodeURL(withoutProtocol);
    return decoded.replace(NON_WORD_REGEX, " ");
}

/**
 * Extracts tab data from a Safari tab object
 * @param {Object} tab - Safari tab object
 * @returns {Object|null} Tab data object or null if extraction fails
 */
function extractTabData(tab) {
    try {
        const title = tab.name() || "";
        const url = tab.url() || "about:blank";
        const cleanUrl = processURL(url);
        const matchString = `${title} ${cleanUrl}`;

        return {
            url,
            title,
            matchString
        };
    } catch (e) {
        return null;
    }
}

/**
 * Creates an Alfred item from tab data
 * @param {string} title - Tab title
 * @param {string} url - Tab URL
 * @param {string} matchString - String for Alfred fuzzy matching
 * @param {number} count - Number of duplicate tabs
 * @returns {Object} Alfred-compatible item object
 */
function createAlfredItem(title, url, matchString, count) {
    const subtitle = count > 1 ? `${url} (${count} tabs)` : url;

    return {
        title,
        subtitle,
        arg: url,
        match: matchString,
        autocomplete: title,
        valid: true,
        // icon: { path: "./icon.png" },
        quicklookurl: url
    };
}

/**
 * Creates an Alfred message item (for errors, warnings, info)
 * @param {string} title - Message title
 * @param {string} subtitle - Message subtitle
 * @param {boolean} valid - Whether the item is actionable
 * @returns {string} JSON string for Alfred Script Filter
 */
function createMessage(title, subtitle, valid = false) {
    return JSON.stringify({
        items: [{
            title,
            subtitle,
            valid
        }]
    });
}

/**
 * Collects all tabs from Safari windows into a Map
 * @param {Object} safari - Safari application object
 * @returns {Map} Map of URLs to tab data with counts
 */
function collectTabs(safari) {
    const tabsMap = new Map();

    try {
        // Single API call to get all windows array
        const windows = safari.windows;

        // Early return if no windows
        if (!windows || windows.length === 0) {
            return tabsMap;
        }

        // Process each window
        const windowCount = windows.length;
        for (let i = 0; i < windowCount; i++) {
            const window = windows[i];

            // Single API call to get all tabs array for this window
            const tabs = window.tabs;

            // Skip if no tabs in window
            if (!tabs || tabs.length === 0) continue;

            // Process each tab
            const tabCount = tabs.length;
            for (let j = 0; j < tabCount; j++) {
                const tabData = extractTabData(tabs[j]);
                if (!tabData) continue;

                const { url, title, matchString } = tabData;

                // Update existing or add new entry
                const existing = tabsMap.get(url);
                if (existing) {
                    existing.count++;
                } else {
                    tabsMap.set(url, {
                        title,
                        matchString,
                        count: 1
                    });
                }
            }
        }
    } catch (e) {
        // Return partial results on error
    }

    return tabsMap;
}

/**
 * Converts tabs Map into Alfred items array
 * @param {Map} tabsMap - Map of URLs to tab data
 * @returns {Object[]} Array of Alfred item objects
 */
function makeItems(tabsMap) {
    const items = [];

    for (const [url, data] of tabsMap) {
        const item = createAlfredItem(
            data.title,
            url,
            data.matchString,
            data.count
        );
        items.push(item);
    }

    return items;
}

/**
 * Main Alfred Script Filter entry point
 * @returns {string} JSON string for Alfred Script Filter
 */
function run() {
    const safari = Application("Safari");

    // Early return: Safari not running
    if (!safari.running()) {
        return createMessage(
            "Safari is not running",
            "Press enter to launch Safari"
        );
    }

    try {
        // Collect all tabs
        const tabsMap = collectTabs(safari);

        // Early return: No tabs found
        if (tabsMap.size === 0) {
            return createMessage(
                "No tabs found",
                "No open tabs in Safari"
            );
        }

        // Convert to Alfred items
        const items = makeItems(tabsMap);

        return JSON.stringify({ items });

    } catch (e) {
        return createMessage(
            "Error fetching tabs",
            `Failed to get Safari tabs: ${e.message}`
        );
    }
}
