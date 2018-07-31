import { dict, entries } from "ts-std";
import { resolved, unresolved } from "../../descriptors";
import { MembersMeta } from "../../descriptors/unresolved";
import { DictionaryImpl } from "./index";

export interface DictAttributes {
  required: boolean;
}

export interface MapArgs {
  T: unresolved.AnyDict;
  C: (desc: unresolved.Descriptor, required: boolean) => unresolved.Descriptor;
}

// The name and the fact that it's generic is reflected into the formatters.
export function MapDict(
  name: string,
  T: unresolved.AnyDict,
  callback: (
    desc: unresolved.Descriptor,
    required: boolean
  ) => unresolved.Descriptor
): unresolved.Generic<MapArgs> {
  return unresolved.Generic(
    name,
    {
      T,
      C: callback
    },
    (desc: unresolved.Generic<MapArgs>) => {
      let members = dict<resolved.Descriptor>();

      for (let [key, value] of entries(desc.args.T.members)) {
        let meta = desc.args.T.membersMeta[key];
        members[key] = unresolved.resolve(
          desc.args.C(value!, meta!.required),
          meta!.required
        );
      }

      return resolved.Dictionary(
        members,
        DictionaryImpl
      ) as resolved.Descriptor;
    }
  );
}

// Transparently map a dictionary into another
export function mapDict<D extends unresolved.AnyDict>(
  T: D,
  callback: (
    member: unresolved.Descriptor,
    meta: MembersMeta
  ) => [unresolved.Descriptor, MembersMeta]
): D {
  let mappedMembers = dict<unresolved.Descriptor>();
  let mappedMetas = dict<unresolved.MembersMeta>();

  for (let [key, member] of entries(T.members)) {
    let meta = T.membersMeta[key];

    let [mappedMember, mappedMeta] = callback(member!, meta!);

    mappedMembers[key] = mappedMember;
    mappedMetas[key] = mappedMeta;
  }

  return Object.assign({}, T, {
    members: mappedMembers,
    membersMeta: mappedMetas
  });
}

export function mapContainer<C extends unresolved.Container>(
  container: C,
  callback: (T: unresolved.Descriptor) => unresolved.Descriptor
): C {
  return Object.assign({}, container, {
    inner: callback(container.inner)
  });
}

// export function MapList(
//   T: unresolved.List,
//   map: (desc: unresolved.Descriptor) => unresolved.Descriptor
// ) {
//   return unresolved.Generic({ T }, desc => {
//     let inner = desc.args.T;
//     let mapped = map(inner);
//     return resolved.List(unresolved.resolve(mapped, desc.args.));
//   });
// }

// export function MapPrimitive() {}
