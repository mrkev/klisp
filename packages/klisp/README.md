# klisp

A small Lisp interpreter, implemented in TypeScript.

- `build` type-checks and builds the library to `dist`, where `package.json` is
  configured to expect it
- `test` runs the interpreter test suite with vitest

The public API is exported from [`src/index.ts`](./src/index.ts).
