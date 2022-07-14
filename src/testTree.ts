import { TextDecoder } from 'util';
import * as vscode from 'vscode';
import { parseCakeTest, parseResults } from './cake-parser';
import { exec } from 'node:child_process';

const textDecoder = new TextDecoder('utf-8');

export type CakeTestData = TestFile | CakeTestItem;

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

		const createObject = (
			range: vscode.Range, 
			name: string, 
			ctor: new (name: string) => CakeTestItem, 
			parent: { item: vscode.TestItem, children: vscode.TestItem[]},
		): vscode.TestItem => {
			let id = `${parent.item.id}/${name}`;
			// Make sure that the id is unique, even if the user makes the same name for tests
			const duplicateNames = parent.children.filter(child => child.label == name);
			if (duplicateNames.length > 0) {
				id += `(${duplicateNames.length})`;
			}

			const data = new ctor(name);
			const thead = controller.createTestItem(id, data.getLabel(), item.uri);
			thead.range = range;
			testData.set(thead, data);
			parent.children.push(thead);
			return thead;
		}

		parseCakeTest(content, {
			onTest: (range, name) => {
				const parent = ancestors[ancestors.length - 1];
				createObject(range, name, CakeTestCase, parent);
			},
			onGroup: (range, name) => {
				const parent = ancestors[ancestors.length - 1];
				const thead = createObject(range, name, CakeGroup, parent);
				ancestors.push({ item: thead, children: [] });
			},
			onTestRunner: (range, name) => {
				const parent = ancestors[0];
				const thead = createObject(range, name, CakeTestRunner, parent);
				ancestors.push({ item: thead, children: [] });
			},
			onAscend: () => {
				const finished = ancestors.pop()!;
				finished.item.children.replace(finished.children);
			}
		});

		ascend(0); // finish and assign children for all remaining items
	}
}

abstract class CakeTestItem {
	public isRunnable:boolean = true;
	protected abstract propertyToSearchFor: string;

	constructor(
		protected readonly name: string,
	) {}

	public getLabel() {
		let name = this.name;
		if (this.name[0] == "'" && this.name[this.name.length - 1] == "'") {
			name = this.name.slice(1, this.name.length - 1);
		}
		return name;
	}

	async run(item: vscode.TestItem, options: vscode.TestRun): Promise<void> {
		const cmd = `dart run --define=${this.propertyToSearchFor}='${this.name}' ${item.uri!.path}`;
		const promise = new Promise<void>((resolve, reject) => {
			exec(cmd, (error, stdout, stderr) => {
				if (stderr) {
					const message = new vscode.TestMessage(`Internal error\n${stderr}`);
					message.location = new vscode.Location(item.uri!, item.range!);
					options.failed(item, message);
				}
		
				// We _could_ run some fancy regex to determine if it failed or not _or_ we can just look at what color it is
				if (stdout) {
					const passedRecursive = (recursiveParent: vscode.TestItem) => {
						options.passed(recursiveParent);
						recursiveParent.children.forEach(child => passedRecursive(child))
					}
					const failedRecursive = (recursiveParent: vscode.TestItem) => {
						const message = new vscode.TestMessage(stdout);
						message.location = new vscode.Location(recursiveParent.uri!, recursiveParent.range!);
						options.failed(recursiveParent, message);

						recursiveParent.children.forEach(child => {
							const errorMessage = parseResults(stdout, child.label);
							if (errorMessage) {
								failedRecursive(child);
							} else {
								passedRecursive(child);
							}
						});
					}
					const neutralRecursive = (recursiveParent: vscode.TestItem) => {
						options.skipped(recursiveParent);
						recursiveParent.children.forEach(child => neutralRecursive(child))
					}

					if (stdout.startsWith('[32m')) {
						passedRecursive(item);
					}

					if (stdout.startsWith('[31m')) {
						failedRecursive(item);
					}

					if (stdout.startsWith('[90m')) {
						neutralRecursive(item);
					}
				}
	
				resolve();
			});
		});
		return promise;
	}
}

export class CakeTestCase extends CakeTestItem {
	protected propertyToSearchFor: string = 'testSearchFor';
}

export class CakeGroup extends CakeTestItem {
	protected propertyToSearchFor: string = 'groupSearchFor';
}

export class CakeTestRunner extends CakeTestItem {
	protected propertyToSearchFor: string = 'testRunnerSearchFor';
}