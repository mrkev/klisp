import { LangType } from "../lisp";

export function interpret(ast: LangType["Module"]): void {
  console.log("interpreting", ast);
}
