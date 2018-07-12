import {
  CollectionDescriptor,
  DictionaryDescriptor,
  NamedDescriptor,
  PrimitiveDescriptor,
  RecordDescriptor,
  TypeDescriptor
} from "../fundamental/descriptor";
import { Buffer as StringBuffer } from "./buffer";

export interface Reporters<Buffer, Inner, Options> {
  Value: ReporterStateConstructor<Buffer, Inner, Options>;
  Structure: ReporterStateConstructor<Buffer, Inner, Options>;
  List: ReporterStateConstructor<Buffer, Inner, Options>;
}

export interface State<Buffer> {
  buffer: Buffer;
  nesting: number;
}

export interface ReporterDelegate<Buffer, Inner, Options> {
  openRecord(options: {
    buffer: Buffer;
    descriptor: RecordDescriptor;
    options: Options;
    nesting: number;
  }): Inner | void;
  closeRecord(options: {
    buffer: Buffer;
    descriptor: RecordDescriptor;
    options: Options;
    nesting: number;
  }): Inner | void;
  emitKey(options: {
    buffer: Buffer;
    key: string;
    position: Position;
    required: boolean;
    options: Options;
    nesting: number;
  }): Inner | void;
  closeValue(options: {
    buffer: Buffer;
    descriptor: TypeDescriptor;
    position: Position;
    options: Options;
    nesting: number;
  }): Inner | void;
  openDictionary(options: {
    buffer: Buffer;
    descriptor: DictionaryDescriptor;
    position: Position;
    options: Options;
    nesting: number;
  }): Inner | void;
  closeDictionary(options: {
    buffer: Buffer;
    descriptor: DictionaryDescriptor;
    position: Position;
    options: Options;
    nesting: number;
  }): Inner | void;
  openGeneric(options: {
    buffer: Buffer;
    descriptor: CollectionDescriptor;
    position: Position;
    options: Options;
    nesting: number;
  }): Inner | void;
  closeGeneric(options: {
    buffer: Buffer;
    descriptor: CollectionDescriptor;
    position: Position;
    options: Options;
    nesting: number;
  }): Inner | void;
  emitPrimitive(options: {
    buffer: Buffer;
    descriptor: PrimitiveDescriptor;
    position: Position;
    options: Options;
    nesting: number;
  }): Inner | void;
  emitNamedType(options: {
    buffer: Buffer;
    descriptor: NamedDescriptor;
    position: Position;
    options: Options;
    nesting: number;
  }): Inner | void;
}

export interface Accumulator<Inner> {
  done(): Inner;
}

export class Reporter<Buffer extends Accumulator<Inner>, Inner, Options> {
  private state: { buffer: Buffer; nesting: number; options: Options };

  constructor(
    private reporters: ReporterDelegate<Buffer, Inner, Options>,
    options: Options,
    buffer: Buffer
  ) {
    this.state = { buffer, nesting: 0, options };
  }

  finish(): Inner {
    return this.state.buffer.done();
  }

  pushStrings(value: Inner | void) {
    let { buffer } = this.state;

    if (buffer instanceof StringBuffer && typeof value === "string") {
      buffer.push(value);
    }
  }

  startDictionary(position: Position, descriptor: DictionaryDescriptor): void {
    this.state.nesting += 1;

    this.pushStrings(
      this.reporters.openDictionary({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  endDictionary(position: Position, descriptor: DictionaryDescriptor): void {
    this.state.nesting -= 1;

    this.pushStrings(
      this.reporters.closeDictionary({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  startRecord(descriptor: RecordDescriptor): void {
    this.state.nesting += 1;

    this.pushStrings(
      this.reporters.openRecord({
        descriptor,
        ...this.state
      })
    );
  }

  endRecord(descriptor: RecordDescriptor): void {
    this.pushStrings(
      this.reporters.closeRecord({
        descriptor,
        ...this.state
      })
    );
  }

  addKey(key: string, position: Position, { required }: TypeDescriptor): void {
    this.pushStrings(
      this.reporters.emitKey({
        key,
        position,
        required,
        ...this.state
      })
    );
  }

  endValue(position: Position, descriptor: TypeDescriptor): void {
    this.pushStrings(
      this.reporters.closeValue({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  endGenericValue(position: Position, descriptor: CollectionDescriptor): void {
    this.pushStrings(
      this.reporters.closeGeneric({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  startGenericValue(
    position: Position,
    descriptor: CollectionDescriptor
  ): void {
    this.pushStrings(
      this.reporters.openGeneric({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  primitiveValue(position: Position, descriptor: PrimitiveDescriptor): void {
    this.pushStrings(
      this.reporters.emitPrimitive({
        descriptor,
        position,
        ...this.state
      })
    );
  }

  namedValue(position: Position, descriptor: NamedDescriptor): void {
    this.pushStrings(
      this.reporters.emitNamedType({
        descriptor,
        position,
        ...this.state
      })
    );
  }
}

export interface ReporterStateConstructor<Buffer, Inner, Options> {
  new (
    state: { buffer: Buffer; nesting: number; options: Options },
    reporters: ReporterDelegate<Buffer, Inner, Options>
  ): ReporterState<Buffer, Inner, Options>;
}

export enum Position {
  First,
  Last,
  Middle,
  Only,
  ListItem,
  PointerItem,
  IteratorItem,
  Any
}

export function genericPosition(name: CollectionDescriptor["type"]): Position {
  switch (name) {
    case "Iterator":
      return Position.IteratorItem;
    case "Pointer":
      return Position.PointerItem;
    case "List":
      return Position.ListItem;
  }
}

export type DictPosition = Position.First | Position.Middle | Position.Last;

export function isDictPosition(position: Position): position is DictPosition {
  return (
    position === Position.First ||
    position === Position.Middle ||
    position === Position.Last
  );
}

export interface InnerState<Buffer, Options> {
  buffer: Buffer;
  nesting: number;
  options: Options;
}

export abstract class ReporterState<Buffer, Inner, Options> {
  constructor(
    protected state: InnerState<Buffer, Options>,
    protected reporters: ReporterDelegate<Buffer, Inner, Options>
  ) {}

  pushStrings(value: Inner | void) {
    let { buffer } = this.state;

    if (buffer instanceof StringBuffer && typeof value === "string") {
      buffer.push(value);
    }
  }

  debug(operation: string): void {
    // tslint:disable:no-console

    // @ts-ignore
    console.group(`${operation}`);

    // @ts-ignore
    console.log(`<- nesting: ${this.state.nesting}`);

    let buffer = this.state.buffer as { done?(): string };

    if (typeof buffer.done === "function") {
      // @ts-ignore
      console.log(buffer.done().replace(/\n/g, "\\n\n"));
    } else {
      // @ts-ignore
      console.log(JSON.stringify(this.state.buffer).replace(/\n/g, "\\n\n"));
    }

    // @ts-ignore
    console.groupEnd();

    // tslint:enable:no-console
  }

  debugEnd() {
    // tslint:disable:no-console
    // @ts-ignore
    console.groupEnd();
    // tslint:enable:no-console
  }

  enter(): void {
    /* noop */
  }

  exit(): void {
    /* noop */
  }

  startDictionary?(
    position: Position,
    descriptor: DictionaryDescriptor
  ): true | void;

  startRecord?(position: Position, descriptor: RecordDescriptor): true | void;

  addKey?(key: string, position: Position, required: boolean): true | void;

  endValue?(position: Position, descriptor: TypeDescriptor): true | void;

  endDictionary?(
    position: Position,
    descriptor: DictionaryDescriptor
  ): true | void;

  endDictionaryBody?(
    position: Position,
    descriptor: DictionaryDescriptor
  ): true | void;

  endRecord?(position: Position, descriptor: RecordDescriptor): true | void;

  startGenericValue?(
    position: Position,
    descriptor: CollectionDescriptor
  ): true | void;

  endGenericValue?(
    position: Position,
    descriptor: CollectionDescriptor
  ): true | void;

  primitiveValue?(position: Position, descriptor: PrimitiveDescriptor): void;
  namedValue?(position: Position, descriptor: TypeDescriptor): void;

  startType?(position: Position, descriptor: TypeDescriptor): void;
  endType?(position: Position, descriptor: TypeDescriptor): true | void;
}
