import { visitorDescriptor } from "../../descriptors/dehydrated";
import { RecordBuilder, RecordImpl } from "../../record";
import { REGISTRY, Registry } from "../../registry";
import { Accumulator, Pos, Reporter, ReporterDelegate } from "./reporter";
import { StringVisitor, toRecord } from "./visitor";

export type Formatter<Options = void, Result = string> = Options extends void
  ? (record: RecordBuilder | RecordImpl) => Result
  : (record: RecordBuilder | RecordImpl, options: Options) => Result;

export default function formatter<Buffer extends Accumulator<string>, Options>(
  delegate: ReporterDelegate<Buffer, string, Options>,
  BufferClass: { new (): Buffer },
  registry: Registry = REGISTRY
): Formatter<Options, string> {
  return ((record: RecordBuilder | RecordImpl, options?: Options): string => {
    let reporter = new Reporter<Buffer, string, typeof options>(
      delegate,
      options,
      new BufferClass()
    );
    let visitor = StringVisitor.build<Buffer, string, typeof options>(reporter);

    let desc = visitorDescriptor(record.dehydrate(), registry);
    return visitor.record(toRecord(desc), Pos.Only);
  }) as Formatter<Options, string>;
}
