// @ts-check

const path = require("path");
const fs = require("fs");
const merge = require("broccoli-merge-trees");
const BroccoliDebug = require("broccoli-debug");
const tee = require("broccoli-tee");

const debug = BroccoliDebug.buildDebugCallback(`crosscheck`);

module.exports = function(app) {
  let trees = [];
  let dirs = ["./packages/core", "./packages/dsl", "./packages/schema"];

  for (let dir of dirs) {
    if (fs.lstatSync(dir).isDirectory()) {
      let packageName = path.basename(dir);
      let tree = require(`./packages/${packageName}/ember-cli-build`)();

      tree = tee(tree, path.join(dir, "dist"));

      tree = debug(tree, `$packages:$${packageName}:$ember-cli-build`);
    }
  }

  return merge([...trees]);
};
