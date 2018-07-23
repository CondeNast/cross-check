import {
  AliasDescriptor,
  CollectionDescriptor,
  DictionaryDescriptor,
  PrimitiveDescriptor,
  RecordDescriptor,
  RequiredDescriptor,
  TypeDescriptor
} from "../../descriptors";
import { exhausted } from "../../utils";
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
  openRequired(
    options: ReporterEvent<Buffer, Options> & {
      descriptor: RequiredDescriptor;
    }
  ): Inner | void;
  closeRequired(
    options: ReporterEvent<Buffer, Options> & { descriptor: RequiredDescriptor }
  ): Inner | void;
  openAlias(
    options: ReporterEvent<Buffer, Options> & { descriptor: AliasDescriptor }
  ): Inner | void;
  closeAlias(
    options: ReporterEvent<Buffer, Options> & { descriptor: AliasDescriptor }
  ): Inner | void;
  openRecord(
    options: ReporterEvent<Buffer, Options> & { descriptor: RecordDescriptor }
  ): Inner | void;
  closeRecord(
    options: ReporterEvent<Buffer, Options> & {
      descriptor: RecordDescriptor;
    }
  ): Inner | void;
  emitKey(
    options: Event<Buffer, Options> & {
      key: string;
      descriptor: TypeDescriptor;
    }
  ): Inner | void;
  closeValue(
    options: ReporterEvent<Buffer, Options> & {
      descriptor: TypeDescriptor;
    }
  ): Inner | void;
  openDictionary(
    options: ReporterEvent<Buffer, Options> & {
      descriptor: DictionaryDescriptor;
    }
  ): Inner | void;
  closeDictionary(
    options: ReporterEvent<Buffer, Options> & {
      descriptor: DictionaryDescriptor;
    }
  ): Inner | void;
  openGeneric(
    options: ReporterEvent<Buffer, Options> & {
      descriptor: CollectionDescriptor;
    }
  ): Inner | void;
  closeGeneric(
    options: ReporterEvent<Buffer, Options> & {
      descriptor: CollectionDescriptor;
    }
  ): Inner | void;
  emitPrimitive(
    options: ReporterEvent<Buffer, Options> & {
      descriptor: PrimitiveDescriptor;
    }
  ): Inner | void;
}

export interface Accumulator<Inner> {
  done(): Inner;
}

export interface Event<Buffer, Options> {
  buffer: Buffer;
  nesting: number;
  options: Options;
  position: Pos;
}

export type ReporterEvent<Buffer, Options> = Event<Buffer, Options>;

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

  startAlias(position: Pos, descriptor: AliasDescriptor) {
    this.pushStrings(
      this.reporters.openAlias({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  endAlias(position: Pos, descriptor: AliasDescriptor) {
    this.pushStrings(
      this.reporters.closeAlias({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  startRequired(position: Pos, descriptor: RequiredDescriptor): void {
    this.pushStrings(
      this.reporters.openRequired({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  endRequired(position: Pos, descriptor: RequiredDescriptor): void {
    this.pushStrings(
      this.reporters.closeRequired({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  startDictionary(position: Pos, descriptor: DictionaryDescriptor): void {
    this.state.nesting += 1;

    this.pushStrings(
      this.reporters.openDictionary({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  endDictionary(position: Pos, descriptor: DictionaryDescriptor): void {
    this.state.nesting -= 1;

    this.pushStrings(
      this.reporters.closeDictionary({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  startRecord(position: Pos, descriptor: RecordDescriptor): void {
    this.state.nesting += 1;

    this.pushStrings(
      this.reporters.openRecord({
        descriptor,
        position,
        ...this.state
      })
    );
  }

  endRecord(position: Pos, descriptor: RecordDescriptor): void {
    this.pushStrings(
      this.reporters.closeRecord({
        descriptor,
        position,
        ...this.state
      })
    );
  }

  addKey(position: Pos, key: string, descriptor: TypeDescriptor): void {
    this.pushStrings(
      this.reporters.emitKey({
        key,
        descriptor,
        position,
        ...this.state
      })
    );
  }

  endValue(position: Pos, descriptor: TypeDescriptor): void {
    this.pushStrings(
      this.reporters.closeValue({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  startGenericValue(position: Pos, descriptor: CollectionDescriptor): void {
    this.pushStrings(
      this.reporters.openGeneric({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  endGenericValue(position: Pos, descriptor: CollectionDescriptor): void {
    this.pushStrings(
      this.reporters.closeGeneric({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  primitiveValue(position: Pos, descriptor: PrimitiveDescriptor): void {
    this.pushStrings(
      this.reporters.emitPrimitive({
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

// prettier-ignore
export enum Pos {
  First        = 0b0000001,
  Last         = 0b0000010,
  Only         = Pos.First | Pos.Last,
  InDictionary = 0b0000100,
  InList       = 0b0001000 | Pos.Only,
  InPointer    = 0b0010000 | Pos.Only,
  InIterator   = 0b0100000 | Pos.Only
}

export function isFirst(position: Pos): boolean {
  return (position & Pos.First) === Pos.First;
}

export function isLast(position: Pos): boolean {
  return (position & Pos.Last) === Pos.Last;
}

export function isOnly(position: Pos): boolean {
  return (position & Pos.Only) === Pos.Only;
}

export function inDictionary(position: Pos): boolean {
  return (position & Pos.InDictionary) === Pos.InDictionary;
}

export function inList(position: Pos): boolean {
  return (position & Pos.InList) === Pos.InList;
}

export function inPointer(position: Pos): boolean {
  return (position & Pos.InPointer) === Pos.InPointer;
}

export function inIterator(position: Pos): boolean {
  return (position & Pos.InIterator) === Pos.InIterator;
}

export function genericPosition(type: CollectionDescriptor["type"]): Pos {
  switch (type) {
    case "List":
      return Pos.InList;
    case "Pointer":
      return Pos.InPointer;
    case "Iterator":
      return Pos.InIterator;

    default:
      return exhausted(type);
  }
}

export function DictionaryPosition({
  index,
  last
}: {
  index: number;
  last: number;
}) {
  let pos = Pos.InDictionary;

  if (index === 0) {
    pos |= Pos.First;
  }

  if (index === last) {
    pos |= Pos.Last;
  }

  return pos;
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
    position: Pos,
    descriptor: DictionaryDescriptor
  ): true | void;

  startRecord?(position: Pos, descriptor: RecordDescriptor): true | void;

  addKey?(position: Pos, key: string, descriptor: TypeDescriptor): true | void;

  endValue?(position: Pos, descriptor: TypeDescriptor): true | void;

  endDictionary?(position: Pos, descriptor: DictionaryDescriptor): true | void;

  endDictionaryBody?(
    position: Pos,
    descriptor: DictionaryDescriptor
  ): true | void;

  endRecord?(position: Pos, descriptor: RecordDescriptor): true | void;

  startGenericValue?(
    position: Pos,
    descriptor: CollectionDescriptor
  ): true | void;

  endGenericValue?(
    position: Pos,
    descriptor: CollectionDescriptor
  ): true | void;

  primitiveValue?(position: Pos, descriptor: PrimitiveDescriptor): void;
  namedValue?(position: Pos, descriptor: TypeDescriptor): void;

  startType?(position: Pos, descriptor: TypeDescriptor): void;
  endType?(position: Pos, descriptor: TypeDescriptor): true | void;
}
