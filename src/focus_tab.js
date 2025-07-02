#!/usr/bin/env osascript -l JavaScript

function run(argv) {
    const targetUrl = argv[0];

    try {
        const safari = Application("Safari");

        // Search and activate in one step
        for (const window of safari.windows()) {
            try {
                const matchingTabs = window.tabs.whose({url: targetUrl});
                if (matchingTabs.length > 0) {
                    // Found it! Activate immediately
                    safari.activate();
                    delay(0.2);
                    window.index = 1;
                    window.currentTab = matchingTabs[0];
                    return "Tab focused successfully";
                }
            } catch (e) {
                console.log("Error: " + e.message);
            }
        }
    } catch (e) {
        return `Error: ${e.message}`;
    }
}
