#!/usr/bin/env osascript -l JavaScript

function run(argv) {
    if (!argv || argv.length === 0) {
        return "No URL provided";
    }
    var targetUrl = argv[0].trim();
    var safari = Application('Safari');
    var closed = false;

    safari.windows().forEach(function(win) {
        // Robust check for private window (if property exists)
        var isPrivate = false;
        try {
            isPrivate = (typeof win.privateBrowsing === 'function') ? win.privateBrowsing() : false;
        } catch (e) {
            isPrivate = false;
        }
        if (!isPrivate) {
            var tabs = win.tabs();
            for (var i = tabs.length - 1; i >= 0; i--) {
                var tabUrl = (tabs[i].url() || '').trim();
                if (tabUrl === targetUrl) {
                    tabs[i].close();
                    closed = true;
                }
            }
        }
    });

    if (closed) {
        return "closed";
    } else {
        return "No matching tab found in normal windows";
    }
}
