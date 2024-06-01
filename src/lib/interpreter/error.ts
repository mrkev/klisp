import Parsimmon from "parsimmon";

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
