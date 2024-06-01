import { LangType } from "../parser/parser";
import { exhaustive } from "../utils";
import { callOp } from "./builtins";
import { Environment } from "./env";
import { ScriptError } from "./error";
import { InterpreterSystem } from "./system";
import { ValType, v } from "./value";

export function interpret(
  module: LangType["Module"],
  context: Environment,
  system: InterpreterSystem
): ValType["Value"] | ScriptError | Error {
  try {
    let result: ValType["Value"] = v.nil();
    for (const expr of module.exprs) {
      result = evaluate(expr, context, system);
    }
    return result;
  } catch (e: unknown) {
    if (e instanceof ScriptError) {
      return e;
    } else if (e instanceof Error) {
      return e;
    } else {
      return new Error(String(e));
    }
  }
}

function evaluate(
  expr: LangType["Expression"],
  env: Environment,
  system: InterpreterSystem
): ValType["Value"] {
  switch (expr.kind) {
    case "number": {
      return v.number(expr.number);
    }

    case "list": {
      if (expr.list.length < 1) {
        throw new ScriptError("Ill-formed expression");
      }

      const list = expr.list.map((x) => evaluate(x, env, system));
      const [first, ...rest] = list;

      if (first.kind !== "closure" && first.kind !== "op") {
        throw new ScriptError("Operator is not a PROCEDURE");
      }

      return apply(first, rest, env, system);
    }

    case "symbol":
      return env.scope.get(expr.symbol);

    default:
      throw exhaustive(expr);
  }
}

// (define (foo x) 2)
function apply(
  val: ValType["Closure"] | ValType["BuiltInOp"],
  args: Array<ValType["Value"]>,
  env: Environment,
  system: InterpreterSystem
) {
  switch (val.kind) {
    case "closure": {
      const env = Environment.fromScope(val.closure.scope);

      // note, lambdas always have at leastone expression
      let result: ValType["Value"] = v.nil();
      for (const expr of val.closure.lambda ?? []) {
        result = evaluate(expr, env, system);
      }

      return result;
    }
    case "op": {
      return callOp(val.op, args, env, system);
    }
    default:
      throw exhaustive(val);
  }
}

export function stringOfValue(val: ValType["Value"]): string {
  switch (val.kind) {
    case "closure":
      return `<\\ closure.TODO>`;
    case "list":
      return `(${val.list.map((v) => stringOfValue(v)).join(" ")})`;
    case "nil":
      return "nil";
    case "number":
      return String(val.number);
    case "op":
      return `<builtin op: ${val.op}>`;

    default:
      throw exhaustive(val);
  }
}
