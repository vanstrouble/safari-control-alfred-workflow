#!/usr/bin/env osascript -l JavaScript

// JXA script to open new Safari windows with profile, URL, and multi-window support.
//
// Usage:
// ./new_window.js [x<count>] || [p<profile>] || [url]
//
// Examples:
// ./new_window.js                  -> Opens 1 new window.
// ./new_window.js example.com      -> Opens 1 new window with URL.
// ./new_window.js x3               -> Opens 3 new windows.
// ./new_window.js p0               -> Opens 1 new window in the default profile.
// ./new_window.js p2               -> Opens 1 new window in profile 2.

ObjC.import("stdlib");
const Safari = Application("Safari");
const SystemEvents = Application("System Events");

/**
 * Parses script arguments to determine window count, profile, or URL.
 * @param {string[]} argv - The script arguments.
 * @returns {{windowCount: number, profile: string|null, url: string|null}}
 */
function parseArgs(argv) {
	const config = { windowCount: 1, profile: null, url: null };
	if (!argv || argv.length === 0) return config;

	const firstArg = argv[0];
	if (/^x\d+$/.test(firstArg)) {
		config.windowCount = Math.max(1, Math.min(parseInt(firstArg.slice(1), 10), 10));
		return config;
	}

	if (/^p[0-9]$/.test(firstArg)) {
		config.profile = firstArg.slice(1);
		return config;
	}

	const rawUrl = argv.join(" ");
	if (!rawUrl.includes(" ") && rawUrl.includes(".")) {
		config.url = /^(https?:\/\/)/i.test(rawUrl) ? rawUrl : `http://${rawUrl}`;
	}

	return config;
}

function run(argv) {
	"use strict";

	// Initialize applications
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
		delay(0.3);
	}

	const openProfileWindow = (p) => {
		const beforeCount = Safari.windows.length;
		SystemEvents.keystroke(p, {
			using: ["option down", "shift down", "command down"],
		});
		delay(0.8);
		return Safari.windows.length > beforeCount;
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
			if (!openProfileWindow(profile)) {
				throw new Error(`Could not open Safari profile ${profile}. Check Alfred Accessibility permission and the Safari profile hotkey.`);
			}
		} else {
			openStandardWindow(url);
		}
		// Small delay between multiple windows
		if (windowsToCreate > 1 && i < windowsToCreate - 1) {
			delay(0.2);
		}
	}
}
