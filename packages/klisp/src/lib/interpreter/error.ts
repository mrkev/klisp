import Parsimmon from "parsimmon";
import { LangPos } from "../parser/parser";

export type Meta = Readonly<{
  start: Parsimmon.Index;
  end: Parsimmon.Index;
}>;

export class ScriptError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class ScriptPosError extends Error {
  readonly pos: Meta;
  constructor(message: string, pos: LangPos) {
    super(message);
    this.pos = pos;
  }
}
