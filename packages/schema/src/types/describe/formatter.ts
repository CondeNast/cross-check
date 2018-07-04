import { BaseRecord } from "../../record";
import { Accumulator, Reporter, ReporterDelegate } from "./reporter";
import { StringVisitor } from "./visitor";

export type Formatter<Options = void, Result = string> = Options extends void
  ? (record: BaseRecord) => Result
  : (record: BaseRecord, options: Options) => Result;

export default function formatter<Buffer extends Accumulator<string>, Options>(
  delegate: ReporterDelegate<Buffer, string, Options>,
  BufferClass: { new (): Buffer }
): Formatter<Options, string> {
  return ((type: BaseRecord, options?: Options): string => {
    let reporter = new Reporter<Buffer, string, typeof options>(
      delegate,
      options,
      new BufferClass()
    );
    let visitor = StringVisitor.build<Buffer, string, typeof options>(reporter);

    return visitor.record(type);
  }) as any;
}
