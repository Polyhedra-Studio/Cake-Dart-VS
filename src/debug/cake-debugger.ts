import * as vscode from 'vscode';

export class CakeDebugRunner {
    startLaunch(
        item: vscode.TestItem, 
        workspaceFolder: vscode.WorkspaceFolder,
        runArg: string | undefined,
        isFlutter: boolean,
    ) {
        const path: string = item.uri?.path ?? '';
        const cwd: string = workspaceFolder.uri.path;
        const config: vscode.DebugConfiguration = isFlutter ? {
            type: 'dart',
            name: 'Cake Debugger (Flutter)',
            request: 'launch',
            cwd: cwd,
            program: path,
            toolArgs: runArg,
            deviceId: 'flutter-tester',
        } : {
            type: 'dart',
            name: 'Cake Debugger',
            request: 'launch',
            program: path,
            toolArgs: runArg,
        };
        return vscode.debug.startDebugging(workspaceFolder, config, { noDebug: false });
    }

    stop() {
        return vscode.debug.stopDebugging();
    }
}
