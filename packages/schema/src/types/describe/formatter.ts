import { Record } from "../../record";
import { Accumulator, Pos, Reporter, ReporterDelegate } from "./reporter";
import { StringVisitor } from "./visitor";

export type Formatter<Options = void, Result = string> = Options extends void
  ? (record: Record) => Result
  : (record: Record, options: Options) => Result;

export default function formatter<Buffer extends Accumulator<string>, Options>(
  delegate: ReporterDelegate<Buffer, string, Options>,
  BufferClass: { new (): Buffer }
): Formatter<Options, string> {
  return ((type: Record, options?: Options): string => {
    let reporter = new Reporter<Buffer, string, typeof options>(
      delegate,
      options,
      new BufferClass()
    );
    let visitor = StringVisitor.build<Buffer, string, typeof options>(reporter);

    return visitor.record(type.descriptor, Pos.Only);
  }) as any;
}
