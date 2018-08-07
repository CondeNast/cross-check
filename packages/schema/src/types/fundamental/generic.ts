import { dict, entries } from "ts-std";
import { builder, resolved } from "../../descriptors";
import { mapDict } from "../../utils";
import { ResolvedDictionary } from "./dictionary";

export interface DictAttributes {
  required: boolean;
}

export interface MapArgs {
  T: builder.Dictionary | builder.Record;
  C: (desc: builder.Descriptor, required: boolean) => builder.Descriptor;
}

// The name and the fact that it's generic is reflected into the formatters.
export function MapDict(
  name: string,
  T: builder.Dictionary | builder.Record,
  callback: (desc: builder.Descriptor, required: boolean) => builder.Descriptor
): builder.Generic<MapArgs> {
  return GenericBuilderDescriptor(
    name,
    {
      T,
      C: callback
    },
    (desc: builder.Generic<MapArgs>) => {
      let members = mapDict(desc.args.T.members, member => {
        return builder.resolve(
          desc.args.C(member.descriptor, member.meta.required),
          member.meta.required
        );
      });

      return ResolvedDictionary(members);
    }
  );
}

export function GenericBuilderDescriptor<G>(
  name: string,
  args: G,
  apply: (desc: builder.Generic<G>) => resolved.Descriptor
): builder.Generic<G> {
  return {
    type: "Generic",
    name,
    args
  };
}

// Transparently map a dictionary into another
export function mapDictionary<D extends builder.Dictionary | builder.Record>(
  T: D,
  callback: (
    member: builder.Descriptor,
    meta: builder.MembersMeta
  ) => builder.Member
): D {
  let mappedMembers = dict<builder.Member>();

  for (let [key, member] of entries(T.members)) {
    let mappedMember = callback(member!.descriptor, member!.meta);

    mappedMembers[key] = mappedMember;
  }

  return Object.assign({}, T, {
    members: mappedMembers
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
