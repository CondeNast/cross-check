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

class Accumulator<D extends builder.Descriptor> {
  constructor(
    readonly neededFeatures: Option<string[]>,
    readonly descriptor: D | null | undefined
  ) {}

  set(descriptor: D | undefined): Accumulator<D> {
    return new Accumulator(this.neededFeatures, descriptor);
  }

  finish(): D | undefined {
    if (this.descriptor === null) {
      throw new Error("must call set() before finish()");
    }

    return this.descriptor;
  }
}

type VisitMethod<D extends builder.Descriptor> = (
  this: FeaturesVisitor,
  desc: D,
  accumulator: Accumulator<D>
) => Accumulator<D>;

type Visitor = {
  [P in keyof builder.Descriptors]: VisitMethod<builder.Descriptors[P]>
};

class FeaturesVisitor {
  constructor(readonly featureList: string[]) {}

  Alias(
    desc: builder.Alias,
    accumulator: Accumulator<builder.Alias>
  ): Accumulator<builder.Alias> {
    let innerAccumulator = new Accumulator(
      accumulator.neededFeatures,
      desc.inner
    );

    let inner = this.visitValue(innerAccumulator, desc.inner);

    if (inner === undefined) {
      return accumulator.set(undefined);
    } else {
      return accumulator.set({
        ...desc,
        inner
      });
    }
  }

  List(
    desc: builder.List,
    accumulator: Accumulator<builder.List>
  ): Accumulator<builder.List> {
    return this.visitContainer(accumulator, desc);
  }

  Iterator(
    desc: builder.Iterator,
    accumulator: Accumulator<builder.Iterator>
  ): Accumulator<builder.Iterator> {
    return this.visitContainer(accumulator, desc);
  }

  Pointer(
    desc: builder.Pointer,
    accumulator: Accumulator<builder.Pointer>
  ): Accumulator<builder.Pointer> {
    return this.visitContainer(accumulator, desc);
  }

  Record(
    desc: builder.Record,
    accumulator: Accumulator<builder.Record>
  ): Accumulator<builder.Record> {
    return this.visitDictionary(desc, accumulator);
  }

  Dictionary(
    desc: builder.Dictionary,
    accumulator: Accumulator<builder.Dictionary>
  ): Accumulator<builder.Dictionary> {
    return this.visitDictionary(desc, accumulator);
  }

  Primitive(
    desc: builder.Primitive,
    accumulator: Accumulator<builder.Primitive>
  ): Accumulator<builder.Primitive> {
    return accumulate(accumulator, desc, this.featureList);
  }

  Refined(
    desc: builder.Refined,
    accumulator: Accumulator<builder.Refined>
  ): Accumulator<builder.Refined> {
    return accumulate(accumulator, desc, this.featureList);
  }

  Generic(_desc: builder.Generic, _accumulator: any): any {
    throw new Error("Not implemented; FeaturesVisitor#Generic");
  }

  visit<D extends builder.Descriptor>(
    desc: D,
    featureList: string[]
  ): D | undefined {
    let input = new Accumulator(featureList, desc);
    return this.visitValue(input, desc);
  }

  private visitValue<D extends builder.Descriptor>(
    start: Accumulator<D>,
    desc: D
  ): D | undefined {
    let accumulator = this.target(desc.type).call(this, desc, start);

    if (hasFeatures(this.featureList, start.neededFeatures)) {
      return accumulator.finish();
    } else {
      return undefined;
    }
  }

  private visitContainer<D extends builder.Container>(
    accumulator: Accumulator<D>,
    desc: D
  ): Accumulator<D> {
    let inner = this.visitValue(accumulator, desc.inner);

    return accumulator.set(inner && Object.assign({}, desc, { inner }));
  }

  private target<K extends keyof builder.Descriptors>(
    key: K
  ): VisitMethod<builder.Descriptors[K]> {
    return (this as Visitor)[key] as VisitMethod<builder.Descriptors[K]>;
  }

  private visitDictionary<D extends builder.Dictionary | builder.Record>(
    desc: D,
    accumulator: Accumulator<D>
  ): Accumulator<D> {
    let members = desc.members;
    let memberNames = Object.keys(members);
    let mapped = dict<builder.Descriptor>();

    memberNames.forEach((name, _index) => {
      let fieldValue = members[name]!;
      let membersMeta = desc.membersMeta[name];

      let innerAccumulator = new Accumulator(
        membersMeta && membersMeta.features ? membersMeta.features : null,
        fieldValue
      );

      let inner = this.visitValue(innerAccumulator, members[name]!);

      if (
        inner !== undefined &&
        hasFeatures(this.featureList, innerAccumulator.neededFeatures)
      ) {
        mapped[name] = inner;
      }
    });

    return accumulator.set(
      Object.assign({}, desc, {
        members: mapped
      })
    );
  }
}

function accumulate<D extends builder.Descriptor>(
  accumulator: Accumulator<D>,
  desc: D | undefined,
  featureList: string[]
): Accumulator<D> {
  if (hasFeatures(featureList, accumulator.neededFeatures)) {
    return accumulator.set(desc);
  } else {
    return accumulator.set(undefined);
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
