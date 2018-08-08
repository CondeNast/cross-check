import { Dict, unknown } from "ts-std";
import { RegisteredRecord } from "../../../record";
import * as visitor from "../visitor";

export interface ListTypesTypes extends visitor.RecursiveDelegateTypes {
  primitive: Dict;
  generic: Dict;
  dictionary: Dict;
  alias: Dict;
  record: string[];
}

class ListTypes implements visitor.RecursiveDelegate<ListTypesTypes> {
  private visitor = visitor.RecursiveVisitor.build<ListTypesTypes>(this);

  alias({ name }: visitor.Alias): Dict {
    return { [name]: true };
  }

  required(item: Dict): Dict {
    return item;
  }

  primitive({ name }: visitor.Primitive): Dict {
    return { [name || "anonymous"]: true };
  }

  generic(of: Dict, descriptor: visitor.Container): Dict {
    let kind = descriptor.type;
    let name = `${kind[0].toUpperCase()}${kind.slice(1)}`;
    return { ...of, [name]: true };
  }

  dictionary(descriptor: visitor.Dictionary): Dict {
    return { ...this.dict(descriptor), Dictionary: true };
  }

  record(descriptor: visitor.Record): string[] {
    return Object.keys(this.dict(descriptor)).sort();
  }

  private dict(descriptor: visitor.Dictionary | visitor.Record) {
    let members: Dict = {};

    this.visitor.processDictionary(descriptor, (item: Dict) => {
      members = { ...members, ...item };
    });

    return members;
  }
}

export function listTypes(record: RegisteredRecord): unknown {
  return new ListTypes().record(record.descriptor);
}
