import { LangType } from "../parser/parser";
import { exhaustive } from "../utils";
import { evaluateOp } from "./builtins";
import { Environment } from "./env";
import { ScriptError, ScriptPosError } from "./error";
import { InterpreterSystem } from "./system";
import { ValType, v } from "./value";

export function interpret(
  module: LangType["Module"],
  context: Environment,
  system: InterpreterSystem
): ValType["Value"] | ScriptError | ScriptPosError | Error {
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

export function evaluate(
  expr: LangType["Expression"],
  env: Environment,
  system: InterpreterSystem
): ValType["Value"] {
  switch (expr.kind) {
    case "number": {
      return v.number(expr.number);
    }

    case "list": {
      return evaluateList(expr, env, system);
    }

    case "symbol":
      return env.scope.get(expr);

    default:
      throw exhaustive(expr);
  }
}

// (value cdr cdr cdr...)
function evaluateList(
  expr: LangType["List"],
  env: Environment,
  system: InterpreterSystem
) {
  if (expr.list.length < 1) {
    throw new ScriptPosError("Ill-formed expression", expr["@"]);
  }

  const [car, ...cdr] = expr.list;
  const first = evaluate(car, env, system);
  switch (first.kind) {
    case "list":
    case "nil":
    case "number":
      throw new ScriptPosError("Operator is not a PROCEDURE", expr["@"]);

    //
    case "closure": {
      const envdown = Environment.fromScope(first.closure.scope);
      envdown.scope.push();
      if (cdr.length !== first.closure.args.length) {
        throw new ScriptError("Wrong number of arguments passed to procedure");
      }

      for (let i = 0; i < cdr.length; i++) {
        const argsym = first.closure.args[i];
        const argval = evaluate(cdr[i], env, system);
        envdown.scope.set(argsym, argval);
      }

      // note, lambdas always have at leastone expression
      let result: ValType["Value"] = v.nil();
      for (const expr of first.closure.body) {
        result = evaluate(expr, envdown, system);
      }

      // technically not necessary, but doing it for the sake fo symmetry
      envdown.scope.pop();
      return result;
    }

    case "op": {
      console.log(car, cdr);
      return evaluateOp(first.op, cdr, env, system);
    }
    default:
      throw exhaustive(first);
  }
}

export function stringOfValue(val: ValType["Value"]): string {
  switch (val.kind) {
    case "closure":
      return `(fun (${val.closure.args.join(" ")}) ...)`;
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
