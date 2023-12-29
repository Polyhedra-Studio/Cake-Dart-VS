import * as vscode from 'vscode';
import { exec } from 'node:child_process';

import { CakeDebugRunner } from '../cake-debugger';
import { parseResults } from '../cake-parser';

export abstract class CakeTestData {
    protected abstract dartDefineArgs(): string | undefined;
    public abstract ready: boolean;
	protected isFlutter: boolean = false;

	public async run(
		item: vscode.TestItem,
		options: vscode.TestRun,
		debugMode: boolean = false,
	): Promise<void> {

		const action: string = this.isFlutter ? 'flutter test' : 'dart run';
		let cmd: string = `${action} ${this.dartDefineArgs() ? this.dartDefineArgs() : ''} ${item.uri!.path}`;

		const parseStderr = (output: string) => {
			const message = new vscode.TestMessage(`Internal error\n${output}`);
			message.location = new vscode.Location(item.uri!, item.range!);
			options.failed(item, message);
		}

		const parseStdout = (output: string) => {
			// Ignore lines that have a timestamp. This is given by the 
			// Flutter test runner and should be ignored.
			const strippedOutput = output
				.replaceAll(/^\d+:\d+ \+\d+.*/gm, '')
				.trim();

			const sanitizedOutput = strippedOutput
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
					const errorMessage = parseResults(strippedOutput, child.label);
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
			if (strippedOutput.startsWith('[32m')) {
				passedRecursive(item);
			} else if (strippedOutput.startsWith('[31m')) {
				failedRecursive(item);
			} if (strippedOutput.startsWith('[90m')) {
				neutralRecursive(item);
			} else {
				// Likely this is some sort of system error or message, make sure to display something
				failedRecursive(item);
			}
		};

		const execute = (resolve: any, cwd: string | undefined = undefined) => {
			exec(
				cmd, { cwd: cwd }, (error, stdout, stderr) => {
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
			const workspace = vscode.workspace.getWorkspaceFolder(item.uri!);
			if (!workspace) {
				parseStderr('Cannot find workspace folder.');
				resolve();
			}

			if (debugMode) {
				new CakeDebugRunner().startLaunch(item, workspace!, this.dartDefineArgs(), this.isFlutter).then(() => {
					vscode.debug.onDidTerminateDebugSession((session) => {
						execute(resolve, workspace?.uri.fsPath);
					});
				});
			} else {
				execute(resolve, workspace?.uri.fsPath);
			}
		});
		return promise;
    }
}