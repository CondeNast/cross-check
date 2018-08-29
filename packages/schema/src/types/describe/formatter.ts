import { visitorDescriptor } from "../../descriptors/dehydrated";
import { FormattableRecord } from "../../record";
import { Registry } from "../../registry";
import { Accumulator, Pos, Reporter, ReporterDelegate } from "./reporter";
import { StringVisitor } from "./visitor";

export type Formatter<Options = void, Result = string> = Options extends void
  ? (registry: Registry, record: FormattableRecord) => Result
  : (registry: Registry, record: FormattableRecord, options: Options) => Result;

export default function formatter<Buffer extends Accumulator<string>, Options>(
  delegate: ReporterDelegate<Buffer, string, Options>,
  BufferClass: { new (): Buffer }
): Formatter<Options, string> {
  return ((
    registry: Registry,
    record: FormattableRecord,
    options?: Options
  ): string => {
    let reporter = new Reporter<Buffer, string, typeof options>(
      delegate,
      options,
      new BufferClass()
    );

    let visitor = StringVisitor.build<Buffer, string, typeof options>(reporter);

    return visitor.record(
      record.name,
      visitorDescriptor(record.members, registry),
      record.metadata,
      Pos.Only
    );
  }) as Formatter<Options, string>;
}
