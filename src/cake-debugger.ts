import * as vscode from 'vscode';

export class CakeDebugRunner {
    startLaunch(item: vscode.TestItem, workspaceFolder: vscode.WorkspaceFolder, propertyToSearchFor: string, name: string) {
        const config: vscode.DebugConfiguration = {
            type: 'dart',
            name: 'Cake Debugger - Launch',
            request: 'launch',
            program: item.uri?.path,
            toolArgs: [
                `--define=${propertyToSearchFor}=${name}`,
            ],
        };
        return vscode.debug.startDebugging(workspaceFolder, config, { noDebug: false });
    }

    stop() {
        return vscode.debug.stopDebugging();
    }
}
