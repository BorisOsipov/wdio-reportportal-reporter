import {STATUS, TYPE} from "./constants";
import {Attribute} from "./ReporterOptions";
import {parseTags} from "./utils";

export class StartTestItem {
  public name = "";
  public description?: string;
  public parameters?: any[];
  public attributes = [];
  public type: TYPE;
  public codeRef?: string;
  public retry = false;
  public hasStats?: boolean;

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
      const attrs = tags.map((value) =>
        value.includes(':')
          ? (new Attribute(value.split(':')[0], value.split(':')[1]))
          : (new Attribute(undefined, value))
      );
      this.attributes.push(...attrs);
    }
  }

  public addSLID(id: string) {
    this.attributes.push({key: "SLID", value: id});
  }

  public addSLDC(id: string) {
    this.attributes.push({key: "SLDC", value: id});
  }
}

export class EndTestItem {
  public status: STATUS;
  public issue?: Issue;
  public description?: string;
  public attributes: Attribute[] = []

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
