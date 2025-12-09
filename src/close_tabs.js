#!/usr/bin/env osascript -l JavaScript

/**
 * Closes all Safari tabs matching a specific URL
 * @param {string} targetUrl - URL of the tabs to close
 * @param {Object} safari - Safari application object
 * @returns {string} Result message with count of closed tabs
 */
function closeTabs(targetUrl, safari) {
    const windows = safari.windows();
    let closedCount = 0;

    for (let i = 0; i < windows.length; i++) {
        const window = windows[i];

        try {
            const matchingTabs = window.tabs.whose({ url: targetUrl });

            // Cerrar todas las pestañas coincidentes en esta ventana
            for (let j = matchingTabs.length - 1; j >= 0; j--) {
                matchingTabs[j].close();
                closedCount++;
            }
        } catch (e) {
            continue;
        }
    }

    if (closedCount === 0) {
        return "Error: No matching tabs found";
    }

    return `Successfully closed ${closedCount} tab${closedCount > 1 ? 's' : ''}`;
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
        return closeTabs(targetUrl, safari);
    } catch (e) {
        return `Error: ${e.message}`;
    }
}
