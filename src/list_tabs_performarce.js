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

const sfItems = browserParsed.map((item) => {
	return {
		title: item["title"],
		subtitle: item["url"],
		match: `${item["title"]} ${item["url"]}`,
		arg: item["url"],
	};
});

JSON.stringify({
	cache: { seconds: 5, loosereload: true },
	items: sfItems,
});
