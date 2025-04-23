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

        // Iterate through all windows
        for (let i = 0; i < safari.windows.length; i++) {
            let window = safari.windows[i];
            let windowIndex;

            try {
                windowIndex = window.index();
            } catch (e) {
                windowIndex = i + 1;
            }

            // Iterate through all tabs in this window
            for (let j = 0; j < window.tabs.length; j++) {
                try {
                    let tab = window.tabs[j];
                    let title = tab.name() || "";
                    let url = tab.url() || "about:blank";

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

                    // Add this tab to the array
                    items.push({
                        uid: windowIndex + "-" + (j + 1),
                        title: title,
                        subtitle: url,
                        arg: windowIndex + "," + url,
                        match: matchString,
                        icon: { path: "./icon.png" },
                        quicklookurl: url
                    });
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
