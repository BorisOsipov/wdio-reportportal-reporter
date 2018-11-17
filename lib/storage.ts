import {TYPE} from "./constants";
import {StorageEntity} from "./entities";

export class Storage {
  private parents = new Map<string, StorageEntity[]>();
  private startedTests = new Map<string, StorageEntity[]>();

  public get(cid: string): StorageEntity | null {
    const parents = this.getParentIds(cid);
    if (!parents.length) {
      return null;
    }
    return parents[parents.length - 1];
  }

  public add(cid: string, value: StorageEntity) {
    const parents = this.getParentIds(cid);
    parents.push(value);

    if (value.type  === TYPE.SUITE) {
      if (!this.startedTests[value.wdioEntity.cid]) {
        this.startedTests[value.wdioEntity.cid] = [];
      }
    }
    if (value.type  === TYPE.STEP) {
      this.startedTests[value.wdioEntity.cid].push(value);
    }
  }

  public clear(cid: string) {
    const parents = this.getParentIds(cid);
    parents.pop();
  }

  public getStartedTests(cid: string): StorageEntity[] {
    const tests = this.startedTests[cid] || [];
    return tests.slice();
  }

  public clearStartedTests(cid: string): void {
    delete this.startedTests[cid];
  }

  private getParentIds(cid: string) {
    if (this.parents.has(cid)) {
      return this.parents.get(cid);
    }

    this.parents.set(cid, []);
    return this.parents.get(cid);
  }
}
