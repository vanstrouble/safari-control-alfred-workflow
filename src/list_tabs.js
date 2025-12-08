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
                    autocomplete: title,
                    valid: true,
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

        // Predefined regular expressions
        const protocolRegex = /(^\w+:|^)\/\//;
        const nonWordRegex = /[^\w]/g;

        // Single-pass processing: build map only
        const windows = safari.windows();
        for (const window of windows) {
            for (const tab of window.tabs()) {
                const tabData = getTabData(tab, protocolRegex, nonWordRegex);
                if (!tabData) continue;

                const { url, data } = tabData;

                if (tabsMap.has(url)) {
                    // URL already exists: increment count only
                    tabsMap.get(url).count++;
                } else {
                    // New URL: add to map
                    tabsMap.set(url, data);
                }
            }
        }

        // Early return for empty results
        if (tabsMap.size === 0) {
            return JSON.stringify({
                items: [{
                    title: "No tabs found",
                    subtitle: "No open tabs in Safari",
                    valid: false
                }]
            });
        }

        // Format items with proper subtitles in a single pass
        const items = Array.from(tabsMap.values()).map(({ count, item }) => {
            if (count > 1) {
                item.subtitle = `${item.subtitle} (${count} tabs)`;
            }
            return item;
        });

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
