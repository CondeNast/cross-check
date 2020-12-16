import {
  ObjectModel,
  ValidationDescriptor,
  ValidationError,
  validate,
} from "@cross-check/core";
import build, { BUILD, Buildable, ValidationBuilder } from "@cross-check/dsl";
import { Task } from "no-show";
import { builders, dehydrated } from "./descriptors";
import { finalizeMeta } from "./descriptors/builders";
import { visitorDescriptor } from "./descriptors/dehydrated";
import { Registry } from "./registry";
import { Type } from "./type";
import * as visitor from "./types/describe/visitor";
import { JSONObject, mapDict } from "./utils";

export interface RecordState {
  name: string;
}

export interface FormattableRecord {
  name: string;
  members: dehydrated.Dictionary;
  metadata: JSONObject | null;
}

export type RecordDetails = { [key: string]: unknown };

export class RecordBuilder
  implements builders.TypeBuilderMember, FormattableRecord {
  constructor(
    readonly name: string,
    readonly members: dehydrated.Dictionary,
    readonly metadata: JSONObject | null
  ) {}

  get builder(): builders.NamedBuilder {
    return new builders.NamedBuilder({
      target: "Record",
      name: this.name,
    });
  }

  dehydrate(): dehydrated.Record {
    return {
      type: "Named",
      target: "Record",
      name: this.name,
      required: "always",
    };
  }

  descriptor(registry: Registry): visitor.Record {
    return {
      type: "Record",
      name: this.name,
      members: mapDict(this.members.members, (member) => {
        return {
          descriptor: visitorDescriptor(member.descriptor, registry),
          meta: member.meta,
        };
      }),
      metadata: this.metadata,
      required:
        this.members.required === "always" ||
        this.members.required === "published",
    };
  }

  with(params: dehydrated.HydrateParameters): RecordImpl {
    const dictionary = dehydrated.hydrate(
      this.members,
      params.registry,
      params
    );
    return new RecordImpl(dictionary, this.metadata, this.name);
  }

  /**
   * This API allows you to take a `Record` that you already
   * constructed and update it by adding more fields, removing
   * fields, updating the metadata, or changing the name.
   *
   * The new type is not necessarily related to the original
   * type in a type theory way: it may not be possible to
   * upcast the new record into the original, nor downcast
   * the original into this new type.
   *
   * In practical terms, this means that we can't assume that
   * it's possible to write generic logic for rendering an
   * "Article" and have it work with the results of running
   * `Article.merge()`.
   *
   * Instead, this API is a convenience for sharing groups
   * of fields across usages. That's the reason this method
   * is called `merge` (and not `extend`, which would imply
   * a subtyping relationship).
   *
   * To illustrate the limitation described above, consider
   * an `Article` type that has two fields:
   *
   * ```
   * export const Article = Record("Article", {
   *   fields: {
   *     hed: Text().required(),
   *     dek: Text().required()
   *   }
   * });
   * ```
   *
   * When rendering an article, a developer is allowed to
   * assume that both `hed` and `dek` exist, and not code
   * defensively to avoid that possibility.
   *
   * Now, let's say somebody refines `Article` like this:
   *
   * ```
   * export const WiredArticle = Article.merge({
   *   fields: {
   *     byline: Text().required()
   *   },
   *
   *   remove: ['dek']
   * });
   * ```
   *
   * Rendering `WiredArticle` as a generic `Article` will fail
   * because the original rendering function didn't code
   * defensively for this possibility, which is reasonable.
   *
   * In the future, we could add an additional API that allows the
   * kind of generic casting that this use-case desires, but this
   * method is not it.
   */
  merge({
    fields,
    metadata,
    remove,
    name = this.name,
  }: ExtendOptions): RecordBuilder {
    const merged = fields
      ? { ...this.members.members, ...dehydrate(fields) }
      : this.members.members;

    let members: { [key: string]: dehydrated.Member };

    if (remove) {
      members = Object.create(null);
      for (const [key, value] of Object.entries(merged)) {
        if (remove.indexOf(key as string) === -1) {
          members[key] = value;
        }
      }
    } else {
      members = merged;
    }

    const dictionary: dehydrated.Dictionary = {
      type: "Dictionary",
      members,
      required: "always",
    };

    return new RecordBuilder(name, dictionary, metadata || this.metadata);
  }
}

export class RecordImpl implements Type, Buildable, FormattableRecord {
  constructor(
    private dictionary: Type,
    readonly metadata: JSONObject | null,
    readonly name: string
  ) {}

  get members(): dehydrated.Dictionary {
    return this.dehydrate();
  }

  dehydrate(): dehydrated.Dictionary {
    return this.dictionary.dehydrate() as dehydrated.Dictionary;
  }

  validate(
    obj: { [key: string]: unknown },
    objectModel: ObjectModel
  ): Task<ValidationError[]> {
    const validation = this.dictionary.validation();

    return validate(obj, build(validation), null, objectModel);
  }

  validation(): ValidationBuilder<unknown> {
    return this.dictionary.validation();
  }

  parse(value: { [key: string]: unknown }): unknown {
    return this.dictionary.parse(value);
  }

  serialize(value: { [key: string]: unknown }): unknown {
    return this.dictionary.serialize(value);
  }

  [BUILD](): ValidationDescriptor {
    return build(this.dictionary.validation());
  }
}

export interface RecordOptions {
  fields: { [key: string]: builders.TypeBuilder };
  metadata?: JSONObject | null;
}

export interface ExtendOptions {
  name?: string;
  fields?: { [key: string]: builders.TypeBuilder };
  metadata?: JSONObject | null;
  remove?: string[];
}

export function Record(
  name: string,
  { fields, metadata }: RecordOptions
): RecordBuilder {
  const dictionary: dehydrated.Dictionary = {
    type: "Dictionary",
    members: dehydrate(fields),
    required: "always",
  };

  return new RecordBuilder(name, dictionary, metadata || null);
}

function dehydrate(fields: {
  [key: string]: builders.TypeBuilder;
}): { [key: string]: dehydrated.Member } {
  return mapDict(fields, (member) => {
    return {
      descriptor: member.dehydrate("never"),
      meta: finalizeMeta(member.meta),
    };
  });
}

export type Record = RecordBuilder;
