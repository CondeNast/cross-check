import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Scalar, TypeBuilder, primitive } from "@cross-check/schema";
import { unknown } from "ts-std";

function isValidDate(input: string): boolean {
  let parsed = Date.parse(input);
  if (isNaN(parsed)) return false;
  return input === new Date(parsed).toISOString();
}

class DateType extends Scalar<undefined> {
  static description = "ISO Date";
  static typescript = "Date";
  static typeName = "ISODate";

  validation(): ValidationBuilder<unknown> {
    return validators.isString().andThen(
      validators.is((v: string): v is string => {
        return isValidDate(v);
      }, "iso-date")()
    );
  }

  serialize(input: Date): string {
    return input.toISOString();
  }

  parse(input: string): Date {
    return new Date(Date.parse(input));
  }
}

export const ISODate: () => TypeBuilder = primitive(DateType);
