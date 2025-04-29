#!/usr/bin/env osascript -l JavaScript

function run() {
    try {
        // Check if Safari is running
        if (!Application("Safari").running()) {
            return JSON.stringify({
                items: [{
                    title: "Error",
                    subtitle: "Safari is not running",
                    valid: false
                }]
            });
        }

        // Check if Safari is the frontmost application
        const frontmostApp = Application("System Events").applicationProcesses.whose({frontmost: true})[0].name();

        if (frontmostApp !== "Safari") {
            return JSON.stringify({
                items: [{
                    title: "Error",
                    subtitle: "Safari must be the active application",
                    valid: false
                }]
            });
        }

        const safari = Application("Safari");

        // Check if there are any windows
        if (safari.windows.length === 0) {
            return JSON.stringify({
                items: [{
                    title: "Error",
                    subtitle: "There are no open windows in Safari",
                    valid: false
                }]
            });
        }

        // Get the current tab's URL - use frontmost window
        const frontWindow = safari.windows.whose({ index: 1 })[0];
        const currentTab = frontWindow.currentTab;

        if (!currentTab || !currentTab.url() || currentTab.url() === "") {
            return JSON.stringify({
                items: [{
                    title: "Error",
                    subtitle: "The current tab has no URL (may be a new empty tab)",
                    valid: false
                }]
            });
        }

        // For valid URLs, trim and return the URL directly without any whitespace
        return currentTab.url().trim();

    } catch (e) {
        return JSON.stringify({
            items: [{
                title: "Error",
                subtitle: "Error retrieving the URL from Safari: " + e.message,
                valid: false
            }]
        });
    }
}
