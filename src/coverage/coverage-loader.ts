import * as vscode from 'vscode';
import { CakeFileCoverage } from './cake-coverage-details';

export class CoverageLoader {
    static async loadDetailedCoverage(
        testRun: vscode.TestRun, 
        fileCoverage: vscode.FileCoverage,
        token: vscode.CancellationToken
    ): Promise<vscode.FileCoverageDetail[]> {
        if (token.isCancellationRequested) {
            return [];
        }

        if (fileCoverage instanceof CakeFileCoverage) {
            return fileCoverage.detailedCoverage;
        }

        return [];
    }
}

