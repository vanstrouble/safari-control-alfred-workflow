#!/usr/bin/env osascript -l JavaScript

/**
 * Opens new safari private windows with optional URL.
 *
 * Usage:
 * ./new_private_window.js [url]
 *
 * Examples:
 * ./new_private_window.js          -> Opens 1 new private window.
 * ./new_private_window.js google.com -> Opens 1 new private window with URL.
 */
function run(argv) {
    "use strict";

    // --- Argument Parsing ---
    let url = null;

    // The arguments form the URL
    if (argv.length > 0) {
        const rawUrl = argv.join(" ");
        // Basic validation and formatting
        if (rawUrl && !rawUrl.includes(" ") && rawUrl.includes(".")) {
            if (
                !rawUrl.startsWith("http://") &&
                !rawUrl.startsWith("https://")
            ) {
                url = "http://" + rawUrl;
            } else {
                url = rawUrl;
            }
        }
    }

    // --- Application Setup ---
    const safari = Application("Safari");
    safari.includeStandardAdditions = true;

    // --- safari Automation ---
    const safariWasRunning = safari.running();
    console.log(`Safari was running: ${safariWasRunning}`);

    safari.activate();

    // If Safari wasn't running, it opens a new window by default. Close it.
    if (!safariWasRunning && safari.windows.length > 0) {
        // Give it a moment to make sure the window is ready to be closed.
        delay(0.2);
        safari.windows[0].close();
    }

    // Create a new private window.
    // This is done via UI scripting as there is no direct API.
    const sysEvents = Application("System Events");
    sysEvents.keystroke("n", { using: ["command down", "shift down"] });

    // If a URL was provided, set it in the new window.
    if (url) {
        // Give Safari a moment to open the new window.
        delay(0.5);
        safari.windows[0].currentTab.url = url;
    }
}
