import path = require('path');
import { CakeTestData } from '../models/cake-test-data';
import { CakeRunHandler } from '../run-handler';
import * as vscode from 'vscode';
import { parseLcovFile } from './coverage-parser';
import { promises as fs } from 'fs';

export class CoverageRunHandler extends CakeRunHandler {
    

    protected async runTest(test: vscode.TestItem, data: CakeTestData): Promise<void> {
        await data.run(test, this.run, false, true);

        // Currently, only Cake flutter tests support coverage
        if (data.isFlutterTest) {
            const workspaceDir = vscode.workspace.workspaceFolders![0].uri.fsPath;
            const lcovPath = 'coverage/cake';
            const filePath = test.label + '.info';
            const fullPath = path.join(workspaceDir, lcovPath, filePath);
            const data = await vscode.workspace.fs.readFile(vscode.Uri.file(fullPath));
            const fileCoverages = parseLcovFile(data.toString(), workspaceDir);
            for (const fileCoverage of fileCoverages) {
                this.run.addCoverage(fileCoverage);
            }

            // Clean up the coverage file after we are done
            this.run.onDidDispose(async () => {
                await fs.rm(fullPath, { recursive: true, force: true });
            });
        }
    }
}