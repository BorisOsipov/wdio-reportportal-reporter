import {STATUS, TYPE} from "./constants";
import {parseTags} from "./utils";

export class SuiteStartObj {
  public name = "";
  public description?: string;
  public tags?: string[];
  private readonly type = TYPE.SUITE;

  constructor(name: string) {
    this.name = name;
  }
}

export class TestStartObj {
  public name = "";
  public parameters?: any[];
  public tags?: any[];
  private readonly type = TYPE.STEP;

  constructor(name: string) {
    this.name = name;
  }

  public addTagsToTest(parseTagsFromTestTitle) {
    if (parseTagsFromTestTitle) {
      const tags = parseTags(this.name);
      if (tags.length > 0) {
        this.tags = tags;
      }
    }
  }
}

export class TestEndObj {
  public status: STATUS;
  public issue?: Issue;
  public description?: string;

  constructor(status: STATUS, issue: Issue) {
    this.status = status;
    if (issue) {
      this.issue = issue;
    }
  }
}

export class Issue {
  // tslint:disable-next-line
  public issue_type: string;

  // tslint:disable-next-line
  constructor(issue_type: string) {
    this.issue_type = issue_type;
  }
}

export class StorageEntity {
  public readonly type: TYPE.STEP | TYPE.SUITE;
  public readonly id: string;
  public readonly promise: Promise<any>;
  public readonly wdioEntity: any;

  constructor(type: TYPE.STEP | TYPE.SUITE, id: string, promise: Promise<any>, wdioEntity: any) {
    this.type = type;
    this.id = id;
    this.promise = promise;
    this.wdioEntity = wdioEntity;
  }
}
