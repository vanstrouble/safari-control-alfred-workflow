#!/usr/bin/env osascript -l JavaScript

/**
 * Closes all Safari tabs matching a given URL
 */
function run(argv) {
	if (!argv?.[0]) {
		return "Error: No URL was provided.";
	}
	const targetUrl = argv[0];

	try {
		const safari = Application("Safari");
		const allWindows = safari.windows();

		let closedCount = 0;

		for (let i = 0; i < allWindows.length; i++) {
			const window = allWindows[i];

			try {
				const matchingTabs = window.tabs.whose({ url: targetUrl })();

				// Close all matching tabs in reverse order
				for (let j = matchingTabs.length - 1; j >= 0; j--) {
					try {
						matchingTabs[j].close();
						closedCount++;
					} catch (e) {
						continue;
					}
				}
			} catch (e) {
				continue;
			}
		}

		if (closedCount > 0) {
			return `Successfully closed ${closedCount} tab${
				closedCount > 1 ? "s" : ""
			}.`;
		} else {
			return "No tabs found with the provided URL.";
		}
	} catch (e) {
		return `An error occurred: ${e.message}`;
	}
}
