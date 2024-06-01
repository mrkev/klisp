import { LangType } from "../parser/parser";
import { BuiltInOp } from "./builtins";
import { Environment, ScopeStack } from "./env";

export type ValType = {
  Value:
    | ValType["Number"]
    | ValType["Nil"]
    | ValType["List"]
    | ValType["Closure"]
    | ValType["BuiltInOp"];
  // data
  Number: { kind: "number"; number: number };
  Nil: { kind: "nil" };
  List: { kind: "list"; list: Array<ValType["Value"]> };
  // callables
  Closure: { kind: "closure"; closure: Closure };
  BuiltInOp: { kind: "op"; op: BuiltInOp };
};

export const v = {
  number(number: number): ValType["Number"] {
    return { kind: "number", number };
  },
  list(list: ValType["Value"][]): ValType["List"] {
    return { kind: "list", list };
  },
  nil(): ValType["Nil"] {
    return { kind: "nil" };
  },
  closure(
    lambda: Array<LangType["Expression"]>,
    env: Environment
  ): ValType["Closure"] {
    return { kind: "closure", closure: new Closure(lambda, env.scope.clone()) };
  },
  op(op: BuiltInOp): ValType["BuiltInOp"] {
    return { kind: "op", op };
  },
};

class Closure {
  constructor(
    readonly lambda: Array<LangType["Expression"]>,
    readonly scope: ScopeStack
  ) {}
}
