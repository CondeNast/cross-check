import { Dict, dict, entries } from "ts-std";
import { registered } from "../../descriptors";

export interface DictAttributes {
  required: boolean;
}

export interface MapArgs {
  T: registered.Dictionary | registered.Record;
  C: (desc: registered.RegisteredType, required: boolean) => registered.RegisteredType;
}

// Transparently map a dictionary into another
export function mapDictionary<D extends registered.Dictionary | registered.Record>(
  T: D,
  callback: (
    member: registered.RegisteredType,
    meta: registered.MembersMeta
  ) => registered.MembersMeta
): D {
  let mappedMembers = dict<registered.MembersMeta>();

  let members: Dict<registered.RegisteredType>;

  if (T instanceof registered.Record) {
    members = T.state.inner.state.members;
  } else if (T instanceof registered.Dictionary) {
    members = T.state.members;
  } else {
    throw new Error("unreachable");
  }

  for (let [key, member] of entries(members)) {
    let mappedMember = callback(member!, registered.finalizeMeta(member!));

    mappedMembers[key] = mappedMember;
  }

  return Object.assign({}, T, {
    members: mappedMembers
  });
}
