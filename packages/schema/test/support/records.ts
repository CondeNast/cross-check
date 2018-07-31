import {
  DEBUG_LOG,
  Record,
  formatDescriptor,
  types
} from "@cross-check/schema";
import { ISODate, Url } from "../support";

export const SimpleArticle: Record = Record("SimpleArticle", {
  fields: {
    hed: types.SingleLine().required(),
    dek: types.Text(),
    body: types.Text().required()
  },
  metadata: {
    collectionName: "simple-articles",
    modelName: "simple-article"
  }
});

if (DEBUG_LOG === "debug") {
  // @ts-ignore
  // tslint:disable-next-line
  console.log(formatDescriptor(SimpleArticle.descriptor));
}

export const MediumArticle: Record = Record("MediumArticle", {
  fields: {
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
    // channels: types.List(types.SingleLine()).feature("channels"),
    geo: types.Dictionary({
      lat: types.Integer().required(),
      long: types.Integer().required()
    }),
    contributors: types.List(
      types.Dictionary({ first: types.SingleLine(), last: types.SingleLine() })
    )
  },
  metadata: {
    collectionName: "medium-articles",
    modelName: "medium-article"
  }
});

if (DEBUG_LOG === "debug") {
  // @ts-ignore
  // tslint:disable-next-line
  console.log(formatDescriptor(MediumArticle.descriptor));
}

export const Related = Record("Related", {
  fields: {
    first: types.SingleLine(),
    last: types.Text(),

    person: types.hasOne(SimpleArticle).required(),
    articles: types.hasMany(MediumArticle)
  },
  metadata: {
    collectionName: "related-articles",
    modelName: "related-article"
  }
});

if (DEBUG_LOG === "debug") {
  // @ts-ignore
  // tslint:disable-next-line
  console.log(formatDescriptor(Related.descriptor));
}

export const Features = Record("ArticleWithFlags", {
  fields: {
    hed: types.SingleLine(),
    dek: types.SingleLine(),
    categories: types.List(types.SingleLine()).features(["category-picker"]),
    description: types.Text().features(["description"]),
    location: types
      .Dictionary({
        lat: types.Float(),
        long: types.Float()
      })
      .features(["map"])
  },
  metadata: {
    collectionName: "articles-with-flags",
    modelName: "article-with-flags"
  }
});

if (DEBUG_LOG === "debug") {
  // @ts-ignore
  // tslint:disable-next-line
  console.log(formatDescriptor(Features.descriptor));
}

export const Nesting = Record("Nesting", {
  fields: {
    people: types
      .List(
        types.Dictionary({
          first: types.SingleLine(),
          last: types.Text()
        })
      )
      .required()
  }
});

if (DEBUG_LOG === "debug") {
  // @ts-ignore
  // tslint:disable-next-line
  console.log(formatDescriptor(Nesting.descriptor));
}

// export const Cursor: () => Type = opaque(
//   "Cursor",
//   types.Text(),
//   "Cursor",
//   "Relay Cursor"
// );

// export const PageInfo = Record("PageInfo", {
//   hasNextPage: types.Boolean().required(),
//   hasPreviousPage: types.Boolean().required()
// });

// export const Edge: Generic = generic(T =>
//   Record("Edge", {
//     cursor: Cursor(),
//     node: T
//   })
// );

// export const Page = generic(T =>
//   Record("Page", {
//     // @ts-ignore
//     edges: Edge(T),
//     pageInfo: PageInfo
//   }).required()
// );

// export const Bundle = Record("Bundle", {
//   name: types.SingleLine(),
//   // @ts-ignore
//   articles: Page(SimpleArticle)
// });
