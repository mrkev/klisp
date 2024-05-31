import * as Parsimmon from "parsimmon";

export type Meta = Readonly<{
  start: Parsimmon.Index;
  end: Parsimmon.Index;
}>;

export class ScriptError extends Error {
  readonly pos: Meta | null;
  constructor(message: string, pos?: Meta, options?: any) {
    super(message);
    this.pos = pos ?? null;
  }
}

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

  log(...msgs: string[]) {
    this._log.push(...msgs);
  }

  fail(err: Error) {
    this._fatalError = err;
  }

  getOut(): string {
    return this._log.join("\n");
  }
}
