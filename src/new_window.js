#!/usr/bin/env osascript -l JavaScript

// JXA script to open new Safari windows with profile and URL support.
//
// Usage:
// ./new_window.js [x<count>] || [p<profile>] || [url]
//
// Examples:
// ./new_window.js                  -> Opens 1 new window.
// ./new_window.js example.com      -> Opens 1 new window with URL.
// ./new_window.js x3               -> Opens 3 new windows.
// ./new_window.js p2               -> Opens 1 new window in profile 2.

function run(argv) {
    'use strict';

    // Initialize applications
    const Safari = Application("Safari");
    const SystemEvents = Application("System Events");
    Safari.includeStandardAdditions = true;

    // --- Argument Parsing ---
    let windowCount = 1;
    let profile = null;
    let url = null;

    const args = [...argv]; // Create a mutable copy

    // The script only handles one argument type at a time (count, profile, or URL).
    if (args.length > 0) {
        const firstArg = args[0];
        if (firstArg.match(/^x[0-9]+$/)) {
            // Parse window count (e.g., "x3")
            const count = parseInt(firstArg.substring(1), 10);
            if (count > 0 && count <= 10) {
                windowCount = count;
            } else if (count > 10) {
                windowCount = 10; // Cap at 10
            }
        } else if (firstArg.match(/^p[1-5]$/)) {
            // Parse profile (e.g., "p2")
            profile = firstArg.substring(1);
        } else {
            // The rest is the URL
            const rawUrl = args.join(' ');
            // Basic validation and formatting
            if (rawUrl && !rawUrl.includes(' ')) {
                if (rawUrl.includes('.') && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
                    url = 'http://' + rawUrl;
                } else if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
                    url = rawUrl;
                }
            }
        }
    }

    // --- Safari Automation ---

    const safariWasRunning = Safari.running();

    // Ensure Safari is running and activate it
    if (!safariWasRunning) {
        Safari.activate(); // This will open one window
        delay(0.5);
    } else {
        Safari.activate();
    }

    const openInProfile = (p, u) => {
        // Use keyboard shortcut to switch to the selected profile
        // Option + Shift + Command + n
        SystemEvents.keystroke(p, { using: ["option down", "shift down", "command down"] });
        delay(0.5); // Wait for the new window to appear

        // If a URL is provided, set it
        if (u) {
            try {
                // The new window should be the frontmost one
                Safari.windows[0].currentTab.url = u;
            } catch (e) {
                // Fallback if setting URL fails
            }
        }
    };

    const openStandardWindow = (u) => {
        const doc = Safari.Document().make();
        if (u) {
            doc.url = u;
        }
    };

    // --- Main Logic ---

    let windowsToCreate = windowCount;

    // If Safari wasn't running, it was just launched, creating one window.
    if (!safariWasRunning) {
        if (profile) {
            // The auto-opened window is in the default profile. Close it.
            try {
                Safari.windows[0].close();
                delay(0.2);
            } catch (e) { /* Ignore */ }
        } else {
            // One window is already open. Set its URL if provided.
            if (url) {
                try {
                    Safari.windows[0].currentTab.url = url;
                } catch (e) { /* Ignore */ }
            }
            windowsToCreate--; // Account for the already-opened window.
        }
    }

    // Create the required number of windows.
    for (let i = 0; i < windowsToCreate; i++) {
        if (profile) {
            openInProfile(profile, url);
        } else {
            openStandardWindow(url);
        }
        // Small delay between multiple windows
        if (windowsToCreate > 1 && i < windowsToCreate - 1) {
            delay(0.2);
        }
    }
}
