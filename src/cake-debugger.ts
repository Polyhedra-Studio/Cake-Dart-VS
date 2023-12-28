import * as vscode from 'vscode';

export class CakeDebugRunner {
    startLaunch(
        item: vscode.TestItem, 
        workspaceFolder: vscode.WorkspaceFolder,
        runArg: string | undefined,
        isFlutter: boolean,
    ) {
        const config: vscode.DebugConfiguration = isFlutter ? {
            type: 'dart',
            name: 'Cake Debugger (Flutter)',
            request: 'launch',
            cwd: workspaceFolder.uri.path,
            program: item.uri?.path,
            toolArgs: runArg,
            deviceId: 'flutter-tester',
        } : {
            type: 'dart',
            name: 'Cake Debugger',
            request: 'launch',
            program: item.uri?.path,
            toolArgs: runArg,
        };
        return vscode.debug.startDebugging(workspaceFolder, config, { noDebug: false });
    }

    stop() {
        return vscode.debug.stopDebugging();
    }
}
