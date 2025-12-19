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

/**
 * Parses script arguments to determine window count, profile, or URL.
 * @param {string[]} argv - The script arguments.
 * @returns {{windowCount: number, profile: string|null, url: string|null}}
 */
function parseArgs(argv) {
	const config = {
		windowCount: 1,
		profile: null,
		url: null,
	};

	if (!argv || argv.length === 0) {
		return config;
	}

	const firstArg = argv[0];

	if (/^x[0-9]+$/.test(firstArg)) {
		// Parse window count (e.g., "x3"), capped at 10.
		const count = parseInt(firstArg.substring(1), 10);
		config.windowCount = Math.max(1, Math.min(count, 10));
	} else if (/^p[1-5]$/.test(firstArg)) {
		// Parse profile (e.g., "p2")
		config.profile = firstArg.substring(1);
	} else {
		// The rest is the URL
		const rawUrl = argv.join(" ");
		// Basic validation and formatting
		if (!rawUrl.includes(" ") && rawUrl.includes(".")) {
			if (!/^(https?:\/\/)/i.test(rawUrl)) {
				config.url = "http://" + rawUrl;
			} else {
				config.url = rawUrl;
			}
		}
	}

	return config;
}

function run(argv) {
	"use strict";

	// Initialize applications
	const Safari = Application("Safari");
	const SystemEvents = Application("System Events");
	Safari.includeStandardAdditions = true;

	// --- Argument Parsing ---
	const { windowCount, profile, url } = parseArgs(argv);

	// --- Safari Automation ---

	const safariWasRunning = Safari.running();

	// Ensure Safari is running and activate it
	if (!safariWasRunning) {
		Safari.activate(); // This will open one window
		delay(0.5);
	} else {
		Safari.activate();
	}

	const openInProfile = (p) => {
		// Use keyboard shortcut to switch to the selected profile
		// Option + Shift + Command + n
		SystemEvents.keystroke(p, {
			using: ["option down", "shift down", "command down"],
		});
		delay(0.5); // Wait for the new window to appear
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
			} catch (e) {
				/* Ignore */
			}
		} else {
			// One window is already open. Set its URL if provided.
			if (url) {
				try {
					Safari.windows[0].currentTab.url = url;
				} catch (e) {
					/* Ignore */
				}
			}
			windowsToCreate--; // Account for the already-opened window.
		}
	}

	// Create the required number of windows.
	for (let i = 0; i < windowsToCreate; i++) {
		if (profile) {
			openInProfile(profile);
		} else {
			openStandardWindow(url);
		}
		// Small delay between multiple windows
		if (windowsToCreate > 1 && i < windowsToCreate - 1) {
			delay(0.2);
		}
	}
}
