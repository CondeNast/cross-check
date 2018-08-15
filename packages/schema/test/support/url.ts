import { ValidationBuilder, validators } from "@cross-check/dsl";
import { builders, scalar } from "@cross-check/schema";
import { format } from "./format";

export type UrlKind =
  | "absolute"
  | "relative"
  | "http"
  | "https"
  | "protocol-relative"
  | "leading-slash";

function formatForType(urlType: UrlKind): RegExp {
  switch (urlType) {
    case "absolute":
      return /^(https?:)?\/\/[^?#]+(\?[^#]*)?(#.*)?$/;
    case "relative":
      return /^(?!(https?:)?\/\/)[^?#]+(\?[^#]*)?(#.*)?$/;
    case "http":
      return /^http:\/\/[^?#]+(\?[^#]*)?(#.*)?$/;
    case "https":
      return /^https:\/\/[^?#]+(\?[^#]*)?(#.*)?$/;
    case "protocol-relative":
      return /^\/\/[^?#]+(\?[^#]*)?(#.*)?$/;
    case "leading-slash":
      return /^[\/][^?#]+(\?[^#]*)?(#.*)?$/;
  }
}

export function url(...details: UrlKind[]): ValidationBuilder<unknown> {
  if (details.length === 0) {
    return url("absolute");
  }

  return details
    .map(formatForType)
    .map(format)
    .reduce((chain, validator) => chain.or(validator))
    .catch(() => [{ path: [], message: { name: "url", details } }]);
}

export class Urlish {
  constructor(
    public protocol: string,
    public host: string,
    public pathname: string
  ) {}

  toString(): string {
    return `${this.protocol}://${this.host}/${this.pathname}`;
  }
}

export function urlish(full: string) {
  let result = full.match(/^(https?):\/\/([^/]*)\/(.*)$/)!;
  return new Urlish(result[1], result[2], result[3]);
}

const URL = scalar("Url", {
  typescript: "URL",
  description: "url",
  base: "Text",

  validation(args: UrlKind[]) {
    return validators.isString().andThen(url(...args));
  },

  serialize(input: Urlish): string {
    return input.toString();
  },

  parse(input: string): Urlish {
    return urlish(input);
  }
});

export function Url(...kinds: UrlKind[]): builders.PrimitiveBuilder {
  return URL(kinds);
}
