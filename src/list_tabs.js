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

        // Predefined regular expressions
        const protocolRegex = /(^\w+:|^)\/\//;
        const nonWordRegex = /[^\w]/g;

        // Optimized loop using for...of
        for (const window of safari.windows()) {
            for (const tab of window.tabs()) {
                // Process the tab directly
                const tabData = getTabData(tab, protocolRegex, nonWordRegex);
                if (!tabData) continue;

                const { url, data } = tabData;

                // If we already processed this URL, just increment the counter
                if (tabsMap.has(url)) {
                    const existingData = tabsMap.get(url);
                    existingData.count++;
                    tabsMap.set(url, existingData);
                } else {
                    // Save new entry in the map
                    tabsMap.set(url, data);
                }
            }
        }

        // Create final array of items
        const items = Array.from(tabsMap.values()).map(data => {
            const item = data.item;
            if (data.count > 1) {
                item.subtitle = `${item.subtitle} (${data.count} tabs)`;
            }
            return item;
        });

        // If there are no tabs
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
