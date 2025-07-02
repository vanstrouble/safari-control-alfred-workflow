#!/usr/bin/env osascript -l JavaScript

// Helper function to process tab data
function getTabData(tab, protocolRegex, nonWordRegex) {
    try {
        const title = tab.name() || "";
        const url = tab.url() || "about:blank";

        // Process URL
        const matchUrl = url.replace(protocolRegex, "");
        let decodedUrl;

        try {
            decodedUrl = decodeURIComponent(matchUrl);
        } catch (e) {
            decodedUrl = matchUrl;
        }

        const cleanUrl = decodedUrl.replace(nonWordRegex, " ");
        const matchString = `${title} ${cleanUrl}`;

        return {
            url,
            data: {
                count: 1,
                item: {
                    title: title,
                    subtitle: url,
                    arg: url,
                    match: matchString,
                    icon: { path: "./icon.png" },
                    quicklookurl: url
                }
            }
        };
    } catch (e) {
        return null;
    }
}

function run() {
    // Cache Safari application object to reduce overhead
    const safari = Application("Safari");

    if (!safari.running()) {
        return JSON.stringify({
            items: [{
                title: "Safari is not running",
                subtitle: "Press enter to launch Safari",
                valid: false
            }]
        });
    }

    try {
        const tabsMap = new Map();
        const items = []; // Pre-allocate final array

        // Predefined regular expressions
        const protocolRegex = /(^\w+:|^)\/\//;
        const nonWordRegex = /[^\w]/g;

        // Single-pass processing: build map and array simultaneously
        const windows = safari.windows();
        for (const window of windows) {
            for (const tab of window.tabs()) {
                const tabData = getTabData(tab, protocolRegex, nonWordRegex);
                if (!tabData) continue;

                const { url, data } = tabData;

                if (tabsMap.has(url)) {
                    // URL already exists: increment count and update existing item
                    const existingData = tabsMap.get(url);
                    existingData.count++;

                    // Update the item subtitle directly in the items array
                    const existingItem = existingData.item;
                    existingItem.subtitle = existingItem.subtitle.replace(/ \(\d+ tabs\)$/, '') + ` (${existingData.count} tabs)`;

                } else {
                    // New URL: add to map and items array
                    tabsMap.set(url, data);
                    items.push(data.item);
                }
            }
        }

        // Early return for empty results
        if (items.length === 0) {
            return JSON.stringify({
                items: [{
                    title: "No tabs found",
                    subtitle: "No open tabs in Safari",
                    valid: false
                }]
            });
        }

        return JSON.stringify({ items });

    } catch (e) {
        return JSON.stringify({
            items: [{
                title: "Error",
                subtitle: "Failed to get Safari tabs: " + e.message,
                valid: false
            }]
        });
    }
}
