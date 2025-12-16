#!/usr/bin/env osascript -l JavaScript

/**
 * Finds and closes all tabs in Safari that match the given URL.
 * @param {object} safari - The Safari Application object.
 * @param {string} urlToClose - The URL of the tabs to close.
 * @returns {number} The number of tabs that were closed.
 */
function closeTabsForURL(safari, urlToClose) {
	let closedTabsCount = 0;

	// Get all windows as an array.
	const windows = safari.windows();

	// Iterate through each window.
	for (let i = 0; i < windows.length; i++) {
		// Use 'whose' to find matching tabs in this specific window.
		const tabsToClose = windows[i].tabs.whose({ url: urlToClose })();

		if (tabsToClose.length > 0) {
			// Close all matching tabs in this window.
			for (let j = tabsToClose.length - 1; j >= 0; j--) {
				tabsToClose[j].close();
				closedTabsCount++;
			}
		}
	}

	return closedTabsCount;
}

function run(argv) {
	'use strict';

	// The URL to close is passed as the first argument from Alfred.
	const urlToClose = argv.length > 0 ? argv[0] : null;

	if (!urlToClose) {
		// If no URL is provided, there's nothing to do.
		// We could return an error message for Alfred, but for this action,
		// it's better to just exit silently.
		return;
	}

	const safari = Application("Safari");
	safari.includeStandardAdditions = true;

	const closedTabsCount = closeTabsForURL(safari, urlToClose);

	// This message will be posted by Alfred after the script runs.
	if (closedTabsCount > 0) {
		return `Closed ${closedTabsCount} tab(s) for URL: ${urlToClose}`;
	}
}
