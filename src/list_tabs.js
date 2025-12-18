/**
 * Executes a command and returns its standard output.
 * @param {...string} args The command and its arguments to execute.
 * @returns {string} The standard output (stdout) of the command as a string.
 */
function runCommand(...args) {
	const task = $.NSTask.alloc.init;
	const stdout = $.NSPipe.pipe;

	task.executableURL = $.NSURL.fileURLWithPath("/usr/bin/env");
	task.arguments = args;
	task.standardOutput = stdout;
	task.launchAndReturnError(false);

	const dataOut =
		stdout.fileHandleForReading.readDataToEndOfFileAndReturnError(false);
	const stringOut = $.NSString.alloc.initWithDataEncoding(
		dataOut,
		$.NSUTF8StringEncoding
	).js;

	return stringOut;
}

// --- Script Main ---

let output;

try {
	const browserRaw = runCommand(
		$(
			"~/Library/Application Support/Alfred/Automation/Tasks/com.alfredapp.automation.core/safari/.common/tabs"
		).stringByExpandingTildeInPath.js,
		"Safari",
		"1",
		"0",
		"json"
	);

	// The command returns a JSON string where the actual tab data is itself a stringified JSON array.
	// Therefore, we need to parse it twice.
	const browserParsed = JSON.parse(
		JSON.parse(browserRaw)["alfredworkflow"]["arg"]
	);

	if (!browserParsed || browserParsed.length === 0) {
		output = {
			items: [
				{
					title: "No tabs found",
					subtitle: "No open tabs in Safari",
					valid: false,
				},
			],
		};
	} else {
		const uniqueTabs = new Map();

		for (const item of browserParsed) {
			const url = item.url || "";
			if (!url) continue;

			if (uniqueTabs.has(url)) {
				uniqueTabs.get(url).count++;
			} else {
				const title = item.title || "Untitled";
				uniqueTabs.set(url, {
					item: {
						title: title,
						subtitle: url,
						autocomplete: title,
						match: `${title} ${url}`,
						arg: url,
						valid: true,
						quicklookurl: url,
						mods: {
							cmd: {
								subtitle: "⌘ Copy URL to clipboard",
							},
							ctrl: {
								subtitle: "⌃ Close all tabs with this URL",
							},
						},
					},
					count: 1,
				});
			}
		}

		const sfItems = Array.from(uniqueTabs.values()).map((entry) => {
			if (entry.count > 1) {
				entry.item.title += ` · (${entry.count} tabs)`;
			}
			return entry.item;
		});

		output = {
			cache: { seconds: 5, loosereload: true },
			items: sfItems,
		};
	}
} catch (e) {
	let items;
	if (e.message.includes("Unexpected EOF")) {
		items = [
			{
				title: "No Safari tabs found",
				subtitle:
					"Press ↩ to open a new Safari window or Esc to cancel",
				valid: true,
				arg: "1",
				mods: {
					cmd: {
						valid: false,
						subtitle: "These actions require a selected tab",
					},
					ctrl: {
						valid: false,
						subtitle: "These actions require a selected tab",
					},
				},
			},
		];
	} else {
		items = [
			{
				title: "Error getting Safari tabs",
				subtitle: e.message,
				valid: false,
			},
		];
	}
	output = { items };
}

JSON.stringify(output);
