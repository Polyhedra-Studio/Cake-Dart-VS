import * as vscode from 'vscode';
import { TextDecoder } from 'util';

import { parseCakeTest } from '../cake-parser';
import { CakeTestItem, CakeTestRunner, CakeGroup, CakeTestCase } from './cake-test-item';
import { CakeTestData } from './cake-test-data';

const textDecoder = new TextDecoder('utf-8');

export const testData = new WeakMap<vscode.TestItem, CakeTestData>();

/**
 * Represents a file that has Cake tests inside it.
 * This will kick off reading the file and creating a tree of
 * other CakeTestItems.
 *
 */
export class TestFile extends CakeTestData {
	public ready: boolean = false;

	protected dartDefineArgs(): string | undefined {
		return undefined;
	}


	/**
	 * Fetches new information from the filesystem, in case the file did not resolve
	 *
	 * @param {vscode.TestController} controller - The test controller.
	 * @param {vscode.TestItem} item - The test item to update.
	 */
	public async updateFromDisk(controller: vscode.TestController, item: vscode.TestItem) {
		try {
			const content = await this.getContentFromFilesystem(item.uri!);
			item.error = undefined;
			this.updateFromContents(controller, content, item);
		} catch (e) {
			item.error = (e as Error).stack;
		}
	}

	/**
	 * Parses the tests from the input text, and updates the tests of 
     * a TestController from the contents of a file.
     * 
     * @param controller The TestController to update.
     * @param content The contents of the file.
     * @param item The TestItem to update.
     */
	public updateFromContents(controller: vscode.TestController, content: string, item: vscode.TestItem) {
		const ancestors = [{ item, children: [] as vscode.TestItem[] }];
		this.ready = true;

		const ascend = (depth: number) => {
			while (ancestors.length > depth) {
				const finished = ancestors.pop()!;
				finished.item.children.replace(finished.children);
			}
		};

		const createObject = (
			range: vscode.Range, 
			name: string, 
			ctor: new (name: string) => CakeTestItem, 
			parent: { item: vscode.TestItem, children: vscode.TestItem[]},
		): vscode.TestItem => {
			let id = `${parent.item.id}/${name}`;
			// Make sure that the id is unique, even if the user makes the same name for tests
			const duplicateNames = parent.children.filter(child => child.label == name);
			if (duplicateNames.length > 0) {
				id += `(${duplicateNames.length})`;
			}

			const data = new ctor(name);
			const thead = controller.createTestItem(id, data.getLabel(), item.uri);
			thead.range = range;
			testData.set(thead, data);
			parent.children.push(thead);
			return thead;
		}

		parseCakeTest(content, {
			onTest: (range, name) => {
				const parent = ancestors[ancestors.length - 1];
				createObject(range, name, CakeTestCase, parent);
			},
			onGroup: (range, name) => {
				const parent = ancestors[ancestors.length - 1];
				const thead = createObject(range, name, CakeGroup, parent);
				ancestors.push({ item: thead, children: [] });
			},
			onTestRunner: (range, name) => {
				const parent = ancestors[0];
				const thead = createObject(range, name, CakeTestRunner, parent);
				ancestors.push({ item: thead, children: [] });
			},
			onAscend: () => {
				const finished = ancestors.pop()!;
				finished.item.children.replace(finished.children);
			}
		});

        // Finish and assign children for all remaining items
		ascend(0); 
	}

    private getContentFromFilesystem = async (uri: vscode.Uri) => {
        try {
            const rawContent = await vscode.workspace.fs.readFile(uri);
            return textDecoder.decode(rawContent);
        } catch (e) {
            console.warn(`Error providing tests for ${uri.fsPath}`, e);
            return '';
        }
    };
}
