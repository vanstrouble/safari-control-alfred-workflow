#!/usr/bin/env osascript -l JavaScript

function run() {
    try {
        // Check if Safari is running
        if (!Application("Safari").running()) {
            return "Safari is not running";
        }

        // Check if Safari is the frontmost application
        const frontmostApp = Application("System Events").applicationProcesses.whose({frontmost: true})[0].name();

        if (frontmostApp !== "Safari") {
            return "Safari must be the active application";
        }

        const safari = Application("Safari");

        // Check if there are any windows
        if (safari.windows.length === 0) {
            return "No open windows in Safari";
        }

        // Get the current tab's URL - use frontmost window
        const frontWindow = safari.windows.whose({ index: 1 })[0];
        const currentTab = frontWindow.currentTab;

        if (!currentTab || !currentTab.url() || currentTab.url() === "") {
            return "The current tab has no URL (may be a new empty tab)";
        }

        // For valid URLs, trim and return the URL directly without any whitespace
        return currentTab.url().trim();

    } catch (e) {
        return "Error retrieving the URL from Safari: " + e.message;
    }
}
