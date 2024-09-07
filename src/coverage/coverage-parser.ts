import * as vscode from 'vscode';
import * as path from 'path';
import { CakeFileCoverage, CoverageData } from './cake-coverage-details';


export function parseLcovFile(lcovData: string, workspaceDir: string): CakeFileCoverage[] {
    const files = lcovData.split('end_of_record');
    const data: CakeFileCoverage[] = [];

    files.forEach(file => {
        file = file.trim();
        if (file === '') {
            return;
        }

        data.push(parseLcovSection(file, workspaceDir));
    });

    return data;
}

function parseLcovSection(section: string, workspaceDir: string): CakeFileCoverage {
    const lines = section.split('\n');

    // The first line is the name of the file
    const fileName = lines[0].slice(3);
    const fullPath = path.join(workspaceDir, fileName);
    const currentFile = new CoverageData(vscode.Uri.file(fullPath));

    for (const line of lines) {
        if (line.startsWith('SF:') || line.startsWith('end_of_record')) {
            continue;
        } else if (line.startsWith('DA:')) {
            // Handle line coverage
            const [lineNumber, hitCount] = line.slice(3).split(',').map(Number);
            currentFile.addLine(lineNumber, hitCount);
        } else if (line.startsWith('BRDA:')) {
            // Handle branch coverage
            const [lineNumber, blockNumber, branchNumber, taken] = line.slice(5).split(',').map(Number);
            currentFile.addBranch(taken, lineNumber, blockNumber, branchNumber);
        } else if (line.startsWith('FN:')) {
            // Dart doesn't current support function coverage
            continue;
        } else if (line.startsWith('LF:')) {
            const amount = line.slice(3);
            currentFile.linesFound = parseInt(amount);
        } else if (line.startsWith('LH:')) {
            const amount = line.slice(3);
            currentFile.linesHit = parseInt(amount);
        } else if (line.startsWith('BRF:')) {
            const amount = line.slice(3);
            currentFile.branchesFound = parseInt(amount);
        } else if (line.startsWith('BRH:')) {
            const amount = line.slice(3);
            currentFile.branchesHit = parseInt(amount);
        }
    }

    return currentFile.fileCoverage;
}