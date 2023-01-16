import * as vscode from 'vscode';

const testRunnerReShort = /TestRunner(Default)?\b/;
const groupReShort = /Group(Default)?\b/;
const testReShort = /Test(Default)?\b/;
const hasNameRe = /(["'])((?:\\1|(?:(?!\1)).)*)(\1|$)/;

export const parseCakeTest = (text: string, events: {
    onTest(range: vscode.Range, testName: string): void;
    onTestRunner(range: vscode.Range, testRunnerName: string): void;
    onGroup(range: vscode.Range, groupName: string): void;
	onAscend(): void;
}) => {
    const lines = text.split('\n');
	let foundItemEvent: ((range: vscode.Range, name: string) => void) | null = null;

	const matchName = (line: string, rangeIndex: number): boolean => {
		if (foundItemEvent) {
			const hasName = hasNameRe.exec(line);
			if (hasName) {
				const [match, , name] = hasName;
				const range = new vscode.Range(new vscode.Position(rangeIndex, 0), new vscode.Position(rangeIndex, match.length));
				foundItemEvent(range, name);
				foundItemEvent = null;
				return true;
			}
		}
		return false;
	}

	// Returns the matching result for digging out the where the opening bracket to watch should be
	const testForItem = (shortRe: RegExp, event: (range: vscode.Range, name: string) => void, line: string, index: number): string => {
		const test = shortRe.exec(line);
		if (test) {
			const hasName = hasNameRe.exec(line);
			if (hasName) {
				const [match, , name] = hasName;
				const range = new vscode.Range(new vscode.Position(index, 0), new vscode.Position(index, match.length));
				event(range, name);
			} else {
				foundItemEvent = event;
			}
			const [matchResult] = test;
			return matchResult;
		}
		return '';
	}

	const bracketWatch = [];
	let bracketIndex = 0;
	for (let lineNo = 0; lineNo < lines.length; lineNo++) {
		const line = lines[lineNo];
		let matchWatch: string = '';

		matchWatch = testForItem(testRunnerReShort, events.onTestRunner, line, lineNo);
		if (!matchWatch) {
			matchWatch = testForItem(groupReShort, events.onGroup, line, lineNo);
			if (!matchWatch) {
				// These intentionally do not write to matchWatch as we only want to groups or test runners stored
				const found = matchName(line, lineNo);
				if (!found) {
					testForItem(testReShort, events.onTest, line, lineNo);
				}
			}
		}

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
			if (line.includes(testName) && line.includes('[31m')) {
				errorIndex = i;
			}
		}
		i++;
	}
	return error;
}
