// based on: https://github.com/jneen/parsimmon/blob/master/examples/lisp.js

import P from "parsimmon";

export type LangPos = {
  start: P.Index;
  end: P.Index;
};

export type LangType = {
  Expression: LangType["Symbol"] | LangType["Number"] | LangType["List"];
  Symbol: { kind: "symbol"; symbol: string; "@": LangPos };
  Number: { kind: "number"; number: number; "@": LangPos };
  List: { kind: "list"; list: Array<LangType["Expression"]>; "@": LangPos };
  Module: {
    kind: "module";
    exprs: Array<LangType["Expression"]>;
    "@": LangPos;
  };
};

const Lisp = P.createLanguage<LangType>({
  // An expression is just any of the other values we make in the language. Note
  // that because we're using `.createLanguage` here we can reference other
  // parsers off of the argument to our function. `r` is short for `rules` here.
  Expression: function (r) {
    return P.alt(r.Symbol, r.Number, r.List);
  },

  // IDENTIFIER
  // The basic parsers (usually the ones described via regexp) should have a
  // description for error message purposes.
  Symbol: function () {
    return P.regexp(/[a-zA-Z_\-\+\*\/][a-zA-Z0-9_-]*/)
      .desc("symbol")
      .mark()
      .map(({ start, end, value }) => ({
        kind: "symbol",
        symbol: value,
        "@": { start, end },
      }));
  },

  // Note that Number("10") === 10, Number("9") === 9, etc in JavaScript.
  // This is not a recursive parser. Number(x) is similar to parseInt(x, 10).
  Number: function () {
    return P.regexp(/[0-9]+/)
      .map(Number)
      .desc("number")
      .mark()
      .map(({ start, end, value }) => ({
        kind: "number",
        number: value,
        "@": { start, end },
      }));
  },

  // `.trim(P.optWhitespace)` removes whitespace from both sides, then `.many()`
  // repeats the expression zero or more times. Finally, `.wrap(...)` removes
  // the '(' and ')' from both sides of the list.
  List: function (r) {
    return r.Expression.trim(P.optWhitespace)
      .many()
      .wrap(P.string("("), P.string(")"))
      .mark()
      .map(({ start, end, value }) => ({
        kind: "list",
        list: value,
        "@": { start, end },
      }));
  },

  // A file in Lisp is generally just zero or more expressions.
  Module: function (r) {
    return r.Expression.trim(P.optWhitespace)
      .many()
      .mark()
      .map(({ start, end, value }) => ({
        kind: "module",
        exprs: value,
        "@": { start, end },
      }));
  },
});

export function tryParse(str: string) {
  return Lisp.Module.tryParse(str);
}
