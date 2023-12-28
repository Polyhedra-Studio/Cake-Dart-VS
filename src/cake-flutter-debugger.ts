import * as vscode from 'vscode';

export class CakeFlutterDebugRunner {
    startLaunch(
        item: vscode.TestItem, 
        workspaceFolder: vscode.WorkspaceFolder,
        runArg: string | undefined
    ) {
        const config: vscode.DebugConfiguration = {
            type: 'cake',
            name: 'Cake Debugger (Flutter)',
            request: 'launch',
            cwd: workspaceFolder.uri.path,
            program: item.uri?.path,
            toolArgs: runArg,
        };
        return vscode.debug.startDebugging(workspaceFolder, config, { noDebug: false });
    }

    stop() {
        return vscode.debug.stopDebugging();
    }
}
