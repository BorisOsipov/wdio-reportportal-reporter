import {STATUS, TYPE} from "./constants";
import {parseTags} from "./utils";
import {Attribute} from "./ReporterOptions";

export class StartTestItem {
  public name = "";
  public description;
  public parameters?: any[];
  public attributes = [];
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
      const attrs = tags.map((value) => (new Attribute(undefined, value)));
      this.attributes.push(...attrs);
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
  private issueType: string;

  constructor(issueType: string) {
    this.issueType = issueType;
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
