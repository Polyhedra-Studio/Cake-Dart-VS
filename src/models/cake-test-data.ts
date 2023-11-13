import * as vscode from 'vscode';
import { exec } from 'node:child_process';

import { CakeDebugRunner } from '../cake-debugger';
import { parseResults } from '../cake-parser';

export abstract class CakeTestData {
    protected abstract dartDefineArgs(): string | undefined;
    public abstract ready: boolean;

	public async run(item: vscode.TestItem, options: vscode.TestRun, debugMode: boolean = false,): Promise<void> {

		let cmd: string = `dart run ${this.dartDefineArgs() ? this.dartDefineArgs() : ''} ${item.uri!.path}`;
		const debugRunner = debugMode ? new CakeDebugRunner() : undefined;

		const parseStderr = (output: string) => {
			const message = new vscode.TestMessage(`Internal error\n${output}`);
			message.location = new vscode.Location(item.uri!, item.range!);
			options.failed(item, message);
		}

		const parseStdout = (output: string) => {
			const sanitizedOutput = output
			.replaceAll('[32m', '')
			.replaceAll('[31m', '')
			.replaceAll('[90m', '')
			.replaceAll('[0m', '');

			const passedRecursive = (recursiveParent: vscode.TestItem) => {
				options.passed(recursiveParent);
				recursiveParent.children.forEach(child => passedRecursive(child))
			}
			const failedRecursive = (recursiveParent: vscode.TestItem) => {
				const message = new vscode.TestMessage(sanitizedOutput);
				message.location = new vscode.Location(recursiveParent.uri!, recursiveParent.range!);
				options.failed(recursiveParent, message);

				recursiveParent.children.forEach(child => {
					const errorMessage = parseResults(output, child.label);
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

			// We _could_ run some fancy regex to determine if it failed or not _or_ we can just look at what color it is
			if (output.startsWith('[32m')) {
				passedRecursive(item);
			}

			if (output.startsWith('[31m')) {
				failedRecursive(item);
			}

			if (output.startsWith('[90m')) {
				neutralRecursive(item);
			}
		};

		const execute = (resolve: any) => {
			exec(cmd, (error, stdout, stderr) => {
				if (stderr) {
					parseStderr(stderr);
				}

				if (stdout) {
					parseStdout(stdout);
				}
				resolve();
			});
		}

		const promise = new Promise<void>((resolve, reject) => {
			if (debugMode) {
				const workspace = vscode.workspace.getWorkspaceFolder(item.uri!);
				if (!workspace) {
					parseStderr('Cannot find workspace folder.');
					resolve();
				}

				// Launch style
				debugRunner?.startLaunch(item, workspace!, this.dartDefineArgs()).then(() => {
					vscode.debug.onDidTerminateDebugSession((session) => {
						execute(resolve);
					});
				});
			} else {
				execute(resolve);
			}
		});
		return promise;
    }
}