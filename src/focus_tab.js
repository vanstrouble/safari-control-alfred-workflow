#!/usr/bin/env osascript -l JavaScript

/**
 * Focuses a Safari tab by URL
 * @param {string} targetUrl - URL of the tab to focus
 * @param {Object} safari - Safari application object
 * @returns {string|null} Success message or null
 */
function focusTab(targetUrl, safari) {
	const windows = safari.windows();
	const windowsCount = windows.length;

	for (let i = 0; i < windowsCount; i++) {
		try {
			const window = windows[i];
			const matchingTabs = window.tabs.whose({ url: targetUrl });

			if (matchingTabs.length > 0) {
				safari.activate();
				window.index = 1;
				window.currentTab = matchingTabs[0];
				return "Tab focused successfully";
			}
		} catch (e) {
			continue;
		}
	}

	return null;
}

/**
 * Main entry point
 * @param {string[]} argv - Command line arguments
 * @returns {string} Result message
 */
function run(argv) {
	if (!argv || argv.length === 0 || !argv[0]) {
		return "Error: No URL provided";
	}

	const targetUrl = argv[0];

	try {
		const safari = Application("Safari");

		const result = focusTab(targetUrl, safari);

		if (result) {
			return result;
		}
	} catch (e) {
		return `Error: ${e.message}`;
	}
}
