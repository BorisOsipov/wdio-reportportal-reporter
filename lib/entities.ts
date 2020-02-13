import {STATUS, TYPE} from "./constants";
import {parseTags} from "./utils";

export class StartTestItem {
  public name = "";
  public description;
  public parameters?: any[];
  public tags?: any[];
  public attributes?: any[];
  public type: TYPE;
  public codeRef: string;
  public retry = false;
  public hasStats: boolean;

  constructor(name: string, type: TYPE) {
    this.name = name;
    this.type = type;
    if (this.name.length > 256) {
      this.name = this.name.slice(0, 256);
    }
  }

  public addTags() {
    const tags = parseTags(this.name);
    if (tags.length > 0) {
      this.tags = tags;
      this.attributes = tags.map((value) => ({value}));
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
  private issueType: string;

  // tslint:disable-next-line
  constructor(issue_type: string) {
    this.issue_type = issue_type;
    this.issueType = issue_type;
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
