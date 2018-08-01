import { Option, dict } from "ts-std";
import { builder } from "../../descriptors";

/**
 * The big-picture story of the various components of Crosscheck Schema is:
 *
 * 1. Design time: build types using the TypeBuilder DSL
 * 2. Serialization: Serialize types into JSON Descriptors
 * 3. Hydration: Hydrate types into Parameterized Descriptors
 * 4. Descriptor Instantiation: Apply type parameters, producing Instantiated Descriptors
 * 5. Type Instantiation: Turn Instantiated Descriptors into Type objects
 *
 * How certain concepts fit into the above story:
 *
 * - Generics are Parameterized Descriptors. They are serialized in Step 2, but
 *   instantiated and erased in Step 4.
 * - Drafts work by making all types conditional types, parameterized by a boolean
 * - Required works like this:
 *   - Optional<T> = T | null
 *   - Required<T> = T
 *   - .required() produces a Required<T>
 *   - Dictionaries are mapped types that transform Required<T> -> T and T -> Optional<T>
 */

type VisitMethod<D extends builder.Descriptor> = (
  this: FeaturesVisitor,
  desc: D,
  neededFeatures: Option<string[]>
) => D | undefined;

type Visitor = {
  [P in keyof builder.Descriptors]: VisitMethod<builder.Descriptors[P]>
};

class FeaturesVisitor {
  constructor(readonly featureList: string[]) {}

  Alias(
    desc: builder.Alias,
    neededFeatures: Option<string[]>
  ): builder.Alias | undefined {
    let inner = this.visitValue(desc.inner, neededFeatures);

    if (inner === undefined) {
      return undefined;
    } else {
      return {
        ...desc,
        inner
      };
    }
  }

  List(
    desc: builder.List,
    neededFeatures: Option<string[]>
  ): builder.List | undefined {
    return this.visitContainer(desc, neededFeatures);
  }

  Iterator(
    desc: builder.Iterator,
    neededFeatures: Option<string[]>
  ): builder.Iterator | undefined {
    return this.visitContainer(desc, neededFeatures);
  }

  Pointer(
    desc: builder.Pointer,
    neededFeatures: Option<string[]>
  ): builder.Pointer | undefined {
    return this.visitContainer(desc, neededFeatures);
  }

  Record(
    desc: builder.Record,
    neededFeatures: Option<string[]>
  ): builder.Record | undefined {
    return this.visitDictionary(desc, neededFeatures);
  }

  Dictionary(
    desc: builder.Dictionary,
    neededFeatures: Option<string[]>
  ): builder.Dictionary | undefined {
    return this.visitDictionary(desc, neededFeatures);
  }

  Primitive(
    desc: builder.Primitive,
    neededFeatures: Option<string[]>
  ): builder.Primitive | undefined {
    if (hasFeatures(this.featureList, neededFeatures)) {
      return desc;
    } else {
      return undefined;
    }
  }

  Refined(
    desc: builder.Refined,
    neededFeatures: Option<string[]>
  ): builder.Refined | undefined {
    if (hasFeatures(this.featureList, neededFeatures)) {
      return desc;
    } else {
      return undefined;
    }
  }

  Generic(_desc: builder.Generic, _accumulator: any): any {
    throw new Error("Not implemented; FeaturesVisitor#Generic");
  }

  visit<D extends builder.Descriptor>(
    desc: D,
    featureList: string[]
  ): D | undefined {
    return this.visitValue(desc, featureList);
  }

  private visitValue<D extends builder.Descriptor>(
    desc: D,
    neededFeatures: Option<string[]>
  ): D | undefined {
    let result = this.target(desc.type).call(this, desc, neededFeatures);

    if (hasFeatures(this.featureList, neededFeatures)) {
      return result;
    } else {
      return undefined;
    }
  }

  private visitContainer<D extends builder.Container>(
    desc: D,
    neededFeatures: Option<string[]>
  ): D | undefined {
    let inner = this.visitValue(desc.inner, neededFeatures);

    return inner && Object.assign({}, desc, { inner });
  }

  private target<K extends keyof builder.Descriptors>(
    key: K
  ): VisitMethod<builder.Descriptors[K]> {
    return (this as Visitor)[key] as VisitMethod<builder.Descriptors[K]>;
  }

  private visitDictionary<D extends builder.Dictionary | builder.Record>(
    desc: D,
    neededFeatures: Option<string[]>
  ): D | undefined {
    let members = desc.members;
    let memberNames = Object.keys(members);
    let mapped = dict<builder.Member>();

    memberNames.forEach((name, _index) => {
      let member = members[name]!;

      let innerNeededFeatures =
        member.meta && member.meta.features ? member.meta.features : null;

      let inner = this.visitValue(member.descriptor, innerNeededFeatures);

      if (inner !== undefined) {
        mapped[name] = { descriptor: inner, meta: member.meta };
      }
    });

    if (hasFeatures(this.featureList, neededFeatures)) {
      return Object.assign({}, desc, {
        members: mapped
      });
    } else {
      return undefined;
    }
  }
}

function hasFeatures(
  featureList: string[],
  neededFeatures: Option<string[]>
): boolean {
  if (neededFeatures === null) return true;
  return neededFeatures.every(f => featureList.indexOf(f) !== -1);
}

export function applyFeatures(
  desc: builder.Record,
  featureList: string[]
): builder.Record {
  return new FeaturesVisitor(featureList).visit(desc, featureList)!;
}
