import {StorageEntity} from "./entities";

export class Storage {
  private testItems = new Map<string, StorageEntity>();
  private allTestItems = new Array<StorageEntity>();
  private suites = new Array<StorageEntity>();

  public getCurrentSuite() {
    const currentSuite = this.suites[this.suites.length - 1];
    return currentSuite ? currentSuite : null;
  }

  public getCurrentTest() {
    const activeTests = Array.from(this.testItems.values());
    if (activeTests.length === 0) {
      return null;
    }
    return activeTests[activeTests.length - 1];
  }

  public addSuite(value: StorageEntity) {
    this.suites.push(value);
  }

  public removeSuite() {
    this.suites.pop();
  }

  public addTest(uid: string, value: StorageEntity) {
    this.testItems.set(uid, value);
    this.allTestItems.push(value);
  }

  public removeTest(item: StorageEntity) {
    return this.testItems.delete(item.wdioEntity.uid);
  }

  public getStartedTests(): StorageEntity[] {
    const tests = this.allTestItems || [];
    return tests.slice();
  }
}
