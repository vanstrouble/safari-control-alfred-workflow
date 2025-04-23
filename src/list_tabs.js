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
        const safari = Application("Safari");
        const tabsMap = new Map();
        const windowCount = safari.windows.length;

        // Predefined regular expressions
        const protocolRegex = /(^\w+:|^)\/\//;
        const nonWordRegex = /[^\w]/g;

        // A single loop to process all tabs
        for (let i = 0; i < windowCount; i++) {
            const window = safari.windows[i];
            let windowIndex;

            try {
                windowIndex = window.index();
            } catch (e) {
                windowIndex = i + 1;
            }

            const tabsLength = window.tabs.length;

            for (let j = 0; j < tabsLength; j++) {
                try {
                    const tab = window.tabs[j];
                    const title = tab.name() || "";
                    const url = tab.url() || "about:blank";

                    // If we already processed this URL, just increment the counter
                    if (tabsMap.has(url)) {
                        const data = tabsMap.get(url);
                        data.count++;
                        tabsMap.set(url, data);
                        continue;
                    }

                    // Process new URL
                    const matchUrl = url.replace(protocolRegex, "");
                    let decodedUrl;

                    try {
                        decodedUrl = decodeURIComponent(matchUrl);
                    } catch (e) {
                        decodedUrl = matchUrl;
                    }

                    const cleanUrl = decodedUrl.replace(nonWordRegex, " ");
                    const matchString = `${title} ${cleanUrl}`;

                    // Save information in the map
                    tabsMap.set(url, {
                        count: 1,
                        item: {
                            uid: `${windowIndex}-${j + 1}`,
                            title: title,
                            subtitle: url,
                            arg: url,
                            match: matchString,
                            icon: { path: "./icon.png" },
                            quicklookurl: url
                        }
                    });
                } catch (e) {
                    continue;
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
