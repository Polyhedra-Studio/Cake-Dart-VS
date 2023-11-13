import * as vscode from 'vscode';

const testRunnerRe = /(\s+)TestRunner(Default)?(Of)?\b/;
const groupRe = /(\s+)Group(Of)?\b/;
const testRe = /(\s+)Test(Of)?\b/;
const hasNameRe = /(["'])((?:\\1|(?:(?!\1)).)*)(\1|$)/;

export const parseCakeTest = (text: string, events: {
    onTest(range: vscode.Range, testName: string): void;
    onTestRunner(range: vscode.Range, testRunnerName: string): void;
    onGroup(range: vscode.Range, groupName: string): void;
	onAscend(): void;
}) => {
    const lines = text.split('\n');
	let foundItem: {
		index: number,
		event: ((range: vscode.Range, name: string) => void),
	} | null = null;

	// Finds a trailing test title if it exists in a new line different than the test item.
	const matchName = (line: string, rangeIndex: number): boolean => {
		if (foundItem) {
			const hasName = hasNameRe.exec(line);
			if (hasName) {
				const [match, , name] = hasName;
				const range = new vscode.Range(new vscode.Position(foundItem.index, 0), new vscode.Position(rangeIndex, match.length));
				foundItem.event(range, name);
				foundItem = null;
				return true;
			}
		}
		return false;
	}

	// Returns the matching result for digging out the where the opening bracket to watch should be
	const testForItem = (
		itemRe: RegExp, 
		event: (range: vscode.Range, name: string) => void,
		line: string,
		index: number,
	): string => {
		const reTestResult = itemRe.exec(line);
		if (reTestResult) {
			const hasName = hasNameRe.exec(line);
			// Check if this line has a test name on it, else wait until it does
			if (hasName) {
				const [match, , name] = hasName;
				const range = new vscode.Range(new vscode.Position(index, 0), new vscode.Position(index, match.length));
				event(range, name);
			} else {
				foundItem = {
					index,
					event
				};
			}
			const [matchResult] = reTestResult;
			return matchResult;
		}
		return '';
	}

	const bracketWatch = [];
	let bracketIndex = 0;

	// Read each line in the file, and look for the start of a test, group, or test runner.
	for (let lineNo = 0; lineNo < lines.length; lineNo++) {
		const line = lines[lineNo];
		let matchWatch: string = '';

		// First, check for TestRunner as this is the base of the tree
		matchWatch = testForItem(testRunnerRe, events.onTestRunner, line, lineNo);
		if (!matchWatch) {
			// Check against groups since that's next on the tree
			matchWatch = testForItem(groupRe, events.onGroup, line, lineNo);
			if (!matchWatch) {
				// Check for if this is a title for a test item that existed on a new line.
				const found = matchName(line, lineNo);
				if (!found) {
					// Finally, check if this is a test
					// This function intentionally does not set matchWatch as we only want to groups or test runners stored
					testForItem(testRe, events.onTest, line, lineNo);
				}
			}
		}

		// Detect when brackets are opened or closed so we can detect when a Group or TestRunner
		// is closed so we can ascend back up the tree.
		const matchBracketIndex = matchWatch ? line.lastIndexOf(matchWatch) + matchWatch.length : -1;
		const openingBrackets: number[] = [];
		const closingBrackets: number[] = [];
		for(let charNo = 0; charNo < line.length; charNo++) {
			const char = line[charNo];
			if (char == '(') {
				openingBrackets.push(charNo);
			} else if (char == ')') {
				closingBrackets.push(charNo);
			}	
		}

		let index = 0;
		while((openingBrackets.length || closingBrackets.length) && index < line.length) {
			if (index == openingBrackets[0]) {
				openingBrackets.shift();
				bracketIndex++;		
				if (matchBracketIndex >= index) {
					bracketWatch.push(bracketIndex);
				}
			}
			if (index == closingBrackets[0]) {
				if (bracketWatch[bracketWatch.length - 1] == bracketIndex) {
					bracketWatch.pop();
					events.onAscend();
				}
				closingBrackets.shift();
				bracketIndex--;
			}

			index++;
		}
	}
};

/**
 * Parses the results of a test and extracts an error message, if any occurred.
 * Will stop on the first error.
 *
 * @param {string} text - The text containing the test results.
 * @param {string} testName - Name of the test, used to find the error index.
 * @return {string} The error message extracted from the test results, or an empty string if no error message is found.
 */
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
			// Cake will output the error in red and will have the name of the test
			if (line.includes(testName) && line.includes('[31m')) {
				errorIndex = i;
			}
		}
		i++;
	}
	return error;
}
