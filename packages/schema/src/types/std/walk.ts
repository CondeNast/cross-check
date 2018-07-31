import { Option, dict } from "ts-std";
import { unresolved } from "../../descriptors";

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

class ValueAccumulator<D extends unresolved.Descriptor> {
  constructor(
    readonly neededFeatures: Option<string[]>,
    readonly descriptor: D | null | undefined
  ) {}

  set(descriptor: D | undefined): ValueAccumulator<D> {
    return new ValueAccumulator(this.neededFeatures, descriptor);
  }

  finish(): D | undefined {
    if (this.descriptor === null) {
      throw new Error("must call set() before finish()");
    }

    return this.descriptor;
  }
}

class FeaturesVisitor {
  constructor(readonly featureList: string[]) {}

  Alias(
    desc: unresolved.Alias,
    accumulator: ValueAccumulator<unresolved.Alias>
  ): ValueAccumulator<unresolved.Alias> {
    let innerAccumulator = new ValueAccumulator(
      accumulator.neededFeatures,
      desc.inner
    );

    let inner = this.visitDescriptor(desc.inner, innerAccumulator);

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
    desc: unresolved.List,
    accumulator: ValueAccumulator<unresolved.List>
  ): ValueAccumulator<unresolved.List> {
    return this.visitValue(accumulator, desc.inner, mapped => ({
      ...desc,
      inner: mapped
    }));
  }

  Iterator(
    desc: unresolved.Iterator,
    accumulator: ValueAccumulator<unresolved.Iterator>
  ): ValueAccumulator<unresolved.Iterator> {
    return this.visitValue(accumulator, desc.inner, mapped => ({
      ...desc,
      inner: mapped
    }));
  }

  Pointer(
    desc: unresolved.Pointer,
    accumulator: ValueAccumulator<unresolved.Pointer>
  ): ValueAccumulator<unresolved.Pointer> {
    return this.visitValue(accumulator, desc.inner, mapped => ({
      ...desc,
      inner: mapped
    }));
  }

  Record(
    desc: unresolved.Record,
    accumulator: ValueAccumulator<unresolved.Record>
  ): ValueAccumulator<unresolved.Record> {
    return this.visitDictionary(desc, accumulator);
  }

  Dictionary(
    desc: unresolved.Dictionary,
    accumulator: ValueAccumulator<unresolved.Dictionary>
  ): ValueAccumulator<unresolved.Dictionary> {
    return this.visitDictionary(desc, accumulator);
  }

  Primitive(
    desc: unresolved.Primitive,
    accumulator: ValueAccumulator<unresolved.Primitive>
  ): ValueAccumulator<unresolved.Primitive> {
    if (
      accumulator.neededFeatures &&
      !hasFeatures(this.featureList, accumulator.neededFeatures)
    ) {
      return accumulator.set(undefined);
    } else {
      return accumulator.set(desc);
    }
  }

  visit<D extends unresolved.Descriptor>(
    desc: D,
    featureList: string[]
  ): D | undefined {
    let input = new ValueAccumulator(featureList, desc);
    return this.visitDescriptor(desc, input);
  }

  private visitValue<D extends unresolved.Descriptor>(
    accumulator: ValueAccumulator<D>,
    innerDesc: unresolved.Descriptor,
    update: (mappedInner: unresolved.Descriptor) => D
  ): ValueAccumulator<D> {
    let innerAccumulator = new ValueAccumulator(
      accumulator.neededFeatures,
      innerDesc
    );

    let inner = this.visitDescriptor(innerDesc, innerAccumulator);

    if (
      inner === undefined ||
      !hasFeatures(this.featureList, accumulator.neededFeatures)
    ) {
      return accumulator.set(undefined);
    } else {
      return accumulator.set(update(inner));
    }
  }

  private visitDescriptor<D extends unresolved.Descriptor>(
    desc: D,
    accumulator: ValueAccumulator<D>
  ): D | undefined {
    // @ts-ignore
    accumulator = this[desc.type](desc, accumulator);

    return accumulator.finish();
  }

  private visitDictionary<D extends unresolved.Dictionary | unresolved.Record>(
    desc: D,
    accumulator: ValueAccumulator<D>
  ): ValueAccumulator<D> {
    let members = desc.members;
    let memberNames = Object.keys(members);
    let mapped = dict<unresolved.Descriptor>();

    memberNames.forEach((name, _index) => {
      let fieldValue = members[name]!;
      let membersMeta = desc.membersMeta[name];

      let innerAccumulator = new ValueAccumulator(
        membersMeta && membersMeta.features ? membersMeta.features : null,
        fieldValue
      );

      let inner = this.visitDescriptor(members[name]!, innerAccumulator);

      if (inner !== undefined) {
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

function hasFeatures(
  featureList: string[],
  neededFeatures: Option<string[]>
): boolean {
  if (neededFeatures === null) return true;
  return neededFeatures.every(f => featureList.indexOf(f) !== -1);
}

export function applyFeatures(
  desc: unresolved.Record,
  featureList: string[]
): unresolved.Record {
  return new FeaturesVisitor(featureList).visit(desc, featureList)!;
}
