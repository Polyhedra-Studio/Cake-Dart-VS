import * as vscode from 'vscode';
import { testData, TestFile } from './models/test-file';
import { CakeTestCase } from './models/cake-test-item';

export async function activate(context: vscode.ExtensionContext) {
	const ctrl = vscode.tests.createTestController('cakeDartTester', 'Cake Dart Tester');
	context.subscriptions.push(ctrl);

	const runHandler = (request: vscode.TestRunRequest, cancellation: vscode.CancellationToken, debugMode: boolean = false) => {
		const queue: { test: vscode.TestItem; data: CakeTestCase }[] = [];
		const run = ctrl.createTestRun(request);

		const discoverTests = async (tests: Iterable<vscode.TestItem>) => {
			for (const test of tests) {
				if (request.exclude?.includes(test)) {
					continue;
				}

				const data: any = testData.get(test);
				if (data && data.ready) {
					run.enqueued(test);
					queue.push({ test, data });
				} else {
					if (data instanceof TestFile && !data.ready) {
						await data.updateFromDisk(ctrl, test);
					}
				}
			}
		};

		const runTestQueue = async () => {
			for (const { test, data } of queue) {
				run.appendOutput(`Running ${test.id}\r\n`);
				if (cancellation.isCancellationRequested) {
					run.skipped(test);
				} else {
					run.started(test);
					await data.run(test, run, debugMode);
				}

				run.appendOutput(`Completed ${test.id}\r\n`);
			}

			run.end();
		};

		discoverTests(request.include ?? gatherTestItems(ctrl.items)).then(runTestQueue);
	};

	ctrl.refreshHandler = async () => {
		await Promise.all(getWorkspaceTestPatterns().map(({ pattern }) => findInitialFiles(ctrl, pattern)));
	};

	ctrl.createRunProfile('Run Tests', vscode.TestRunProfileKind.Run, runHandler, true);

	ctrl.createRunProfile('Debug Tests', vscode.TestRunProfileKind.Debug, (request, token) => runHandler(request, token, true), false);

	ctrl.resolveHandler = async item => {
		if (!item) {
			context.subscriptions.push(...startWatchingWorkspace(ctrl));
			return;
		}

		const data = testData.get(item);
		if (data instanceof TestFile) {
			await data.updateFromDisk(ctrl, item);
		}
	};

	// Do an initial scan for any valid test files
	for (const document of vscode.workspace.textDocuments) {
		updateNodeForDocument(ctrl, document);
	}

	// Watch for changes to test files
	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(e => updateNodeForDocument(ctrl, e.document)),
		vscode.workspace.onDidCreateFiles(e => createNodeForDocuments(ctrl, e.files)),
		vscode.workspace.onDidRenameFiles(e => renameNodeForDocument(ctrl, e.files)),
		vscode.workspace.onDidDeleteFiles(e => removeNodeForDocuments(ctrl, e.files)),
	);
}

function isCakeFile(uri: vscode.Uri) {
	return uri.scheme === 'file' && uri.path.endsWith('.cake.dart');
}

function updateNodeForDocument(controller: vscode.TestController,  document: vscode.TextDocument) {
	if (!isCakeFile(document.uri)) {
		return;
	}

	const { file, data } = getOrCreateFile(controller, document.uri);
	data.updateFromContents(controller, document.getText(), file);
}

function createNodeForDocuments(controller: vscode.TestController, files: readonly vscode.Uri[]) {
	for (const document of vscode.workspace.textDocuments) {
		updateNodeForDocument(controller, document);
	}
}

function removeNodeForDocuments(controller: vscode.TestController, files: readonly vscode.Uri[]) {
	for (const document of vscode.workspace.textDocuments) {
		if (!isCakeFile(document.uri)) {
			controller.items.delete(document.uri.toString());
		}
	}
}

function renameNodeForDocument(controller: vscode.TestController,  files: readonly { readonly oldUri: vscode.Uri, readonly newUri: vscode.Uri }[]) {
	for (const { oldUri, newUri } of files) {
		if (isCakeFile(oldUri)) {
			controller.items.delete(oldUri.toString());
			if (isCakeFile(newUri)) {
				const { file, data } = getOrCreateFile(controller, newUri);
				data.updateFromDisk(controller, file);
			}
		}
	}
}

function getOrCreateFile(controller: vscode.TestController, uri: vscode.Uri) {
	const itemId = uri.toString();
	const existing = controller.items.get(itemId);
	if (existing) {
		return { file: existing, data: testData.get(existing) as TestFile };
	}

	const file = controller.createTestItem(itemId, uri.path.split('/').pop()!, uri);
	controller.items.add(file);

	const data = new TestFile();
	testData.set(file, data);

	file.canResolveChildren = true;
	return { file, data };
}

function gatherTestItems(collection: vscode.TestItemCollection) {
	const items: vscode.TestItem[] = [];
	collection.forEach(item => items.push(item));
	return items;
}

function getWorkspaceTestPatterns() {
	if (!vscode.workspace.workspaceFolders) {
		return [];
	}

	return vscode.workspace.workspaceFolders.map(workspaceFolder => ({
		workspaceFolder,
		pattern: new vscode.RelativePattern(workspaceFolder, '**/*.cake.dart'),
	}));
}

async function findInitialFiles(controller: vscode.TestController, pattern: vscode.GlobPattern) {
	for (const file of await vscode.workspace.findFiles(pattern)) {
		getOrCreateFile(controller, file);
	}
}

function startWatchingWorkspace(controller: vscode.TestController) {
	return getWorkspaceTestPatterns().map(({ workspaceFolder, pattern }) => {
		const watcher = vscode.workspace.createFileSystemWatcher(pattern);

		watcher.onDidCreate(uri => getOrCreateFile(controller, uri));
		watcher.onDidChange(uri => {
			const { file, data } = getOrCreateFile(controller, uri);
			if (!data.ready) {
				data.updateFromDisk(controller, file);
			}
		});
		watcher.onDidDelete(uri => controller.items.delete(uri.toString()));

		findInitialFiles(controller, pattern);

		return watcher;
	});
}
