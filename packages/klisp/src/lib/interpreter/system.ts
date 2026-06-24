import { ScriptError } from "./error";

/**
 * System handles I/O, other APIs
 */
export class InterpreterSystem {
  readonly console: Console = new Console();
}

class Console {
  _log: (string | Error)[] = [];
  _fatalError: Error | ScriptError | null = null;

  clear() {
    this._log = [];
  }

  log(msgs: string[]) {
    console.log(...msgs);
    this._log.push(...msgs);
  }

  fail(err: Error) {
    this._fatalError = err;
  }

  getOut(): string {
    return this._log.join("\n");
  }
}
