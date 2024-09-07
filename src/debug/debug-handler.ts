import { TestItem } from "vscode";
import { CakeTestData } from "../models/cake-test-data";
import { CakeRunHandler } from "../run-handler";

export class DebugHandler extends CakeRunHandler {
    protected runTest(test: TestItem, data: CakeTestData): Promise<void> {
        return data.run(test, this.run, true);
    }
}