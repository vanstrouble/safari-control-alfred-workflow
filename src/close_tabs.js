/*
 * Closes all Safari tabs that match the provided URL.
 *
 * This script is designed to be run from an Alfred workflow.
 * It expects a URL as its first and only argument.
 *
 * @param {string[]} argv - An array of arguments, where argv[0] is the URL.
 */
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

	let closedTabsCount = 0;
	const tabsToClose = [];

	// We need to iterate through all windows and their tabs.
	const safariWindows = safari.windows();
	for (let i = 0; i < safariWindows.length; i++) {
		const window = safariWindows[i];
		const windowTabs = window.tabs();
		for (let j = 0; j < windowTabs.length; j++) {
			const tab = windowTabs[j];
			// Compare the tab's URL with the one we want to close.
			if (tab.url() === urlToClose) {
				tabsToClose.push(tab);
			}
		}
	}

	// Now, close the collected tabs.
	// We iterate backwards to avoid issues with modifying the collection
	// while iterating over it.
	if (tabsToClose.length > 0) {
		for (let i = tabsToClose.length - 1; i >= 0; i--) {
			tabsToClose[i].close();
			closedTabsCount++;
		}
	}

	// This message will be posted by Alfred after the script runs.
	return `Closed ${closedTabsCount} tab(s) for URL: ${urlToClose}`;
}
