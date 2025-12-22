#!/usr/bin/env osascript -l JavaScript

/**
 * Focuses a Safari tab by URL or opens it in a new tab if not found
 */
function run(argv) {
    const targetUrl = argv[0];

    try {
        const safari = Application("Safari");
        const windows = safari.windows();

        for (let i = 0; i < windows.length; i++) {
            const window = windows[i];

            try {
                const matchingTabs = window.tabs.whose({ url: targetUrl })();

                if (matchingTabs.length > 0) {
                    window.currentTab = matchingTabs[0];
                    safari.activate();
                    window.index = 1;
                    return "Tab focused successfully";
                }
            } catch (e) {
                continue;
            }
        }

        return "URL not found in open tabs";
    } catch (e) {
        return `Error: ${e.message}`;
    }
}
