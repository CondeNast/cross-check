import {
  Generic,
  Record,
  Type,
  generic,
  opaque,
  types
} from "@cross-check/schema";
import { ISODate, Url } from "../support";

export const SimpleArticle = Record("SimpleArticle", {
  hed: types.SingleLine().required(),
  dek: types.Text(),
  body: types.Text().required()
}).metadata({
  collectionName: "simple-articles",
  modelName: "simple-article"
});

export const MediumArticle = Record("MediumArticle", {
  hed: types.SingleLine().required(),
  dek: types.Text(),
  body: types.Text().required(),
  author: types.Dictionary({
    first: types.SingleLine(),
    last: types.SingleLine()
  }),
  issueDate: ISODate(),
  canonicalUrl: Url(),
  tags: types.List(types.SingleWord()),
  categories: types.List(types.SingleLine()).required(),
  geo: types.Dictionary({
    lat: types.Integer().required(),
    long: types.Integer().required()
  }),
  contributors: types.List(
    types.Dictionary({ first: types.SingleLine(), last: types.SingleLine() })
  )
}).metadata({
  collectionName: "medium-articles",
  modelName: "medium-article"
});

export const Related = Record("Related", {
  first: types.SingleLine(),
  last: types.Text(),

  person: types.hasOne(SimpleArticle).required(),
  articles: types.hasMany(MediumArticle)
}).metadata({
  collectionName: "related-articles",
  modelName: "related-article"
});

export const Nesting = Record("Nesting", {
  people: types
    .List(
      types.Dictionary({
        first: types.SingleLine(),
        last: types.Text()
      })
    )
    .required()
});

export const Cursor: () => Type = opaque("Cursor", types.Text());

export const PageInfo = Record("PageInfo", {
  hasNextPage: types.Boolean().required(),
  hasPreviousPage: types.Boolean().required()
});

export const Edge: Generic = generic(T =>
  Record("Edge", {
    cursor: Cursor(),
    node: T
  })
);

export const Page = generic(T =>
  Record("Page", {
    edges: Edge(T),
    pageInfo: PageInfo
  }).required()
);

export const Bundle = Record("Bundle", {
  name: types.SingleLine(),
  articles: Page(SimpleArticle)
});
