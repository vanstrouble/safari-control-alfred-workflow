const Safari = Application("Safari");
const SystemEvents = Application("System Events");

function getFileMenu(process) {
	try {
		return process.menuBars[0].menuBarItems.byName("File").menus[0];
	} catch (e) {
		return process.menuBars[0].menuBarItems()[2].menus[0];
	}
}

// Safari inserts the profile name into the standard "New Window" title.
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
	return profileWindowTitle.slice(start, nameEnd).trim() || profileWindowTitle;
}

function message(title, subtitle) {
	return {
		items: [{ title: title, subtitle: subtitle, valid: false }],
	};
}

let output;

try {
	if (!Safari.running()) {
		Safari.launch();
		delay(0.8);
	}

	const process = SystemEvents.processes.byName("Safari");
	const newWindowItem = getFileMenu(process).menuItems()[0];
	const windowTitle = newWindowItem.name() || "";
	const profileMenus = newWindowItem.menus();

	if (!profileMenus.length) {
		output = message(
			"No Safari profiles found",
			"Create a profile in Safari Settings › Profiles"
		);
	} else {
		const menuTitles = profileMenus[0].menuItems.name();
		const items = menuTitles.filter(Boolean).map((menuTitle) => {
			const profileName = getProfileName(windowTitle, menuTitle);

			return {
				title: profileName,
				subtitle: "Open a new Safari window with this profile",
				autocomplete: profileName,
				match: `${profileName} ${menuTitle}`,
				arg: `profile-menu:${menuTitle}`,
				valid: true,
			};
		});

		output = items.length
			? { cache: { seconds: 300, loosereload: true }, items: items }
			: message(
					"No Safari profiles found",
					"Create a profile in Safari Settings › Profiles"
				);
	}
} catch (e) {
	output = message(
		"Could not read Safari profiles",
		"Check Alfred's Accessibility permission"
	);
}

JSON.stringify(output);
