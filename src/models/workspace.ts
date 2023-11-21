import * as vscode from 'vscode';
import { CakeTestData } from "./cake-test-data";
import { TestFile, testData } from "./test-file";

export class Workspace extends CakeTestData {
    public name: string;
    public singleWorkspace: boolean;

    constructor(name: string, singleWorkspace: boolean = false) {
        super();
        this.name = name;
        this.singleWorkspace = singleWorkspace;
    }

    protected dartDefineArgs(): string | undefined {
        return undefined;
    }

    public ready: boolean = true;

    private files: Map<string, TestFile> = new Map();

    public async run(item: vscode.TestItem, options: vscode.TestRun, debugMode: boolean = false,): Promise<void> {
        return;
    }

    public updateFile(controller: vscode.TestController, workspaceItem: vscode.TestItem, document: vscode.TextDocument) {
        const id = document.uri.toString();
        const testFile = this.files.get(id);
        if (!testFile) {
            return this.createFile(controller, workspaceItem, document.uri);
        }

        const testFileItem =  workspaceItem.children.get(id)!;
        testFile.updateFromContents(controller, document.getText(), testFileItem);
    }

    public updateFileFromDisk(controller: vscode.TestController, workspaceItem: vscode.TestItem, uri: vscode.Uri) {
        const id = uri.toString();
        const testFile = this.files.get(id);
        if (!testFile) {
            return this.createFile(controller, workspaceItem, uri);
        }

        const testFileItem =  workspaceItem.children.get(id)!;
        testFile.updateFromDisk(controller, testFileItem);
    }

    public createFile(controller: vscode.TestController, workspaceItem: vscode.TestItem, uri: vscode.Uri): TestFile {
        const id = uri.toString();
        const label = uri.path.split('/').pop()!;
        const file = new TestFile();
        this.files.set(id, file);

        const testFileItem = controller.createTestItem(id, label, uri);
        testFileItem.canResolveChildren = true;
        if (this.singleWorkspace) {
            controller.items.add(testFileItem);
        } else {
            workspaceItem.children.add(testFileItem);
        }
        testData.set(testFileItem, file);
        file.updateFromDisk(controller, testFileItem);
        return file;
    }

    public removeFile(workspaceItem: vscode.TestItem, id: string) {
        this.files.delete(id);
        workspaceItem.children.delete(id);
    }

    public getFile(id: string): TestFile | undefined {
        return this.files.get(id);
    }
}