import { exhaustive } from "../utils";
import { Environment } from "./env";
import { InterpreterSystem } from "./system";
import { ValType, v } from "./value";
import { evaluate, stringOfValue } from "./interpreter";
import { ScriptError, ScriptPosError } from "./error";
import { LangType } from "../parser/parser";

export type BuiltInOp =
  | "print"
  | "let"
  | "fun"
  | "list"
  | "+"
  | "-"
  | "*"
  | "/";

export function evaluateOp(
  op: BuiltInOp,
  exprs: Array<LangType["Expression"]>,
  env: Environment,
  system: InterpreterSystem
): ValType["Value"] {
  switch (op) {
    case "let": {
      // const [sym, val] = args;
      // env.scope.set()
      // TODO
      return v.nil();
    }

    // (lambda (alpha) (* 5 alpha))
    case "fun": {
      // need arg list and body
      if (exprs.length < 2) {
        console.log(exprs);
        throw new ScriptError("Ill-formed special form");
      }

      const [arglist, ...body] = exprs;
      if (arglist.kind !== "list") {
      }

      const symbs = argumentList(arglist);

      return v.closure(
        symbs.map((s) => s.symbol),
        body,
        env
      );
    }

    case "list": {
      const args = exprs.map((x) => evaluate(x, env, system));
      return v.list(args);
    }

    case "+": {
      const args = exprs.map((x) => evaluate(x, env, system));
      const nums = expectNumbers(args);
      const sum = nums.reduce((a, x) => a + x.number, 0);
      return v.number(sum);
    }

    case "*": {
      const args = exprs.map((x) => evaluate(x, env, system));
      const nums = expectNumbers(args);
      const prod = nums.reduce((a, x) => a * x.number, 1);
      return v.number(prod);
    }

    case "-": {
      const args = exprs.map((x) => evaluate(x, env, system));
      const nums = expectNumbers(args);
      if (nums.length == 0) {
        throw new ScriptError("Wrong number of arguments passed to procedure");
      } else if (nums.length == 1) {
        return v.number(-nums[0].number);
      } else {
        // map to number so we don't need to fiddle with the first acc
        const diff = nums.map((x) => x.number).reduce((a, x) => a - x);
        return v.number(diff);
      }
    }

    case "/": {
      const args = exprs.map((x) => evaluate(x, env, system));
      const nums = expectNumbers(args);
      if (nums.length == 0) {
        throw new ScriptError("Wrong number of arguments passed to procedure");
      } else if (nums.length == 1) {
        return v.number(1 / nums[0].number);
      } else {
        // map to number so we don't need to fiddle with the first acc
        const quot = nums.map((x) => x.number).reduce((a, x) => a / x);
        return v.number(quot);
      }
    }

    case "print": {
      const args = exprs.map((x) => evaluate(x, env, system));
      const strs = args.map((val) => stringOfValue(val));
      system.console.log(strs);
      return v.nil();
    }

    default:
      throw exhaustive(op);
  }
}

function expectNumbers(
  vals: Array<ValType["Value"]>
): Array<ValType["Number"]> {
  for (const val of vals) {
    if (val.kind !== "number") {
      throw new ScriptError("Expected 'number'");
    }
  }
  return vals as Array<ValType["Number"]>;
}

function expectSymbolNodes(
  vals: Array<LangType["Expression"]>
): Array<LangType["Symbol"]> {
  for (const val of vals) {
    if (val.kind !== "symbol") {
      throw new ScriptPosError("Expected symbol", val["@"]);
    }
  }
  return vals as Array<LangType["Symbol"]>;
}

function argumentList(expr: LangType["Expression"]): Array<LangType["Symbol"]> {
  switch (expr.kind) {
    case "number":
      throw new ScriptPosError(
        "Identifier or identifier list expected",
        expr["@"]
      );
    case "list":
      return expectSymbolNodes(expr.list);
    case "symbol":
      return [expr];
    default:
      throw exhaustive(expr);
  }
}
