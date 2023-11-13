import * as vscode from 'vscode';

export class CakeDebugRunner {
    startLaunch(
        item: vscode.TestItem, 
        workspaceFolder: vscode.WorkspaceFolder,
        runArg: string | undefined,
    ) {
        const config: vscode.DebugConfiguration = {
            type: 'dart',
            name: 'Cake Debugger - Launch',
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
