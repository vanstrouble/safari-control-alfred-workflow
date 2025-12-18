#!/usr/bin/env osascript -l JavaScript

/**
 * Closes all Safari tabs matching a given URL, except for the currently active tab.
 *
 * @param {string[]} argv - Command-line arguments, where argv[0] is the target URL.
 * @returns {string} A message indicating the result of the operation.
 */
function run(argv) {
    if (!argv || argv.length === 0 || !argv[0]) {
        return "Error: No URL was provided.";
    }
    const targetUrl = argv[0];

    try {
        const safari = Application("Safari");

        // Get the frontmost, visible window in a more reliable way
        const frontWindow = safari.windows.whose({ visible: true })[0];
        if (!frontWindow) {
            return "Error: Could not find an active Safari window.";
        }
        const activeTab = frontWindow.currentTab;

        // Ensure the active tab's URL matches the target
        if (activeTab.url() !== targetUrl) {
            return "Error: The active tab does not match the provided URL. No tabs were closed.";
        }

        let closedCount = 0;
        const allWindows = safari.windows();

        // Iterate backwards through all windows and tabs
        for (let i = allWindows.length - 1; i >= 0; i--) {
            const window = allWindows[i];
            const tabs = window.tabs;
            for (let j = tabs.length - 1; j >= 0; j--) {
                const tab = tabs[j];
                // Use try-catch for each tab to prevent errors on special tabs (e.g., "Top Sites")
                try {
                    if (tab.url() === targetUrl && tab.id() !== activeTab.id()) {
                        tab.close();
                        closedCount++;
                    }
                } catch (e) {
                    // Ignore tabs that can't be accessed or closed
                    continue;
                }
            }
        }

        if (closedCount > 0) {
            return `Successfully closed ${closedCount} duplicate tab${closedCount > 1 ? 's' : ''}.`;
        } else {
            return "No duplicate tabs found to close.";
        }

    } catch (e) {
        return `An error occurred: ${e.message}`;
    }
}
