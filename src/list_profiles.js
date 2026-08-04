const Safari = Application("Safari");
const SystemEvents = Application("System Events");

// Safari appends/wraps the profile name onto the "New Window" title
// depending on locale. Strip a leftover connector word (e.g. Spanish "de")
// when there's no shared suffix to delimit the name.
function stripLeadingConnector(candidate) {
	return candidate.replace(/^[\s\-–—:()"“”]*[a-zà-öø-ÿ]{1,4}\s+(?=[A-ZÀ-Ö0-9])/, "");
}

function getProfileName(windowTitle, profileWindowTitle) {
	let start = 0;
	while (
		start < windowTitle.length &&
		start < profileWindowTitle.length &&
		windowTitle[start] === profileWindowTitle[start]
	) {
		start++;
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

	const nameEnd = end ? profileWindowTitle.length - end : profileWindowTitle.length;
	let name = profileWindowTitle.slice(start, nameEnd).trim();
	if (!end) name = stripLeadingConnector(name);
	return name || profileWindowTitle;
}

function message(title, subtitle) {
	return { items: [{ title: title, subtitle: subtitle, valid: false }] };
}

// The submenu with profiles isn't always menuItems()[0]; scan for the
// first item that actually has one, locale/order independent.
function findNewWindowItem(fileMenu) {
	const items = fileMenu.menuItems();
	for (let i = 0; i < items.length; i++) {
		try {
			if (items[i].menus().length > 0) return { item: items[i], index: i };
		} catch (e) {
			/* no submenu, keep looking */
		}
	}
	return { item: items[0], index: 0 };
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
	step("menuBarItems.length check", () => {
		if (!menuBarItemsRef().length) throw new Error("menuBarItems is empty");
	});

	// byName("File") returns a specifier lazily: it won't throw until
	// resolved, so force resolution here to detect non-English locales.
	let fileMenuItem = null;
	try {
		const candidate = menuBarItemsRef.byName("File");
		candidate.name();
		fileMenuItem = candidate;
	} catch (e) {
		fileMenuItem = null;
	}
	const resolvedFileMenuItem = fileMenuItem || step("menuBarItems()[2] fallback", () => menuBarItemsRef()[2]);
	const fileMenuItemName = step("fileMenuItem.name()", () => resolvedFileMenuItem.name());
	const fileMenu = step("fileMenuItem.menus()[0]", () => resolvedFileMenuItem.menus()[0]);

	const fileMenuItems = step("fileMenu.menuItems()", () => fileMenu.menuItems());
	step("fileMenuItems.length check", () => {
		if (!fileMenuItems.length) throw new Error(`fileMenu (name="${fileMenuItemName}") has 0 menuItems`);
	});

	const { item: newWindowItem, index } = step("findNewWindowItem", () => findNewWindowItem(fileMenu));
	const windowTitle = step("newWindowItem.name()", () => newWindowItem.name() || "");
	const profileMenus = step("newWindowItem.menus()", () => newWindowItem.menus());

	if (!profileMenus.length) {
		output = message(
			"No Safari profiles found",
			`No submenu found (checked item at index ${index}: "${windowTitle}")`
		);
	} else {
		const menuTitles = profileMenus[0].menuItems.name();

		// Array of {idx, name}: idx is both the array position and the
		// pN Safari will open natively (⌥⇧⌘+N), so it doubles as the arg.
		const profiles = menuTitles.filter(Boolean).map((menuTitle, idx) => ({
			idx,
			name: getProfileName(windowTitle, menuTitle),
			menuTitle,
		}));

		const items = profiles.map(({ idx, name, menuTitle }) => ({
			title: name,
			autocomplete: name,
			match: `${name} ${menuTitle}`,
			arg: `p${idx}`,
			valid: true,
		}));

		output = items.length
			? { cache: { seconds: 300, loosereload: true }, items: items }
			: message("No Safari profiles found", "Create a profile in Safari Settings › Profiles");
	}
} catch (e) {
	output = message("Could not read Safari profiles", `Error: ${e.message || e}`);
}

JSON.stringify(output);
