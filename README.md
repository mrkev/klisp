# klisp

A small Lisp interpreter written in TypeScript, with a web playground.

This is a pnpm + nx monorepo:

```
docs/             built website, GitHub Pages is configured to point here
packages/
  klisp/          the interpreter & parser (the library)
  site/           the web playground (builds to ../../docs)
```

## Scripts (run from the repo root)

- `pnpm build` — builds every package (`nx run-many -t build`). The site build
  emits to `docs/` for GitHub Pages.
- `pnpm build:lib` — builds only the `klisp` library to `packages/klisp/dist`
- `pnpm build:site` — builds only the site
- `pnpm dev` — starts the site dev server
- `pnpm test` — runs the test suites
- `pnpm lint` — lints the whole workspace

The `site` package consumes `klisp` as a workspace dependency.
