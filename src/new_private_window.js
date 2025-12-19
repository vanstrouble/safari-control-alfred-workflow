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

/**
 * Parses and validates a URL from script arguments.
 * @param {string[]} argv - The script arguments.
 * @returns {string|null} The formatted URL or null if invalid.
 */
function parseUrl(argv) {
	if (!argv || argv.length === 0) {
		return null;
	}

	const rawUrl = argv.join(" ");

	// Basic validation: reject multi-word inputs, require a dot for it to be a URL.
	if (rawUrl.includes(" ") || !rawUrl.includes(".")) {
		return null;
	}

	// Add http protocol if it's missing.
	if (!/^(https?:\/\/)/i.test(rawUrl)) {
		return "http://" + rawUrl;
	}

	return rawUrl;
}

function run(argv) {
	"use strict";

	const url = parseUrl(argv);

	const safari = Application("Safari");
	safari.includeStandardAdditions = true;

	const safariWasRunning = safari.running();
	safari.activate();

	// If Safari wasn't running, it opens a new window by default. Close it.
	if (!safariWasRunning && safari.windows.length > 0) {
		// A small delay might be needed for the window to be ready to close.
		delay(0.1);
		safari.windows[0].close();
	}

	const sysEvents = Application("System Events");
	sysEvents.keystroke("n", { using: ["command down", "shift down"] });

	if (url) {
		delay(0.5);
		safari.windows[0].currentTab.url = url;
	}
}
