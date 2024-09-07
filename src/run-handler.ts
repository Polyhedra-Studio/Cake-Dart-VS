import * as vscode from 'vscode';
import { CakeTestData } from './models/cake-test-data';
import { testData } from './models/test-file';
import { Workspace } from './models/workspace';

export class CakeRunHandler {
    protected run: vscode.TestRun;
    private queue: { test: vscode.TestItem; data: CakeTestData }[] = [];
    constructor(
        private readonly ctrl: vscode.TestController,
        private readonly request: vscode.TestRunRequest,
        private readonly cancellation: vscode.CancellationToken,
    ) {
        this.run = ctrl.createTestRun(request);
    }

    public runHandler() {
		const runTestQueue = async () => {
			for (const { test, data } of this.queue) {
				if (this.cancellation.isCancellationRequested) {
					this.run.skipped(test);
				} else {
                    await this.runTest(test, data);
				}
			}

			this.run.end();
		};

		this.discoverTests(this.request.include ?? this.gatherTestItems(this.ctrl.items)).then(runTestQueue);
	};

    protected async runTest(test: vscode.TestItem, data: CakeTestData) {
        this.run.started(test);
        await data.run(test, this.run);
    }

    private async discoverTests(tests: Iterable<vscode.TestItem>) {
        for (const test of tests) {
            if (this.request.exclude?.includes(test)) {
                continue;
            }

            const data: CakeTestData | undefined = testData.get(test);
            if (data) {
                if (data instanceof Workspace) {
                    await this.discoverTests(this.gatherTestItems(test.children));
                } else {
                    this.run.enqueued(test);
                    this.queue.push({ test, data });
                }
            }
        }
    };

    private gatherTestItems(collection: vscode.TestItemCollection) {
        const items: vscode.TestItem[] = [];
        collection.forEach(item => items.push(item));
        return items;
    }
}