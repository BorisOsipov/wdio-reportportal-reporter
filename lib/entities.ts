import {STATUS, TYPE} from "./constants";
import {parseTags} from "./utils";

export class StartTestItem {
  public name = "";
  public description;
  public parameters?: any[];
  public tags?: any[];
  public type: TYPE;

  constructor(name: string, type: TYPE) {
    this.name = name;
    this.type = type;
    if (this.name.length > 256) {
      this.name = this.name.slice(0, 256);
    }
  }

  public addTagsToTest() {
    const tags = parseTags(this.name);
    if (tags.length > 0) {
      this.tags = tags;
    }
  }
}

export class EndTestItem {
  public status: STATUS;
  public issue?: Issue;
  public description?: string;

  constructor(status: STATUS, issue?: Issue) {
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
  public readonly type: TYPE;
  public readonly id: string;
  public readonly promise: Promise<any>;
  public readonly wdioEntity: any;

  constructor(type: TYPE, id: string, promise: Promise<any>, wdioEntity: any) {
    this.type = type;
    this.id = id;
    this.promise = promise;
    this.wdioEntity = wdioEntity;
  }
}
