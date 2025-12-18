#!/usr/bin/env osascript -l JavaScript

/**
 * Focuses a Safari tab by URL
 * @param {string[]} argv - Command line arguments
 * @returns {string} Result message
 */
function run(argv) {
    if (!argv || argv.length === 0 || !argv[0]) {
        return "Error: No URL provided";
    }

    const targetUrl = argv[0];

    try {
        const safari = Application("Safari");
        if (!safari.running()) {
            return "Error: Safari is not running.";
        }

        const allWindows = safari.windows();

        // Search through all windows in a single loop
        for (let i = 0; i < allWindows.length; i++) {
            const window = allWindows[i];
            try {
                // Use whose() to find matching tabs in the current window
                const matchingTabs = window.tabs.whose({ url: targetUrl })();

                if (matchingTabs.length > 0) {
                    // If a match is found, make the window visible, set the tab, and activate Safari
                    window.visible = true;
                    window.currentTab = matchingTabs[0];
                    safari.activate();
                    return "Tab focused successfully"; // Exit immediately after finding the first match
                }
            } catch (e) {
                // Ignore windows that might cause errors (e.g., special states) and continue
                continue;
            }
        }

        // If the loop completes without finding a tab
        return "Error: Tab not found";
    } catch (e) {
        return `Error: ${e.message}`;
    }
}
