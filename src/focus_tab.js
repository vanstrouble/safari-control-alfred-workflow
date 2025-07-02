#!/usr/bin/env osascript -l JavaScript

function run(argv) {
    const targetUrl = argv[0];

    try {
        const safari = Application("Safari");

        // Ensure Safari is running
        if (!safari.running()) {
            safari.activate();
            delay(0.5);
        }

        let foundTab = false;
        let foundWindow = null;

        // Search in all windows and tabs
        for (let i = 0; i < safari.windows.length; i++) {
            const window = safari.windows[i];

            // Verify that the window has tabs
            if (!window.tabs || window.tabs.length === 0) continue;

            for (let j = 0; j < window.tabs.length; j++) {
                const tab = window.tabs[j];
                const url = tab.url() || "";

                // Compare URLs
                if (url === targetUrl) {
                    // Set this tab as active
                    window.currentTab = tab;
                    foundTab = true;
                    foundWindow = window;
                    break;
                }
            }

            if (foundTab) break;
        }

        // If we found the tab, activate Safari and bring the window to the front
        if (foundTab && foundWindow) {
            // Activate Safari first
            safari.activate();

            delay(0.2); // Allow Safari to activate

            // Simply make the window the frontmost window without toggling visibility
            foundWindow.index = 1; // This makes the window the frontmost window

            return "Tab focused successfully";
        } else {
            // If we didn't find the tab, open the URL in a new tab
            safari.activate();
            safari.openLocation(targetUrl);
            return "URL opened in a new tab";
        }
    } catch (e) {
        return `Error: ${e.message}`;
    }
}
