import * as vscode from 'vscode';

const testRunnerRe = /TestRunner(WithContext)?(<.*>)?\(('.*'|".*")/;
const groupRe = /Group(WithContext)?(<.*>)?\(('.*'|".*")/;
const testRe = /Test(WithContext)?(<.*>)?\(('.*'|".*")/;

export const parseCakeTest = (text: string, events: {
    onTest(range: vscode.Range, testName: string): void;
    onTestRunner(range: vscode.Range, testRunnerName: string): void;
    onGroup(range: vscode.Range, groupName: string, depth: number): void;
}) => {
    const lines = text.split('\n');

	for (let lineNo = 0; lineNo < lines.length; lineNo++) {
		const line = lines[lineNo];
		const test = testRe.exec(line);
		if (test) {
			const [match, , , testName] = test;
			const range = new vscode.Range(new vscode.Position(lineNo, 0), new vscode.Position(lineNo, match.length));
			events.onTest(range, testName);
			continue;
		}

        const group = groupRe.exec(line);
        if (group) {
			const [match, , , groupName] = group;
			const range = new vscode.Range(new vscode.Position(lineNo, 0), new vscode.Position(lineNo, match.length));
			events.onGroup(range, groupName, 1);
			continue;
		}

        const testRunner = testRunnerRe.exec(line);
        if (testRunner) {
			const [match, , , testRunnerName] = testRunner;
			const range = new vscode.Range(new vscode.Position(lineNo, 0), new vscode.Position(lineNo, match.length));
			events.onTestRunner(range, testRunnerName);
			continue;
		}
	}
};

export const parseResults = (text: string, testName: string): string => {
	const lines = text.split('\n');
	let error = '';
	let i = 0;
	let errorIndex = -1;
	while(i < lines.length && !error) {
		const line = lines[i];
		if (errorIndex >= 0) {
			// Trim error down
			const lineError = line.replace(RegExp(/^(.*)`-\s+(.*)(.*)/), '$2');
			error = lineError;
		} else {
			if (line.includes(testName)) {
				errorIndex = i;
			}
		}
		i++;
	}
	return error;
}
