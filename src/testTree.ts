import { TextDecoder } from 'util';
import * as vscode from 'vscode';
import { parseCakeTest, parseResults } from './cake-parser';
import { exec } from 'node:child_process';

const textDecoder = new TextDecoder('utf-8');

export type CakeTestData = TestFile | CakeTestRunner | CakeGroup | CakeTestCase;

export const testData = new WeakMap<vscode.TestItem, CakeTestData>();

export const getContentFromFilesystem = async (uri: vscode.Uri) => {
	try {
		const rawContent = await vscode.workspace.fs.readFile(uri);
		return textDecoder.decode(rawContent);
	} catch (e) {
		console.warn(`Error providing tests for ${uri.fsPath}`, e);
		return '';
	}
};

export class TestFile {
	public didResolve = false;

	public async updateFromDisk(controller: vscode.TestController, item: vscode.TestItem) {
		try {
			const content = await getContentFromFilesystem(item.uri!);
			item.error = undefined;
			this.updateFromContents(controller, content, item);
		} catch (e) {
			item.error = (e as Error).stack;
		}
	}

	/**
	 * Parses the tests from the input text, and updates the tests contained
	 * by this file to be those from the text,
	 */
	public updateFromContents(controller: vscode.TestController, content: string, item: vscode.TestItem) {
		const ancestors = [{ item, children: [] as vscode.TestItem[] }];
		this.didResolve = true;

		const ascend = (depth: number) => {
			while (ancestors.length > depth) {
				const finished = ancestors.pop()!;
				finished.item.children.replace(finished.children);
			}
		};

		parseCakeTest(content, {
			onTest: (range, testName) => {
				const parent = ancestors[ancestors.length - 1];
				const data = new CakeTestCase(testName);
				const id = `${item.uri}/${data.getLabel()}`;

				const tcase = controller.createTestItem(id, data.getLabel(), item.uri);
				testData.set(tcase, data);
				tcase.range = range;
				parent.children.push(tcase);
			},

			onGroup: (range, name, depth) => {
				ascend(1);
				const parent = ancestors[ancestors.length - 1];
				const id = `${item.uri}/${name}`;

				const thead = controller.createTestItem(id, name, item.uri);
				thead.range = range;
				testData.set(thead, new CakeGroup(name));
				parent.children.push(thead);
				ancestors.push({ item: thead, children: [] });
			},
			
			onTestRunner: (range, name) => {
				const parent = ancestors[0];
				const id =  `${item.uri}/${name}`;

				const thead = controller.createTestItem(id, name, item.uri);
				thead.range = range;
				testData.set(thead, new CakeTestRunner(name));
				parent.children.push(thead);
				ancestors.push({ item: thead, children: [] });
			}
		});

		ascend(0); // finish and assign children for all remaining items
	}
}

export class CakeTestCase {
	isRunnable:boolean = true;

	constructor(
		private readonly name: string,
	) {}

	getLabel() {
		return this.name;
	}

	getTestName() {
		let name = this.name;
		if (this.name[0] == "'" && this.name[this.name.length - 1] == "'") {
			name = this.name.slice(1, this.name.length - 1);
		}
		return name;
	}

	async run(item: vscode.TestItem, options: vscode.TestRun): Promise<void> {
		const cmd = `dart run --define=testSearchFor=${this.name} ${item.uri!.path}`;
		const promise = new Promise<void>((resolve, reject) => {
			exec(cmd, (error, stdout, stderr) => {
				if (stderr) {
					const message = new vscode.TestMessage(`Internal error\n${stderr}`);
					message.location = new vscode.Location(item.uri!, item.range!);
					options.failed(item, message);
				}
		
				// We _could_ run some fancy regex to determine if it failed or not _or_ we can just look at what color it is
				if (stdout) {
					if (stdout.startsWith('[32m')) {
						options.passed(item);
					}
					if (stdout.startsWith('[31m')) {
						let errorMessage = parseResults(stdout, this.getTestName());
						if (!errorMessage) {
							errorMessage = stdout;
						}
						const message = new vscode.TestMessage(errorMessage);
						options.failed(item, message);
					}
					if (stdout.startsWith('[90m')) {
						options.skipped(item);
					}
				}
	
				resolve();
			});
		});
		return promise;
	}
}

export class CakeGroup {
	isRunnable:boolean = true;

	constructor(
		private readonly name: string,
	) {}

	getLabel() {
		return this.name;
	}

	async run(item: vscode.TestItem, options: vscode.TestRun): Promise<void> {
		const cmd = `dart run --define=groupSearchFor=${item.uri!.path}`;
		const promise = new Promise<void>((resolve, reject) => {
			exec(cmd, (error, stdout, stderr) => {
				if (stderr) {
					const message = new vscode.TestMessage(`Internal error\n${stderr}`);
					message.location = new vscode.Location(item.uri!, item.range!);
					options.failed(item, message);
				}
		
				// We _could_ run some fancy regex to determine if it failed or not _or_ we can just look at what color it is
				if (stdout) {
					if (stdout.startsWith('[32m')) {
						options.passed(item);
						item.children.forEach(child => options.passed(child));
					}
					if (stdout.startsWith('[31m')) {
						const message = new vscode.TestMessage(stdout);
						options.failed(item, message);
						// Ideally this would actually pick out which ones passed/failed but that is for a later time
						item.children.forEach(child => options.skipped(child));
					}
					if (stdout.startsWith('[90m')) {
						options.skipped(item);
						item.children.forEach(child => options.skipped(child));
					}
				}
	
				resolve();
			});
		});
		return promise;
	}
}

export class CakeTestRunner {
	isRunnable:boolean = true;

	constructor(
		private readonly name: string,
	) {}

	getLabel() {
		return this.name;
	}

	async run(item: vscode.TestItem, options: vscode.TestRun): Promise<void> {
		const cmd = `dart run --define=testRunnerSearchFor=${this.name} ${item.uri!.path}`;
		const promise = new Promise<void>((resolve, reject) => {
			exec(cmd, (error, stdout, stderr) => {
				if (stderr) {
					const message = new vscode.TestMessage(`Internal error\n${stderr}`);
					message.location = new vscode.Location(item.uri!, item.range!);
					options.failed(item, message);
				}
		
				// We _could_ run some fancy regex to determine if it failed or not _or_ we can just look at what color it is
				if (stdout) {
					if (stdout.startsWith('[32m')) {
						options.passed(item);
						item.children.forEach(child => options.passed(child));
					}
					if (stdout.startsWith('[31m')) {
						const message = new vscode.TestMessage(stdout);
						options.failed(item, message);
						// Ideally this would actually pick out which ones passed/failed but that is for a later time
						item.children.forEach(child => options.skipped(child));
					}
					if (stdout.startsWith('[90m')) {
						options.skipped(item);
						item.children.forEach(child => options.skipped(child));
					}
				}
	
				resolve();
			});
		});
		return promise;
	}
}