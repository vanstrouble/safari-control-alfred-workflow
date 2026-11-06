const Safari = Application("Safari");
const SystemEvents = Application("System Events");

// Set to true to print per-step timings to stderr (visible in Alfred's debugger).
const DEBUG = false;
const t0 = Date.now();
function lap(label) {
	if (DEBUG) console.log(`${label}: ${Date.now() - t0}ms`);
}

// Safari appends/wraps the profile name onto the "New Window" title
// depending on locale. Strip a leftover connector word (e.g. Spanish "de")
// when there's no shared suffix to delimit the name.
function stripLeadingConnector(candidate) {
	return candidate.replace(/^[\s\-–—:()"“”]*[a-zà-öø-ÿ]{1,4}\s+(?=\S)/, "");
}

// Extracts the profile name from `profileWindowTitle` by removing whatever
// it shares (prefix/suffix) with `windowTitle`. Shared parts are snapped to
// word boundaries so "New Private Window" vs "New Personal Window" doesn't
// leave "ersonal" behind. Returns "" when nothing is left.
function getProfileName(windowTitle, profileWindowTitle) {
	let start = 0;
	while (
		start < windowTitle.length &&
		start < profileWindowTitle.length &&
		windowTitle[start] === profileWindowTitle[start]
	) {
		start++;
	}
	if (start < windowTitle.length && start < profileWindowTitle.length) {
		while (start > 0 && !/\s/.test(profileWindowTitle[start - 1])) start--;
	}

	let end = 0;
	while (
		end < windowTitle.length - start &&
		end < profileWindowTitle.length - start &&
		windowTitle[windowTitle.length - end - 1] ===
			profileWindowTitle[profileWindowTitle.length - end - 1]
	) {
		end++;
	}
	while (
		end > 0 &&
		!/\s/.test(profileWindowTitle[profileWindowTitle.length - end]) &&
		!/\s/.test(profileWindowTitle[profileWindowTitle.length - end - 1])
	) end--;

	const nameEnd = end ? profileWindowTitle.length - end : profileWindowTitle.length;
	let name = profileWindowTitle.slice(start, nameEnd).trim();
	if (!end) name = stripLeadingConnector(name);
	return name;
}

function message(title, subtitle) {
	return { items: [{ title: title, subtitle: subtitle, valid: false }] };
}

// Reads the keyboard shortcut of a menu item through the accessibility
// attributes. Locale-independent, unlike the item titles.
// AXMenuItemCmdModifiers bitmask: 1 = ⇧, 2 = ⌥, 4 = ⌃, 8 = no ⌘ (0 = ⌘ only).
// The modifiers are only queried when the key is "N" (saves one Apple Event
// for every other item while scanning).
function readShortcut(item) {
	try {
		const ch = String(item.attributes.byName("AXMenuItemCmdChar").value() || "").toUpperCase();
		if (ch !== "N") return { ch, mod: null };
		const mod = item.attributes.byName("AXMenuItemCmdModifiers").value();
		return { ch, mod: typeof mod === "number" ? mod : null };
	} catch (e) {
		return { ch: "", mod: null };
	}
}

// macOS 27 moved the profiles out of the "New Window" submenu: now they are
// flat items at the top of the File menu ("New Window for Personal", ...).
// Anchors that don't depend on the language:
//   ⌘N   -> window of the first profile (p0)
//   ⇧⌘N  -> private window, which comes right after the profile block
function locateWindowItems(items) {
	// In the legacy layout, the first File-menu item is the New Window
	// submenu container. The shortcut belongs to a child, so the container
	// itself need not expose Command-N. Recognize it before scanning shortcuts.
	if (items.length && items[0].menus().length) {
		return { newIdx: 0, privIdx: -1 };
	}

	let newIdx = -1;
	let privIdx = -1;
	for (let i = 0; i < items.length; i++) {
		const { ch, mod } = readShortcut(items[i]);
		if (ch !== "N") continue;
		if (mod === 0 && newIdx < 0) newIdx = i;
		else if (mod === 1 && privIdx < 0) privIdx = i;
		if (newIdx >= 0 && privIdx >= 0) break;
	}
	return { newIdx, privIdx };
}

// Runs fn() and rethrows with a label, so failures point at the exact step.
function step(label, fn) {
	try {
		return fn();
	} catch (e) {
		throw new Error(`[${label}] ${e.message || e}`);
	}
}

// Launches Safari if needed and polls until its menu bar is available,
// instead of sleeping a fixed amount of time (max ~3 s).
function ensureSafariReady() {
	if (Safari.running()) return;
	Safari.launch();
	for (let i = 0; i < 20; i++) {
		delay(0.15);
		try {
			if (SystemEvents.processes.byName("Safari").menuBars[0].menuBarItems.name().length > 2) return;
		} catch (e) {
			// Menu bar not ready yet; keep polling.
		}
	}
}

let output;

try {
	ensureSafariReady();
	lap("safari ready");

	// Lazy specifier straight to the File menu. Position 2 (Apple, Safari, File)
	// is the same in every language, so there is no need to resolve it by name
	// ("File" fails on non-English systems) or to materialize the whole menu bar.
	const fileMenu = step("fileMenu", () =>
		SystemEvents.processes.byName("Safari").menuBars[0].menuBarItems[2].menus[0]
	);

	// All titles in a single Apple Event instead of one .name() call per item.
	const allTitles = step("menuItems.name()", () =>
		fileMenu.menuItems.name().map((t) => t || "")
	);
	if (!allTitles.length) throw new Error("File menu has 0 menuItems");
	lap("titles");

	// Specifiers, only used to read shortcuts / submenus.
	const fileMenuItems = step("menuItems()", () => fileMenu.menuItems());

	const { newIdx, privIdx } = step("locateWindowItems", () => locateWindowItems(fileMenuItems));
	if (newIdx < 0) {
		throw new Error(`"New Window" item (⌘N) not found in the File menu`);
	}
	lap("located");

	const windowTitle = allTitles[newIdx];

	let profiles = [];

	const subMenus = step("newWindowItem.menus()", () => fileMenuItems[newIdx].menus());

	if (subMenus.length) {
		// Legacy layout (macOS <= 26): profiles live in the "New Window" submenu.
		const menuTitles = subMenus[0].menuItems.name();
		profiles = menuTitles
			.map((menuTitle, idx) => ({ idx, menuTitle }))
			.filter((p) => p.menuTitle)
			.map(({ idx, menuTitle }) => ({
				idx,
				menuTitle,
				name: getProfileName(windowTitle, menuTitle) || menuTitle,
			}));
	} else {
		// Flat layout (macOS 27+): profile items sit between ⌘N and ⇧⌘N.
		if (privIdx <= newIdx) {
			throw new Error("Private Window item (⇧⌘N) not found after ⌘N; can't delimit profiles");
		}
		const privateTitle = allTitles[privIdx];
		const titles = allTitles.slice(newIdx, privIdx);

		// idx is the array position and the pN Safari opens natively (⌥⇧⌘+N).
		profiles = titles
			.map((menuTitle, idx) => ({
				idx,
				menuTitle,
				name: getProfileName(privateTitle, menuTitle),
			}))
			.filter((p) => p.menuTitle && p.name);
	}
	lap("profiles parsed");

	if (!profiles.length) {
		output = message("No Safari profiles found", "Create a profile in Safari Settings › Profiles");
	} else {
		output = {
			cache: { seconds: 3600, loosereload: true },
			items: profiles.map(({ idx, name }) => ({
				title: name,
				subtitle: "Open a new window in this profile",
				autocomplete: name,
				match: name,
				arg: `p${idx}`,
				valid: true,
			})),
		};
	}
} catch (e) {
	output = message("Could not read Safari profiles", `Error: ${e.message || e}`);
}

JSON.stringify(output);
