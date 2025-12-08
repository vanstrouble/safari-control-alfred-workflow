function envVar(varName) {
	return $.NSProcessInfo.processInfo.environment.objectForKey(varName).js;
}

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

	const browserParsed = JSON.parse(
		JSON.parse(browserRaw)["alfredworkflow"]["arg"]
	);

	if (!browserParsed || browserParsed.length === 0) {
		JSON.stringify({
			items: [
				{
					title: "No tabs found",
					subtitle: "No open tabs in Safari",
					valid: false,
				},
			],
		});
	}

	const sfItems = browserParsed.map((item) => {
		const title = item["title"] || "Untitled";
		const url = item["url"] || "";

		return {
			title: title,
			subtitle: url,
			autocomplete: title,
			match: `${title} ${url}`,
			arg: url,
			valid: !!url,
			quicklookurl: url || undefined,
		};
	});

	JSON.stringify({
		cache: { seconds: 5, loosereload: true },
		items: sfItems,
	});
} catch (e) {
	JSON.stringify({
		items: [
			{
				title: "Error getting Safari tabs",
				subtitle: e.message || "Unknown error",
				valid: false,
			},
		],
	});
}
