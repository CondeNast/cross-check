import { AliasDescriptor, TypeDescriptor, TypeDescriptors } from "../fundamental/descriptor";
import { required } from "./required";

export interface Descriptor<T extends TypeDescriptor> {
  name: string,
  descriptor: T
}

export type VisitorDelegate<State = null> = {
  [P in keyof TypeDescriptors]: (descriptor: TypeDescriptors[P], state: State) => State;
}

export function visit<State>(descriptor: TypeDescriptor, delegate: VisitorDelegate<State>) {
  switch (descriptor.type) {
    case "Alias": {
      return this.delegate.alias(descriptor, position);
    }

    case "Required": {
      return this.delegate.required(descriptor, position);
    }

    case "Pointer":
    case "Iterator":
    case "List": {
      return this.delegate.generic(descriptor, position);
    }

    case "Dictionary": {
      return this.delegate.dictionary(descriptor, position);
    }

    case "Record": {
      let desc = new TypeBuilder(descriptor).named(descriptor.name)
        .descriptor as AliasDescriptor;

      return this.delegate.alias(desc, position);
    }

    case "Primitive": {
      return this.delegate.primitive(descriptor, position);
    }

    default:
      exhausted(descriptor);
  }
}
}
