# After MVP

After is a local-first developer tool for capturing meaningful development
moments into a Project Brain and generating summaries, outputs, and demo assets
from that record.

## Workspace

- `apps/ui` - React and Vite frontend.
- `packages/core` - Project Brain schemas, reader, writer, templates, and later capture/privacy logic.
- `packages/server` - Express API and CLI entry points.
- `packages/outputs` - Output generator package.
- `packages/video` - Video pipeline package.
- `packages/shared-ui` - Shared React component primitives.
- `packages/typescript-config` and `packages/eslint-config` - Shared tooling configuration.

## Commands

```sh
npm run check-types
npm run build
npm run lint
npm run test
```

To initialize a Project Brain in the current directory once the server package
is built:

```sh
node packages/server/dist/index.js init .
```
