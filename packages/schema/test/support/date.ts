import { ValidationBuilder, validators } from "@cross-check/dsl";
import { Scalar, Type, basic } from "@cross-check/schema";
import { unknown } from "ts-std";

function isValidDate(input: string): boolean {
  let parsed = Date.parse(input);
  if (isNaN(parsed)) return false;
  return input === new Date(parsed).toISOString();
}

class DateType extends Scalar {
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

export const ISODate: () => Type = basic(
  "ISODate",
  DateType,
  "Date",
  "ISO Date"
);
