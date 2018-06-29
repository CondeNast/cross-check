// @ts-check

const path = require("path");
const fs = require("fs");
const glob = require("glob");
const merge = require("broccoli-merge-trees");
const funnel = require("broccoli-funnel");
const webpack = require("libkit/lib/ember-cli-build/webpack");
const findWorkspaceRoot = require("find-yarn-workspace-root");
const BroccoliDebug = require("broccoli-debug");
const getPackages = require("get-monorepo-packages");
const BroccoliPlugin = require("broccoli-plugin");
const Addon = require("ember-cli/lib/models/addon");

const debug = BroccoliDebug.buildDebugCallback(`crosscheck`);

// TODO: When core changes, rebuild DSL

module.exports = function(app) {
  let { root = findWorkspaceRoot(__dirname) } = app;

  let trees = [];

  let dirs = ["./packages/core", "./packages/dsl", "./packages/schema"];

  for (let dir of dirs) {
    if (fs.lstatSync(dir).isDirectory()) {
      let packageName = path.basename(dir);
      let tree = require(`./packages/${packageName}/ember-cli-build`)();

      tree = debug(tree, `$packages:$${packageName}:$ember-cli-build`);

      trees.push(
        debug(
          funnel(tree, {
            exclude: ["index.html", "index.testem.html", "qunit.*", "tests.js"],
            destDir: packageName
          }),
          `$packages:$${packageName}:$after`
        )
      );
    }
  }

  return merge([...trees, tests(trees, root)]);
};

function tests(modules, root) {
  let trees = debug(merge(modules), "$webpack:$before");
  let tests = debug(webpackTests(trees, root), "$webpack:$after");

  let testHTML = funnel(path.resolve(root, "test"), {
    include: ["index.html", "index.testem.html"]
  });

  let qunit = funnel(path.resolve(root, "node_modules", "qunit", "qunit"));

  return merge([tests, testHTML, qunit]);
}

function webpackTests(testModules, root) {
  return webpack(testModules, {
    webpack: {
      entry: () => glob.sync("*/modules/test/**/*-test.js"),
      output: {
        filename: "tests.js",
        // devtoolModuleFilenameTemplate: info => console.log(info)
        devtoolModuleFilenameTemplate: "[absolute-resource-path]"
      },
      devtool: "source-map",
      module: {
        rules: [
          {
            test: /\.js$/,
            use: ["source-map-loader"],
            enforce: "pre"
          }
        ]
      },
      resolve: {
        alias: webpackAliases(root)
      }
    }
  });
}

function webpackAliases(root) {
  let aliases = {};

  for (let { package, location } of getPackages(root)) {
    aliases[package.name] = `${path.basename(location)}/modules/src/index.js`;
  }

  return aliases;
}

const collectPackages = require("@lerna/collect-packages");
const batchPackages = require("@lerna/batch-packages");

function sortPackages(root) {
  return collectPackages(root)
    .then(p => batchPackages(p, true))
    .then(p => p[0].map(p => p.location));
}
