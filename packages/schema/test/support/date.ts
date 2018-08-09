import { validators } from "@cross-check/dsl";
import { registered, scalar } from "@cross-check/schema";

function isValidDate(input: string): boolean {
  let parsed = Date.parse(input);
  if (isNaN(parsed)) return false;
  return input === new Date(parsed).toISOString();
}

export const ISODate: () => registered.Primitive = scalar("ISODate", {
  description: "ISO Date",
  typescript: "Date",

  validation: validators.isString().andThen(
    validators.is((v: string): v is string => {
      return isValidDate(v);
    }, "iso-date")()
  ),

  serialize(input: Date): string {
    return input.toISOString();
  },

  parse(input: string): Date {
    return new Date(Date.parse(input));
  }
});
