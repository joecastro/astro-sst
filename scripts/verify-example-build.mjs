import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const metadataPath = resolve("examples/basic/dist/sst.buildMeta.json");
const packageJsonPath = resolve("packages/astro-sst/package.json");
const examplePackageJsonPath = resolve("examples/basic/package.json");
const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
const examplePackageJson = JSON.parse(await readFile(examplePackageJsonPath, "utf8"));
const expectedAstroVersion = String(examplePackageJson.dependencies.astro).replace(
  /^\^/,
  ""
);

assert(
  metadata.astroVersion === expectedAstroVersion,
  `Expected Astro ${expectedAstroVersion} in build metadata`
);
assert(
  metadata.pluginVersion === packageJson.version,
  `Expected plugin version ${packageJson.version} in build metadata`
);
assert(metadata.responseMode === "buffer", "Expected default response mode to be buffer");
assert(metadata.outputMode === "server", "Expected server output mode");
assert(
  metadata.serverBuildOutputFile === "dist/server/entry.mjs",
  "Expected server entry metadata to point at dist/server/entry.mjs"
);
assert(
  Array.isArray(metadata.routes) &&
    metadata.routes.some((route) => route.route === "/"),
  "Expected build metadata to include the example index route"
);

console.log(`Verified example build metadata at ${metadataPath}`);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
