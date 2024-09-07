import * as vscode from 'vscode';
import { testData, TestFile } from './models/test-file';
import { Workspace } from './models/workspace';
import { CakeRunHandler } from './run-handler';
import { DebugHandler } from './debug/debug-handler';
import { CoverageRunHandler } from './coverage/coverage-handler';
import { CoverageLoader } from './coverage/coverage-loader';

export async function activate(context: vscode.ExtensionContext) {
	const ctrl = vscode.tests.createTestController('cakeDartFlutterTester', 'Cake Dart & Flutter Tester');
	context.subscriptions.push(ctrl);

	ctrl.refreshHandler = async () => {
		await Promise.all(getWorkspaceTestPatterns().map(({ pattern }) => scanFiles(ctrl, pattern)));
	};

	ctrl.createRunProfile(
		'Run Tests',
		vscode.TestRunProfileKind.Run,
		(request, token) => new CakeRunHandler(ctrl, request, token).runHandler(),
		true
	);

	ctrl.createRunProfile(
		'Debug Tests',
		vscode.TestRunProfileKind.Debug,
		(request, token) => new DebugHandler(ctrl, request, token).runHandler(),
		false
	);

    const coverageProfile =	ctrl.createRunProfile(
		'Run with Coverage',
		vscode.TestRunProfileKind.Coverage,
		(request, token) => new CoverageRunHandler(ctrl, request, token).runHandler(),
		false
	);
	coverageProfile.loadDetailedCoverage = CoverageLoader.loadDetailedCoverage;

	ctrl.resolveHandler = async item => {
		if (!item) {
			scanAllFiles(ctrl);
			return;
		}

		const data = testData.get(item);
		if (data instanceof TestFile) {
			await data.updateFromDisk(ctrl, item);
		}
	};

	startWatchingWorkspaces(ctrl);
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

function scanAllFiles(controller: vscode.TestController) {
	return Promise.all(getWorkspaceTestPatterns().map(({ workspaceFolder, pattern }) => scanFiles(controller, pattern)));
}

function getOrCreateWorkspace(controller: vscode.TestController, uri: vscode.Uri): { file: vscode.TestItem, data: Workspace } {
	const workspace = vscode.workspace.getWorkspaceFolder(uri);
	const workspaceId = workspace?.name ?? 'single_workspace';
	const existing = controller.items.get(workspaceId);
	if (existing) {
		return { file: existing, data: testData.get(existing) as Workspace };
	}

	const singleWorkspace = vscode.workspace.workspaceFolders === undefined || vscode.workspace.workspaceFolders.length === 1;
	const file = controller.createTestItem(workspaceId, workspace?.name ?? 'Workspace');
	const data = new Workspace(workspace?.name ?? 'Workspace', singleWorkspace);
	testData.set(file, data);
	file.canResolveChildren = true;
	if (!singleWorkspace) {
		controller.items.add(file);
	}
	return { file, data };
}

async function scanFiles(controller: vscode.TestController, pattern: vscode.GlobPattern) {
	for (const file of await vscode.workspace.findFiles(pattern)) {
		const workspaceData = getOrCreateWorkspace(controller, file);
		workspaceData.data.createFile(controller, workspaceData.file, file);
	}
}

function isCakeFile(uri: vscode.Uri) {
	return uri.scheme === 'file' && uri.path.endsWith('.cake.dart');
}

function createNodeForUri(controller: vscode.TestController, uri: vscode.Uri) {
	if (isCakeFile(uri)) {
		const workspace = getOrCreateWorkspace(controller, uri);
		workspace.data.createFile(controller, workspace.file, uri);
	}
}

function updateNodeForUri(controller: vscode.TestController, uri: vscode.Uri) {
	if (isCakeFile(uri)) {
		const workspace = getOrCreateWorkspace(controller, uri);
		workspace.data.updateFileFromDisk(controller, workspace.file, uri);
	}
}

function removeNodeForUri(controller: vscode.TestController, uri: vscode.Uri) {
	if (isCakeFile(uri)) {
		const workspace = getOrCreateWorkspace(controller, uri);
		workspace.data.removeFile(workspace.file, uri.toString());
	}
}

function startWatchingWorkspaces(controller: vscode.TestController) {
	return getWorkspaceTestPatterns().map(({ workspaceFolder, pattern }) => {
		const watcher = vscode.workspace.createFileSystemWatcher(pattern);
		watcher.onDidChange(e => updateNodeForUri(controller, e)),
			watcher.onDidCreate(e => createNodeForUri(controller, e)),
			watcher.onDidDelete(e => removeNodeForUri(controller, e));

		return watcher;
	});
}
