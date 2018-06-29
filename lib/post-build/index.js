const touch = require("touch");
const sleep = require("sleep-promise");

module.exports = {
  name: "post-build",

  isDevelopingAddon() {
    return true;
  },

  postBuild() {
    touch("./packages/core/dist/types/src/index.d.ts")
      .then(() => sleep(100))
      .then(() => touch("./packages/dsl/dist/types/src/index.d.ts"))
      .then(() => sleep(100))
      .then(() => touch("./packages/schema/dist/types/src/index.d.ts"));
  }
};
