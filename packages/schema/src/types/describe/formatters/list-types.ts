import * as visitor from "../visitor";

export interface ListTypesTypes extends visitor.RecursiveDelegateTypes {
  primitive: { [key: string]: unknown };
  generic: { [key: string]: unknown };
  dictionary: { [key: string]: unknown };
  alias: { [key: string]: unknown };
  record: string[];
}

class ListTypes implements visitor.RecursiveDelegate<ListTypesTypes> {
  private visitor = visitor.RecursiveVisitor.build<ListTypesTypes>(this);

  alias({ name }: visitor.Alias): { [key: string]: unknown } {
    return { [name]: true };
  }

  required(item: { [key: string]: unknown }): { [key: string]: unknown } {
    return item;
  }

  primitive({ name }: visitor.Primitive): { [key: string]: unknown } {
    return { [name || "anonymous"]: true };
  }

  generic(of: { [key: string]: unknown }, descriptor: visitor.Container): { [key: string]: unknown } {
    let kind = descriptor.type;

    if (kind === "List") {
      return { ...of, List: true };
    } else {
      return of;
    }
  }

  dictionary(descriptor: visitor.Dictionary): { [key: string]: unknown } {
    return { ...this.dict(descriptor), Dictionary: true };
  }

  record(descriptor: visitor.Record): string[] {
    return Object.keys(this.dict(descriptor)).sort();
  }

  private dict(descriptor: visitor.Dictionary | visitor.Record) {
    let members: { [key: string]: unknown } = {};

    this.visitor.processDictionary(descriptor, (item: { [key: string]: unknown }) => {
      members = { ...members, ...item };
    });

    return members;
  }
}

export const listTypes = visitor.recursive<ListTypesTypes>(ListTypes);

// export function listTypes(
//   record: FormattableRecord,
//   registry: Registry
// ): unknown {
//   return new ListTypes().record(record.descriptor(registry));
// }
