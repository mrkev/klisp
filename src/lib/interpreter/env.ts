import { nullthrows } from "../utils";
import { ScriptError } from "./error";
import { ValType, v } from "./value";

// TODO: change ERRORS for more specific ones

/**
 * Context handles variable/ scoping, stack frames (TODO), etc
 */
export class Environment {
  static standard() {
    const scope = new ScopeStack();
    const env = new Environment(scope);
    env.scope.set("zero", v.number(0));
    env.scope.set("print", v.op("print"));
    env.scope.set("let", v.op("let"));
    env.scope.set("list", v.op("list"));
    env.scope.set("+", v.op("+"));
    env.scope.set("-", v.op("-"));
    env.scope.set("*", v.op("*"));
    env.scope.set("/", v.op("/"));
    return env;
  }

  static fromScope(scope: ScopeStack) {
    return new Environment(scope);
  }

  private constructor(readonly scope: ScopeStack) {}
}

export class ScopeStack {
  // we start with top-level map

  constructor(
    private readonly stack: Array<Map<string, ValType["Value"]>> = [new Map()]
  ) {}

  push() {
    this.stack.push(new Map());
  }

  pop() {
    if (this.stack.length === 1) {
      throw new Error("Can't pop last scope!");
    } else if (this.stack.length < 0) {
      throw new Error(`Invalid state, ${this.stack.length} scopes.`);
    } else {
      this.stack.pop();
    }
  }

  // to create closures
  clone() {
    const stack: Array<Map<string, ValType["Value"]>> = [];
    for (const map of this.stack) {
      this.stack.push(new Map(map));
      console.log("pushing");
    }
    return new ScopeStack(stack);
  }

  private top() {
    return nullthrows(
      this.stack.at(-1),
      "impossible: always at least one scope in stack"
    );
  }

  // throws
  get(key: string, errMsg?: string): ValType["Value"] {
    for (let i = this.stack.length - 1; i > -1; i--) {
      const current = this.stack[i];
      if (!current.has(key)) {
        continue;
      }
      return nullthrows(
        current.get(key),
        "impossible: checked for existance above"
      );
    }

    throw new ScriptError(errMsg ?? `Unbound variable: ${key}`);
  }

  // let is:
  // - constant, can't redefine
  // - can however overwrite things in higher scopes
  let(symbol: string, val: ValType["Value"]) {
    const top = this.top();
    if (top.has(symbol)) {
      throw new ScriptError("Cant overwrite constant: " + symbol);
    }

    top.set(symbol, val);
  }

  // set is:
  // - mutable, can be overwritten
  set(key: string, value: ValType["Value"]) {
    this.top().set(key, value);
  }
}
