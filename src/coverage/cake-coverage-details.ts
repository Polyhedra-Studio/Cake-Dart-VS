import * as vscode from 'vscode';

export class CoverageData {
    linesFound = 0;
    linesHit = 0;
    branchesFound = 0;
    branchesHit = 0;
    lineDetails: Map<number, vscode.StatementCoverage> = new Map();
    functions: vscode.Position[] = [];

    constructor (public readonly file: vscode.Uri) {}

    public get lineCoverage(): vscode.TestCoverageCount {
        return new vscode.TestCoverageCount(
            this.linesHit, 
            this.linesFound);
    }

    public get branchCoverage(): vscode.TestCoverageCount {
        return new vscode.TestCoverageCount(
            this.branchesHit, 
            this.branchesFound);
    }

    public get fileCoverage(): CakeFileCoverage {
        return new CakeFileCoverage(this);
    }

    public get detailedCoverage(): vscode.FileCoverageDetail[] {
        const details: vscode.FileCoverageDetail[] = [];
        this.lineDetails.forEach((value, key) => {
            details.push(value);
        });
        return details;
    }

    public addBranch(taken: number, lineNumber: number, blockNumber: number, branchNumber: number) {
        const coverage = new vscode.BranchCoverage(
            taken,
            new vscode.Position(lineNumber - 1, 0),
            `branch-${blockNumber}-${branchNumber}`,
        );

        this.lineDetails.get(lineNumber)?.branches.push(coverage);
        this.branchesFound++;
        this.branchesHit += taken > 0 ? 1 : 0;
    }

    public addLine(lineNumber: number, hitCount: number) {
        const coverage = new vscode.StatementCoverage(
            hitCount,
            new vscode.Position(lineNumber - 1, 0),
        );

        this.lineDetails.set(lineNumber, coverage);
    }
}

export class CakeFileCoverage extends vscode.FileCoverage {
    constructor(private data: CoverageData) {
        super(data.file, data.lineCoverage, data.branchCoverage);
    }

    public get detailedCoverage(): vscode.FileCoverageDetail[] {
        return this.data.detailedCoverage;
    }
}