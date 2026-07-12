#!/usr/bin/env osascript -l JavaScript

// JXA script to open new Safari windows with profile and URL support.
//
// Usage:
// ./new_window.js [x<count>] || [profile-menu:<menu item>] || [p<profile>] || [url]
//
// Examples:
// ./new_window.js                  -> Opens 1 new window.
// ./new_window.js example.com      -> Opens 1 new window with URL.
// ./new_window.js x3               -> Opens 3 new windows.
// ./new_window.js "profile-menu:New Work Window" -> Opens the Work profile.
// ./new_window.js p2               -> Opens profile 2 using Safari's shortcut.

ObjC.import("stdlib");

function getConfiguredProfileName(profile) {
	const value = $.getenv(`profile${profile}`);
	return value ? value.toString().trim() : "";
}

/**
 * Parses script arguments to determine window count, profile, or URL.
 * @param {string[]} argv - The script arguments.
 * @returns {{windowCount: number, profile: string|null, profileName: string|null, profileMenuItem: string|null, url: string|null}}
 */
function parseArgs(argv) {
	const config = {
		windowCount: 1,
		profile: null,
		profileName: null,
		profileMenuItem: null,
		url: null,
	};

	if (!argv || argv.length === 0) {
		return config;
	}

	const firstArg = argv[0];
	const input = argv.join(" ");

	if (input.startsWith("profile-menu:")) {
		config.profileMenuItem = input.slice("profile-menu:".length).trim();
	} else if (/^x[0-9]+$/.test(firstArg)) {
		// Parse window count (e.g., "x3"), capped at 10.
		const count = parseInt(firstArg.substring(1), 10);
		config.windowCount = Math.max(1, Math.min(count, 10));
	} else if (/^p[1-5]$/.test(firstArg)) {
		// Parse profile (e.g., "p2")
		config.profile = firstArg.substring(1);
		config.profileName = getConfiguredProfileName(config.profile);
	} else {
		// The rest is the URL
		const rawUrl = argv.join(" ");
		// Basic validation and formatting
		if (!rawUrl.includes(" ") && rawUrl.includes(".")) {
			if (!/^(https?:\/\/)/i.test(rawUrl)) {
				config.url = "http://" + rawUrl;
			} else {
				config.url = rawUrl;
			}
		}
	}

	return config;
}

function waitFor(predicate, timeout) {
	const started = Date.now();

	while (Date.now() - started < timeout) {
		try {
			if (predicate()) return true;
		} catch (e) {}
		delay(0.05);
	}

	return false;
}

function run(argv) {
	"use strict";

	// Initialize applications
	const Safari = Application("Safari");
	const SystemEvents = Application("System Events");
	Safari.includeStandardAdditions = true;

	// --- Argument Parsing ---
	const { windowCount, profile, profileName, profileMenuItem, url } =
		parseArgs(argv);

	// --- Safari Automation ---

	const safariWasRunning = Safari.running();

	if (!safariWasRunning) {
		Safari.activate();
		waitFor(() => Safari.windows.length > 0, 5000);
	} else if (!profileMenuItem) {
		Safari.activate();
	}

	const getFileMenu = () => {
		const safariProcess = SystemEvents.processes.byName("Safari");
		try {
			return safariProcess.menuBars[0].menuBarItems.byName("File").menus[0];
		} catch (e) {
			return safariProcess.menuBars[0].menuBarItems()[2].menus[0];
		}
	};

	const clickProfileMenuItem = (menuTitle) => {
		try {
			const profileMenu = getFileMenu().menuItems[0].menus[0];
			const menuItem = profileMenu.menuItems.byName(menuTitle);
			if (!menuItem.exists()) return false;
			menuItem.click();
			return true;
		} catch (e) {
			return false;
		}
	};

	const openInProfile = (p, name, menuTitle) => {
		const beforeCount = Safari.windows.length;

		if (menuTitle) {
			if (!clickProfileMenuItem(menuTitle)) return false;

			const opened = waitFor(() => Safari.windows.length > beforeCount, 3000);
			if (opened) Safari.activate();
			return opened;
		}

		// Use Safari's profile shortcut first.
		SystemEvents.keystroke(p, {
			using: ["option down", "shift down", "command down"],
		});

		if (waitFor(() => Safari.windows.length > beforeCount, 1500)) {
			return true;
		}

		if (name && clickProfileMenuItem(`New ${name} Window`)) {
			return waitFor(() => Safari.windows.length > beforeCount, 3000);
		}

		return false;
	};

	const openStandardWindow = (u) => {
		const doc = Safari.Document().make();
		if (u) {
			doc.url = u;
		}
	};

	// --- Main Logic ---

	let windowsToCreate = windowCount;

	// If Safari wasn't running, it was just launched, creating one window.
	if (!safariWasRunning) {
		if (profile || profileMenuItem) {
			// The auto-opened window is in the default profile. Close it.
			try {
				Safari.windows[0].close();
			} catch (e) {
				/* Ignore */
			}
		} else {
			// One window is already open. Set its URL if provided.
			if (url) {
				try {
					Safari.windows[0].currentTab.url = url;
				} catch (e) {
					/* Ignore */
				}
			}
			windowsToCreate--; // Account for the already-opened window.
		}
	}

	// Create the required number of windows.
	for (let i = 0; i < windowsToCreate; i++) {
		if (profile || profileMenuItem) {
			if (!openInProfile(profile, profileName, profileMenuItem)) {
				throw new Error(
					`Could not open Safari profile ${profileMenuItem || profile}${
						profileName ? ` (${profileName})` : ""
					}. Check Alfred Accessibility permission and the Safari profile menu name.`
				);
			}
		} else {
			openStandardWindow(url);
		}
		// Small delay between multiple windows
		if (windowsToCreate > 1 && i < windowsToCreate - 1) {
			delay(0.2);
		}
	}
}
