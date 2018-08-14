import { Dict } from "ts-std";
import { exhausted } from "../../utils";
import { Buffer as StringBuffer } from "./buffer";
import * as visitor from "./visitor";

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
  openAlias(
    options: ReporterEvent<Buffer, Options> & { descriptor: visitor.Alias }
  ): Inner | void;
  closeAlias(
    options: ReporterEvent<Buffer, Options> & { descriptor: visitor.Alias }
  ): Inner | void;
  openRecord(
    options: ReporterEvent<Buffer, Options> & {
      descriptor: visitor.Record;
    }
  ): Inner | void;
  closeRecord(
    options: ReporterEvent<Buffer, Options> & {
      descriptor: visitor.Record;
    }
  ): Inner | void;
  emitKey(
    options: Event<Buffer, Options> & {
      key: string;
      descriptor: visitor.Descriptor;
    }
  ): Inner | void;
  closeValue(
    options: ReporterEvent<Buffer, Options> & {
      descriptor: visitor.Descriptor;
    }
  ): Inner | void;
  openDictionary(
    options: ReporterEvent<Buffer, Options> & {
      descriptor: visitor.Dictionary;
    }
  ): Inner | void;
  closeDictionary(
    options: ReporterEvent<Buffer, Options> & {
      descriptor: visitor.Dictionary;
    }
  ): Inner | void;
  openGeneric(
    options: ReporterEvent<Buffer, Options> & {
      descriptor: visitor.Container;
    }
  ): Inner | void;
  closeGeneric(
    options: ReporterEvent<Buffer, Options> & {
      descriptor: visitor.Container;
    }
  ): Inner | void;
  emitPrimitive(
    options: ReporterEvent<Buffer, Options> & {
      descriptor: visitor.Primitive;
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

  startAlias(position: Pos, descriptor: visitor.Alias) {
    this.pushStrings(
      this.reporters.openAlias({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  endAlias(position: Pos, descriptor: visitor.Alias) {
    this.pushStrings(
      this.reporters.closeAlias({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  startDictionary(position: Pos, descriptor: visitor.Dictionary): void {
    this.state.nesting += 1;

    this.pushStrings(
      this.reporters.openDictionary({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  endDictionary(position: Pos, descriptor: visitor.Dictionary): void {
    this.state.nesting -= 1;

    this.pushStrings(
      this.reporters.closeDictionary({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  startRecord(position: Pos, descriptor: visitor.Record): void {
    this.state.nesting += 1;

    this.pushStrings(
      this.reporters.openRecord({
        descriptor,
        position,
        ...this.state
      })
    );
  }

  endRecord(position: Pos, descriptor: visitor.Record): void {
    this.pushStrings(
      this.reporters.closeRecord({
        descriptor,
        position,
        ...this.state
      })
    );
  }

  addKey(position: Pos, key: string, descriptor: visitor.Descriptor): void {
    this.pushStrings(
      this.reporters.emitKey({
        key,
        descriptor,
        position,
        ...this.state
      })
    );
  }

  endValue(position: Pos, descriptor: visitor.Descriptor): void {
    this.pushStrings(
      this.reporters.closeValue({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  startGenericValue(position: Pos, descriptor: visitor.Container): void {
    this.pushStrings(
      this.reporters.openGeneric({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  endGenericValue(position: Pos, descriptor: visitor.Container): void {
    this.pushStrings(
      this.reporters.closeGeneric({
        position,
        descriptor,
        ...this.state
      })
    );
  }

  primitiveValue(position: Pos, descriptor: visitor.Primitive): void {
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
  Unknown = 0b00000000,
  First = 0b00000001,
  Last = 0b00000010,
  Only = Pos.First | Pos.Last,
  InDictionary = 0b00000100,
  InList = 0b00001000 | Pos.Only,
  InPointer = 0b00010000 | Pos.Only,
  InIterator = 0b00100000 | Pos.Only,
  ExplicitRequired = 0b01000000,
  PositionRequired = 0b10000000,
  IsRequired = Pos.ExplicitRequired | Pos.PositionRequired
}

export function formatPosition(position: Pos): Dict<boolean> {
  return {
    first: isFirst(position),
    last: isLast(position),
    inDictionary: inDictionary(position),
    inList: inList(position),
    inPointer: inPointer(position),
    inIterator: inIterator(position),
    explicitRequired: isExplicitRequiredPosition(position),
    implicitRequired: isRequiredPosition(position)
  };
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

export function inGeneric(position: Pos): boolean {
  return !!(position & (Pos.InIterator | Pos.InList | Pos.InPointer));
}

export function isRequiredPosition(position: Pos): boolean {
  return !!(position & Pos.IsRequired);
}

export function isExplicitRequiredPosition(position: Pos): boolean {
  return (position & Pos.ExplicitRequired) === Pos.ExplicitRequired;
}

export function requiredPosition(position: Pos, isRequiredType: boolean): Pos {
  if (isRequiredType) {
    return position | Pos.ExplicitRequired;
  } else {
    return position & ~Pos.ExplicitRequired;
  }
}

export function genericPosition(
  type: visitor.Container["type"],
  desc: visitor.Descriptor
): Pos {
  let req = desc.required ? Pos.PositionRequired : 0;

  switch (type) {
    case "List":
      return Pos.InList | req;
    case "Pointer":
      return Pos.InPointer | req;
    case "Iterator":
      return Pos.InIterator | req;

    default:
      return exhausted(type);
  }
}

export function DictionaryPosition({
  index,
  last,
  descriptor
}: {
  index: number;
  last: number;
  descriptor: visitor.Descriptor;
}) {
  let pos = Pos.InDictionary;

  if (index === 0) {
    pos |= Pos.First;
  }

  if (index === last) {
    pos |= Pos.Last;
  }

  if (descriptor.required) {
    pos |= Pos.ExplicitRequired;
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

  startDictionary?(position: Pos, descriptor: visitor.Dictionary): true | void;

  startRecord?(position: Pos, descriptor: visitor.Record): true | void;

  addKey?(
    position: Pos,
    key: string,
    descriptor: visitor.Descriptor
  ): true | void;

  endValue?(position: Pos, descriptor: visitor.Descriptor): true | void;

  endDictionary?(position: Pos, descriptor: visitor.Dictionary): true | void;

  endDictionaryBody?(
    position: Pos,
    descriptor: visitor.Dictionary
  ): true | void;

  endRecord?(position: Pos, descriptor: visitor.Record): true | void;

  startGenericValue?(position: Pos, descriptor: visitor.Container): true | void;

  endGenericValue?(position: Pos, descriptor: visitor.Container): true | void;

  primitiveValue?(position: Pos, descriptor: visitor.Primitive): void;
  namedValue?(position: Pos, descriptor: visitor.Descriptor): void;

  startType?(position: Pos, descriptor: visitor.Descriptor): void;
  endType?(position: Pos, descriptor: visitor.Descriptor): true | void;
}
