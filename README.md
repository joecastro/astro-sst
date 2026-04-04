# astro-sst

This adapter allows Astro to deploy your SSR or static site to [AWS](https://aws.amazon.com/).

## Installation

Right now this fork isn't being published anywhere. To use it complete the steps:

1. Install the AWS adapter to your project's dependencies using your preferred package manager.

1. Add two new lines to your `astro.config.mjs` project configuration file.

   ```js title="astro.config.mjs" ins={2, 5-6}
   import { defineConfig } from "astro/config";
   import aws from "astro-sst";

   export default defineConfig({
     output: "server",
     adapter: aws(),
   });
   ```

### Response Mode

When utilizing `server` output, you can choose how responses are handled:

- `buffer`: Responses are buffered and sent as a single response. (_default_)
- `stream`: Responses are streamed as they are generated.

```js title="astro.config.mjs" ins={2, 5-6}
import { defineConfig } from "astro/config";
import aws from "astro-sst";

export default defineConfig({
  output: "server",
  adapter: aws({
    responseMode: "stream",
  }),
});
```

## Publishing

If you are publishing your fork of this package, update the package metadata in [packages/astro-sst/package.json](/Users/joe/source/astro-sst/packages/astro-sst/package.json) first, especially `name`, `version`, `repository`, and `bugs`.

Manual release steps:

```sh
# Install dependencies from the repo root.
pnpm install

# Update the version in packages/astro-sst/package.json.
# Update packages/astro-sst/CHANGELOG.md with the release notes for that version.

# Build the package and verify TypeScript output is generated in packages/astro-sst/dist.
pnpm build

# Publish from the package directory.
cd packages/astro-sst
pnpm publish --access public
```

If you are publishing a scoped package, use your scoped package name and make sure that scope is configured in the npm registry account you are publishing to.

## Upgrading from v2

If you're upgrading from v2 of this adapter, here are the key changes to be aware of:

1. Remove the `deploymentStrategy` option from `astro.config.mjs`. Instead, the `output` setting in your Astro config is now used to determine the deployment type:
   - If you previously used `deploymentStrategy: "regional"`, now set `output: "server"` in `astro.config.mjs`.
   - If you previously used `deploymentStrategy: "edge"`, now set `output: "server"` in `astro.config.mjs`. Update SST to v3.9.25 or later. And configure [`regions`](https://sst.dev/docs/component/aws/astro#regions) on your Astro component.
   - If you previously used `deploymentStrategy: "static"`, now set `output: "static"` in `astro.config.mjs`.

2. Remove the `serverRoutes` option from `astro.config.mjs`
