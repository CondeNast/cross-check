import { RecordBuilder } from "../../record";
import { REGISTRY, Registry } from "../../registry";
import { Accumulator, Pos, Reporter, ReporterDelegate } from "./reporter";
import { StringVisitor } from "./visitor";

export type Formatter<Options = void, Result = string> = Options extends void
  ? (record: RecordBuilder) => Result
  : (record: RecordBuilder, options: Options) => Result;

export default function formatter<Buffer extends Accumulator<string>, Options>(
  delegate: ReporterDelegate<Buffer, string, Options>,
  BufferClass: { new (): Buffer },
  _registry: Registry = REGISTRY
): Formatter<Options, string> {
  return ((type: RecordBuilder, options?: Options): string => {
    let reporter = new Reporter<Buffer, string, typeof options>(
      delegate,
      options,
      new BufferClass()
    );
    let visitor = StringVisitor.build<Buffer, string, typeof options>(reporter);

    return visitor.record(type.descriptor, Pos.Only);
  }) as Formatter<Options, string>;
}
