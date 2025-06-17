#!/usr/bin/env osascript -l JavaScript

function run(argv) {
    try {
        var url = argv[0];
        if (!url) {
            return "No URL provided.";
        }

        var safari = Application("Safari");
        if (!safari.running()) {
            safari.activate();
            delay(0.5);
        }

        var found = false;
        var targetWindow = null;
        var windows = safari.windows;

    for (var i = 0; i < windows.length; i++) {
        const window = windows[i];
        if (!window.tabs || window.tabs.length === 0) continue;

        const tabs = window.tabs;
        for (var j = 0; j < tabs.length; j++) {
            if (tabs[j].url() === url) {
                window.currentTab = tabs[j];
                targetWindow = window;
                found = true;
                break;
            }
        }
        if (found) break;
    }

    if (found && targetWindow) {
        targetWindow.index = 1;
        safari.activate();
    } else {
        if (windows.length === 0) {
            safari.Document().make();
            delay(0.2);
        }
        safari.openLocation(url);
    }

    return "Success";
    } catch (e) {
        return `Error: ${e.message}`;
    }
}
