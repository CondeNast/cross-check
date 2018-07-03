// const collectPackages = require("@lerna/collect-packages");
// const batchPackages = require("@lerna/batch-packages");

// function sortPackages(root) {
//   return collectPackages(root).then(p => batchPackages(p, true));
// }

// async function main() {
//   let packages = await sortPackages(process.cwd());
//   console.log(packages[0].map(p => p.location));
// }

// main();

const fs = require("fs");
const path = require("path");
const writePkg = require("write-pkg");

let packagePath = path.join(process.cwd(), "package.json");
let package = require(packagePath);
let peerDeps = package.peerDependencies;

for (let dep of Object.keys(peerDeps)) {
  if (dep.match("^@cross-check/")) {
    peerDeps[dep] = package.version;
  }
}

writePkg.sync(packagePath, package);
