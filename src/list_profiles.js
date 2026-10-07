const Safari = Application("Safari");
const SystemEvents = Application("System Events");

// Safari appends/wraps the profile name onto the "New Window" title
// depending on locale. Strip a leftover connector word (e.g. Spanish "de")
// when there's no shared suffix to delimit the name.
function stripLeadingConnector(candidate) {
	return candidate.replace(/^[\s\-–—:()"“”]*[a-zà-öø-ÿ]{1,4}\s+(?=[A-ZÀ-Ö0-9])/, "");
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
	while (end > 0 && !/\s/.test(profileWindowTitle[profileWindowTitle.length - end])) end--;

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
function readShortcut(item) {
	try {
		const ch = item.attributes.byName("AXMenuItemCmdChar").value();
		const mod = item.attributes.byName("AXMenuItemCmdModifiers").value();
		return { ch: ch ? String(ch).toUpperCase() : "", mod: typeof mod === "number" ? mod : null };
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

let output;

try {
	if (!Safari.running()) {
		Safari.launch();
		delay(0.8);
	}

	const process = step("processes.byName", () => SystemEvents.processes.byName("Safari"));
	const menuBarItemsRef = process.menuBars[0].menuBarItems;
	const menuBarItemsArray = step("menuBars[0].menuBarItems", () => menuBarItemsRef());
	if (!menuBarItemsArray.length) throw new Error("menuBarItems is empty");

	// byName("File") returns a specifier lazily: it won't throw until
	// resolved, so force resolution here to detect non-English locales.
	// Capture the name in the same call instead of asking again later.
	let fileMenuItem = null;
	let fileMenuItemName = null;
	try {
		const candidate = menuBarItemsRef.byName("File");
		fileMenuItemName = candidate.name();
		fileMenuItem = candidate;
	} catch (e) {
		fileMenuItem = null;
	}

	const resolvedFileMenuItem = fileMenuItem || menuBarItemsArray[2];
	if (!fileMenuItem) {
		fileMenuItemName = step("fileMenuItem.name()", () => resolvedFileMenuItem.name());
	}
	const fileMenu = step("fileMenuItem.menus()[0]", () => resolvedFileMenuItem.menus()[0]);

	const fileMenuItems = step("fileMenu.menuItems()", () => fileMenu.menuItems());
	if (!fileMenuItems.length) throw new Error(`fileMenu (name="${fileMenuItemName}") has 0 menuItems`);

	const { newIdx, privIdx } = step("locateWindowItems", () => locateWindowItems(fileMenuItems));
	if (newIdx < 0) {
		throw new Error(`"New Window" item (⌘N) not found in menu "${fileMenuItemName}"`);
	}

	const newWindowItem = fileMenuItems[newIdx];
	const windowTitle = step("newWindowItem.name()", () => newWindowItem.name() || "");
	const subMenus = step("newWindowItem.menus()", () => newWindowItem.menus());

	let profiles = [];

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
		const privateTitle = step("privateItem.name()", () => fileMenuItems[privIdx].name() || "");
		const block = fileMenuItems.slice(newIdx, privIdx);
		const titles = step("block names", () => block.map((it) => it.name() || ""));

		// idx is the array position and the pN Safari opens natively (⌥⇧⌘+N).
		profiles = titles
			.map((menuTitle, idx) => ({
				idx,
				menuTitle,
				name: getProfileName(privateTitle, menuTitle),
			}))
			.filter((p) => p.menuTitle && p.name);
	}

	if (!profiles.length) {
		output = message("No Safari profiles found", "Create a profile in Safari Settings › Profiles");
	} else {
		output = {
			cache: { seconds: 300, loosereload: true },
			items: profiles.map(({ idx, name, menuTitle }) => ({
				title: name,
				autocomplete: name,
				match: `${name} ${menuTitle}`,
				arg: `p${idx}`,
				valid: true,
			})),
		};
	}
} catch (e) {
	output = message("Could not read Safari profiles", `Error: ${e.message || e}`);
}

JSON.stringify(output);
