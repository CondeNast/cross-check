import { RegisteredRecord } from "../../record";
import { REGISTRY, Registry } from "../../registry";
import { Accumulator, Pos, Reporter, ReporterDelegate } from "./reporter";
import { StringVisitor } from "./visitor";

export type Formatter<Options = void, Result = string> = Options extends void
  ? (record: RegisteredRecord) => Result
  : (record: RegisteredRecord, options: Options) => Result;

export default function formatter<Buffer extends Accumulator<string>, Options>(
  delegate: ReporterDelegate<Buffer, string, Options>,
  BufferClass: { new (): Buffer },
  registry: Registry = REGISTRY
): Formatter<Options, string> {
  return ((type: RegisteredRecord, options?: Options): string => {
    let reporter = new Reporter<Buffer, string, typeof options>(
      delegate,
      options,
      new BufferClass()
    );
    let visitor = StringVisitor.build<Buffer, string, typeof options>(reporter);

    return visitor.record(type.inner.visitor(registry), Pos.Only);
  }) as Formatter<Options, string>;
}
