/*
 * Closes all Safari tabs that match the provided URL.
 *
 * This script is designed to be run from an Alfred workflow.
 * It expects a URL as its first and only argument.
 *
 * @param {string[]} argv - An array of arguments, where argv[0] is the URL.
 */

/**
 * Finds and closes all tabs in Safari that match the given URL.
 * @param {object} safari - The Safari Application object.
 * @param {string} urlToClose - The URL of the tabs to close.
 * @returns {number} The number of tabs that were closed.
 */
function closeTabsForURL(safari, urlToClose) {
	// Use 'whose' to find all tabs with the matching URL across all windows.
	const tabsToClose = safari.windows.tabs.whose({ url: urlToClose })();

	const closedTabsCount = tabsToClose.length;

	if (closedTabsCount > 0) {
		// Iterate backwards to safely close tabs.
		for (let i = closedTabsCount - 1; i >= 0; i--) {
			tabsToClose[i].close();
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
