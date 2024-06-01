import { exhaustive } from "../utils";
import { Environment } from "./env";
import { InterpreterSystem } from "./system";
import { ValType, v } from "./value";
import { stringOfValue } from "./interpreter";
import { ScriptError } from "./error";

export type BuiltInOp = "print" | "let" | "list" | "+" | "-" | "*" | "/";

export function callOp(
  op: BuiltInOp,
  args: Array<ValType["Value"]>,
  env: Environment,
  system: InterpreterSystem
): ValType["Value"] {
  console.log("OP", op, args);
  switch (op) {
    case "let": {
      // const [sym, val] = args;
      // env.scope.set()
      // TODO
      return v.nil();
    }

    case "list": {
      return v.list(args);
    }

    case "+": {
      const nums = expectNumbers(args);
      const sum = nums.reduce((a, x) => a + x.number, 0);
      return v.number(sum);
    }

    case "*": {
      const nums = expectNumbers(args);
      const prod = nums.reduce((a, x) => a * x.number, 1);
      return v.number(prod);
    }

    case "-": {
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
