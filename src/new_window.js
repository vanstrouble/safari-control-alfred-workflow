#!/usr/bin/env osascript -l JavaScript

// JXA script to open new Safari windows with profile and URL support.
//
// Usage:
// ./new_window.js [x<count>] || [p<profile>] || [url]
//
// Examples:
// ./new_window.js                  -> Opens 1 new window.
// ./new_window.js example.com      -> Opens 1 new window with URL.
// ./new_window.js x3               -> Opens 3 new windows.
// ./new_window.js p2               -> Opens 1 new window in profile 2.

ObjC.import("stdlib");

function getConfiguredProfileName(profile) {
	const value = $.getenv(`profile${profile}`);
	return value ? value.toString().trim() : "";
}

/**
 * Parses script arguments to determine window count, profile, or URL.
 * @param {string[]} argv - The script arguments.
 * @returns {{windowCount: number, profile: string|null, profileName: string|null, url: string|null}}
 */
function parseArgs(argv) {
	const config = {
		windowCount: 1,
		profile: null,
		profileName: null,
		url: null,
	};

	if (!argv || argv.length === 0) {
		return config;
	}

	const firstArg = argv[0];

	if (/^x[0-9]+$/.test(firstArg)) {
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

function run(argv) {
	"use strict";

	// Initialize applications
	const Safari = Application("Safari");
	const SystemEvents = Application("System Events");
	Safari.includeStandardAdditions = true;

	// --- Argument Parsing ---
	const { windowCount, profile, profileName, url } = parseArgs(argv);

	// --- Safari Automation ---

	const safariWasRunning = Safari.running();

	// Ensure Safari is running and activate it
	if (!safariWasRunning) {
		Safari.activate(); // This will open one window
		delay(0.5);
	} else {
		Safari.activate();
		delay(0.3);
	}

	const clickProfileMenuItem = (name) => {
		const normalize = (value) => (value || "").toLowerCase().trim();
		const normalizedName = normalize(name);
		const expected = normalize(`New ${name} Window`);
		const matchesProfileWindow = (value) => {
			const itemName = normalize(value);
			return (
				itemName === expected ||
				(itemName.includes(normalizedName) && itemName.includes("window"))
			);
		};

		const clickMatchInMenu = (menu) => {
			const items = menu.menuItems();
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				let itemName = "";
				try {
					itemName = item.name();
				} catch (e) {}

				if (matchesProfileWindow(itemName)) {
					item.click();
					return true;
				}

				try {
					const submenus = item.menus();
					for (let j = 0; j < submenus.length; j++) {
						if (clickMatchInMenu(submenus[j])) {
							return true;
						}
					}
				} catch (e) {}
			}
			return false;
		};

		try {
			const safariProcess = SystemEvents.processes.byName("Safari");
			const fileMenu =
				safariProcess.menuBars[0].menuBarItems.byName("File").menus[0];
			return clickMatchInMenu(fileMenu);
		} catch (e) {
			return false;
		}
	};

	const openInProfile = (p, name) => {
		const beforeCount = Safari.windows.length;
		// Use Safari's profile shortcut first.
		SystemEvents.keystroke(p, {
			using: ["option down", "shift down", "command down"],
		});
		delay(0.8); // Wait for the new window to appear

		if (Safari.windows.length > beforeCount) {
			return true;
		}

		if (name && clickProfileMenuItem(name)) {
			delay(0.8);
			return Safari.windows.length > beforeCount;
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
		if (profile) {
			// The auto-opened window is in the default profile. Close it.
			try {
				Safari.windows[0].close();
				delay(0.2);
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
		if (profile) {
			if (!openInProfile(profile, profileName)) {
				throw new Error(
					`Could not open Safari profile ${profile}${
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
