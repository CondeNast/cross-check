import {
  ObjectModel,
  Task,
  ValidationError,
  validate,
} from "@condenast/cross-check";
import build from "@condenast/cross-check-dsl";
import { dehydrated } from "./descriptors";
import { RecordImpl } from "./record";
import { Registry } from "./registry";
import {
  GraphqlOptions,
  JSONRecord,
  TypescriptOptions,
  describe,
  graphql,
  listTypes,
  schemaFormat,
  toJSON,
  typescript,
} from "./types";

export class Environment<M extends ObjectModel = ObjectModel> {
  constructor(
    readonly registry: Registry,
    readonly params: dehydrated.HydrateParameters,
    readonly objectModel: M
  ) {}

  validate(
    name: string,
    obj: { [key: string]: unknown }
  ): Task<ValidationError[]> {
    const { dictionary } = this.registry.getRecord(name, this.params);

    return validate(
      obj,
      build(dictionary.validation()),
      null,
      this.objectModel
    );
  }

  hydrate(name: string): RecordImpl {
    return this.registry.getRecordImpl(name, this.params);
  }

  listTypes(name: string): string[] {
    return listTypes(this.hydrate(name), this.registry);
  }

  get formatters(): Formatters {
    return new Formatters(this.registry, this.params);
  }

  get validation(): (
    name: string,
    value: { [key: string]: unknown }
  ) => Task<ValidationError[]> {
    return (name: string, value: { [key: string]: unknown }) => {
      const impl = this.hydrate(name);
      return impl.validate(value, this.objectModel);
    };
  }

  validator(
    name: string
  ): (value: { [key: string]: unknown }) => Task<ValidationError[]> {
    return (value: { [key: string]: unknown }) => {
      const impl = this.hydrate(name);
      return impl.validate(value, this.objectModel);
    };
  }

  format(name: string): RecordFormatters {
    return new RecordFormatters(this.registry, this.params, name);
  }
}

export function env(registry: Registry, objectModel: ObjectModel) {
  return (params: dehydrated.HydrateParameters): Environment =>
    new Environment(registry, params, objectModel);
}

export class Formatters {
  constructor(
    private registry: Registry,
    private params: dehydrated.HydrateParameters
  ) {}

  describe(name: string): string {
    return describe(
      this.registry,
      this.registry.getRecordImpl(name, this.params)
    );
  }

  schemaFormat(name: string): string {
    return schemaFormat(
      this.registry,
      this.registry.getRecordImpl(name, this.params)
    );
  }

  typescript(name: string, options: TypescriptOptions): string {
    return typescript(
      this.registry,
      this.registry.getRecordImpl(name, this.params),
      options
    );
  }

  graphql(name: string, options: GraphqlOptions): string {
    return graphql(
      this.registry,
      this.registry.getRecordImpl(name, this.params),
      options
    );
  }

  toJSON(name: string): JSONRecord {
    return toJSON(
      this.registry.getRecordImpl(name, this.params),
      this.registry
    );
  }
}

export class RecordFormatters {
  private inner: Formatters;

  constructor(
    registry: Registry,
    params: dehydrated.HydrateParameters,
    private name: string
  ) {
    this.inner = new Formatters(registry, params);
  }

  describe(): string {
    return this.inner.describe(this.name);
  }

  schemaFormat(): string {
    return this.inner.schemaFormat(this.name);
  }

  typescript(options: TypescriptOptions): string {
    return this.inner.typescript(this.name, options);
  }

  graphql(options: GraphqlOptions): string {
    return this.inner.graphql(this.name, options);
  }

  toJSON(name: string): JSONRecord {
    return this.inner.toJSON(name);
  }
}
