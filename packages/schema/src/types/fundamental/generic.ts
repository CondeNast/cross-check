import { dict, entries } from "ts-std";
import { builder, resolved } from "../../descriptors";
import { DictionaryImpl } from "./index";

export interface DictAttributes {
  required: boolean;
}

export interface MapArgs {
  T: builder.AnyDict;
  C: (desc: builder.Descriptor, required: boolean) => builder.Descriptor;
}

// The name and the fact that it's generic is reflected into the formatters.
export function MapDict(
  name: string,
  T: builder.AnyDict,
  callback: (desc: builder.Descriptor, required: boolean) => builder.Descriptor
): builder.Generic<MapArgs> {
  return builder.Generic(
    name,
    {
      T,
      C: callback
    },
    (desc: builder.Generic<MapArgs>) => {
      let members = dict<resolved.Descriptor>();

      for (let [key, value] of entries(desc.args.T.members)) {
        let meta = desc.args.T.membersMeta[key];
        members[key] = builder.resolve(
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
export function mapDict<D extends builder.AnyDict>(
  T: D,
  callback: (
    member: builder.Descriptor,
    meta: builder.MembersMeta
  ) => [builder.Descriptor, builder.MembersMeta]
): D {
  let mappedMembers = dict<builder.Descriptor>();
  let mappedMetas = dict<builder.MembersMeta>();

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

export function mapContainer<C extends builder.Container>(
  container: C,
  callback: (T: builder.Descriptor) => builder.Descriptor
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
