import { describe, expect, it } from "vitest";
import { tryParse } from "../parser/parser";
import { interpret, stringOfValue } from "./interpreter";
import { Environment } from "./env";
import { InterpreterSystem } from "./system";
import { ValType } from "./value";

function run(str: string): ValType["Value"] {
  const ast = tryParse(str);

  const context = Environment.standard();
  const system = new InterpreterSystem();
  const result = interpret(ast, context, system);

  if (result instanceof Error) {
    throw result;
  }

  return result;
}

function testOk(testname: string, script: string, res: string) {
  it(testname, () => {
    const value = run(script);
    expect(stringOfValue(value)).toBe(res);
  });
}

function testErr(testname: string, script: string) {
  it(testname, () => {
    expect(() => run(script)).toThrowErrorMatchingSnapshot();
  });
}

describe("math", () => {
  testOk("+", "(+ 3 4)", "7");
  testOk("-", "(- 3 4)", "-1");
  testOk("- unary", "(- 3)", "-3");
  testOk("*", "(* 3 4)", "12");
  testOk("/", "(/ 4 2)", "2");
  testOk("/ unary", "(/ 4)", "0.25");
});

describe("list", () => {
  testOk("list", "(list 3 4)", "(3 4)");
});

describe("lambda", () => {
  testOk("id", "(fun x x)", "(fun (x) ...)");
  testOk("id.2", "(fun (x) x)", "(fun (x) ...)");
  testOk("apply", "((fun (x) x) 3)", "3");
  testErr("x.args.1", "((fun (x) x) 3 3)");
  testErr("x.args.2", "((fun (x y) (+ x y)) 3)");
  testOk("body list", "((fun (x y) (+ x y) (- x y)) 3 2)", "1");
});
