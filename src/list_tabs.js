#!/usr/bin/env osascript -l JavaScript

function run() {
    if (!Application("Safari").running()) {
        return JSON.stringify({
            items: [{
                title: "Safari is not running",
                subtitle: "Press enter to launch Safari",
                valid: false
            }]
        });
    }

    try {
        let safari = Application("Safari");
        let items = [];
        let tabsMap = {};  // We will use this to track unique URLs and count occurrences

        // Collect all tabs at once
        let windowCount = safari.windows.length;

        // First step: count all tabs with the same URL
        for (let i = 0; i < windowCount; i++) {
            let window = safari.windows[i];
            let tabsLength = window.tabs.length;

            for (let j = 0; j < tabsLength; j++) {
                try {
                    let tab = window.tabs[j];
                    let url = tab.url() || "about:blank";

                    if (tabsMap[url]) {
                        tabsMap[url].count++;
                    } else {
                        tabsMap[url] = {
                            count: 1,
                            processed: false
                        };
                    }
                } catch (e) {
                    continue;
                }
            }
        }

        // Second step: create the items for Alfred
        for (let i = 0; i < windowCount; i++) {
            let window = safari.windows[i];
            let windowIndex;

            try {
                windowIndex = window.index();
            } catch (e) {
                windowIndex = i + 1;
            }

            let tabsLength = window.tabs.length;

            for (let j = 0; j < tabsLength; j++) {
                try {
                    let tab = window.tabs[j];
                    let title = tab.name() || "";
                    let url = tab.url() || "about:blank";

                    // Skip if we already processed this URL
                    if (tabsMap[url].processed) {
                        continue;
                    }

                    // Create match string for better search
                    let matchUrl = url.replace(/(^\w+:|^)\/\//, "");
                    let decodedUrl;

                    try {
                        decodedUrl = decodeURIComponent(matchUrl);
                    } catch (e) {
                        decodedUrl = matchUrl;
                    }

                    let cleanUrl = decodedUrl.replace(/[^\w]/g, " ");
                    let matchString = title + " " + cleanUrl;

                    // Create an informative subtitle
                    let subtitle = url;
                    if (tabsMap[url].count > 1) {
                        subtitle += ` (${tabsMap[url].count} tabs)`;
                    }

                    // Add this tab to the items array
                    let item = {
                        uid: windowIndex + "-" + (j + 1),
                        title: title,
                        subtitle: subtitle,
                        arg: url, // Only using URL as argument
                        match: matchString,
                        icon: { path: "./icon.png" },
                        quicklookurl: url
                    };

                    items.push(item);
                    tabsMap[url].processed = true; // Mark this URL as processed
                } catch (e) {
                    continue; // Skip this tab if there is an error
                }
            }
        }

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

        return JSON.stringify({ items: items });
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
