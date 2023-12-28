import { CakeTestData } from './cake-test-data';

export abstract class CakeTestItem extends CakeTestData {
	protected abstract propertyToSearchFor: string;
	public ready: boolean = true;

	constructor(
		protected readonly name: string,
		protected readonly isFlutter: boolean,
	) {
		super();
	}

	protected dartDefineArgs(): string | undefined {
		return `--${this.isFlutter ? 'dart-' : ''}define=${this.propertyToSearchFor}='${this.name}'`;
	}

	public getLabel() {
		let name = this.name;
		if (this.name[0] == "'" && this.name[this.name.length - 1] == "'") {
			name = this.name.slice(1, this.name.length - 1);
		}
		return name;
	}
}

export class CakeTestCase extends CakeTestItem {
	protected propertyToSearchFor: string = 'testSearchFor';
}

export class CakeGroup extends CakeTestItem {
	protected propertyToSearchFor: string = 'groupSearchFor';
}

export class CakeTestRunner extends CakeTestItem {
	protected propertyToSearchFor: string = 'testRunnerSearchFor';
}