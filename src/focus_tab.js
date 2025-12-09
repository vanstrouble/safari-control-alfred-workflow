#!/usr/bin/env osascript -l JavaScript

/**
 * Focuses a Safari tab by URL
 * @param {string} targetUrl - URL of the tab to focus
 * @param {Object} safari - Safari application object
 * @returns {string|null} Success message or null
 */
function focusTab(targetUrl, safari) {
	const windows = safari.windows();

	for (let i = 0; i < windows.length; i++) {
		const window = windows[i];

		try {
			const matchingTabs = window.tabs.whose({ url: targetUrl });

			if (matchingTabs.length > 0) {
				safari.activate();

				window.visible = true;
				window.index = 1;

				window.currentTab = matchingTabs[0];

				return "Tab focused successfully";
			}
		} catch (e) {
			continue;
		}
	}

	return "Error: Tab not found";
}

/**
 * Main entry point
 * @param {string[]} argv - Command line arguments
 * @returns {string} Result message
 */
function run(argv) {
	if (!argv?.[0]) {
		return "Error: No URL provided";
	}

	const targetUrl = argv[0];

	try {
		const safari = Application("Safari");
		return focusTab(targetUrl, safari);
	} catch (e) {
		return `Error: ${e.message}`;
	}
}
