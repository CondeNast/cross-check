import { Dict } from "ts-std";
import { Record } from "../../../record";
import {
  DictionaryLabel,
  GenericLabel,
  Label,
  NamedLabel,
  RecordLabel,
  typeNameOf
} from "../label";
import { RecursiveDelegate, RecursiveVisitor } from "../visitor";

class ListTypes implements RecursiveDelegate {
  private visitor = RecursiveVisitor.build(this);

  named({ name }: NamedLabel): Dict {
    return { [name]: true };
  }

  primitive({ name }: Label): Dict {
    return { [typeNameOf(name)]: true };
  }

  generic(of: Dict, label: Label<GenericLabel>): Dict {
    let kind = label.type.kind;
    let name = `${kind[0].toUpperCase()}${kind.slice(1)}`;
    return { ...of, [name]: true };
  }

  dictionary(label: DictionaryLabel): Dict {
    return { ...this.dict(label), Dictionary: true };
  }

  record(label: RecordLabel): string[] {
    return Object.keys(this.dict(label)).sort();
  }

  private dict(label: DictionaryLabel | RecordLabel) {
    let members: Dict = {};

    this.visitor.processDictionary(label, (item: Dict) => {
      members = { ...members, ...item };
    });

    return members;
  }
}

export function listTypes(record: Record): unknown {
  return new ListTypes().record(record.label.type);
}
