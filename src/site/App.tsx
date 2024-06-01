import { Allotment } from "allotment";
import "allotment/dist/style.css";
import * as monaco from "monaco-editor";
import { editor } from "monaco-editor";
import { useCallback, useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { tryParse } from "..";
import { Environment } from "../lib/interpreter/env";
import { interpret, stringOfValue } from "../lib/interpreter/interpreter";
import { InterpreterSystem } from "../lib/interpreter/system";
import { ValType } from "../lib/interpreter/value";
import "./App.css";
import { useEditor } from "./useEditor";

function div(str: string) {
  const elem = document.createElement("div");
  elem.appendChild(document.createTextNode(str));
  return elem;
}

const COMPACT_AST = true;

const DEFAULT_SCRIPT = `
(list 1 2 (cons 1 (list)))
(print 5 golden rings)`;

const scriptEditorOptions: editor.IStandaloneEditorConstructionOptions = {
  fontSize: 16,
  insertSpaces: true,
  tabSize: 2,
  detectIndentation: false,
  minimap: { enabled: false },
  readOnly: false,
} as const;

export function App() {
  const [fatalScriptError, setFatalScriptError] = useState<Error | null>(null);
  const [systemError, setSystemError] = useState<Error | null>(null);
  const [log, setLog] = useState<(Error | string)[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const [script, setScript] = useLocalStorage("klisp.script", DEFAULT_SCRIPT);

  const [decoratorRange, setDecoratorRange] = useState<null | monaco.Range>(
    null
  );
  const [scriptEditor, scriptEditorObj] = useEditor(
    {
      onChange: () => setDecoratorRange(null),
      language: "scheme",
      theme: "vs-dark",
      options: scriptEditorOptions,
      height: "100%",
      defaultValue: script,
      // try "same", "indent" or "none"
      // wrappingIndent: "indent",
      // beforeMount: registerLangForMonaco,
    },
    decoratorRange
  );

  const [astEditor, astEditorObj] = useEditor({
    language: "json",
    theme: "vs-dark",
    height: "100%",
    options: {
      readOnly: true,
      folding: true,
    },
  });

  const doEvaluate = useCallback(() => {
    const system = new InterpreterSystem();
    const editor = scriptEditorObj;

    function log(x: string | Error | ValType["Value"]) {
      if (!logRef.current) {
        return;
      }

      if (typeof x === "string") {
        logRef.current.appendChild(div(x));
      } else if (x instanceof Error) {
        logRef.current.appendChild(div(`Error: ${x.message}`));
      } else {
        logRef.current.appendChild(div(stringOfValue(x)));
      }
    }

    try {
      if (editor == null) {
        throw new Error("no editor");
      }

      const script = editor.getValue();
      setScript(script);
      setDecoratorRange(null);
      setFatalScriptError(null);
      setSystemError(null);

      const ast = tryParse(script);
      const replacer = (key: string, value: any) => {
        if (key === "@") {
          return `${value.start.line}:${value.start.column}:${value.end.line}:${value.end.column}`;
        } else {
          return value;
        }
      };
      const strvalue = JSON.stringify(
        ast,
        COMPACT_AST ? replacer : undefined,
        2
      );

      astEditorObj?.setValue(strvalue);

      const context = Environment.standard();

      const result = interpret(ast, context, system);
      log(result);

      // setFinalContext(finalContext);
    } catch (e) {
      if (e instanceof Error) {
        log(e);
      } else if (typeof e === "string") {
        log(e);
      } else {
        console.error(e);
      }
    }

    setFatalScriptError(system.console._fatalError);
    setLog(system.console._log);
  }, [astEditorObj, scriptEditorObj, setScript]);

  // useEffect(() => {
  //   if (!astEditorObj) {
  //     return;
  //   }

  //   const disposable = astEditorObj.onDidChangeCursorPosition(async (e) => {
  //     const editor = astEditorObj;
  //     const model = editor.getModel();
  //     setDecoratorRange(null);
  //     if (!model) {
  //       return null;
  //     }

  //     const value = getJSONObjectAtPosition(e.position, editor);

  //     try {
  //       if (value instanceof Error) {
  //         throw value;
  //       }

  //       const parsed = JSON.parse(value);
  //       const { kind, "@": pos } = parsed;
  //       if (!kind || !pos || kind === "Program") {
  //         return;
  //       }

  //       if (typeof pos === "string") {
  //         const [sl, sc, el, ec] = pos.split(":").map((s) => parseInt(s));
  //         setDecoratorRange(new monaco.Range(sl, sc, el, ec));
  //       } else {
  //         setDecoratorRange(
  //           new monaco.Range(
  //             pos.start.line,
  //             pos.start.column,
  //             pos.end.line,
  //             pos.end.column
  //           )
  //         );
  //         console.log(`${kind}@[${pos.start.line}:${pos.start.column}]`);
  //       }
  //     } catch (e) {
  //       console.groupCollapsed("cant parse");
  //       console.log("value", value);
  //       console.error(e);
  //       console.groupEnd();
  //     }
  //   });

  //   return () => {
  //     disposable.dispose();
  //   };
  // }, [astEditorObj]);

  return (
    <>
      <Allotment>
        <Allotment.Pane minSize={100} maxSize={200}>
          <button onClick={doEvaluate}>eval</button>
        </Allotment.Pane>
        <Allotment>
          <Allotment vertical>
            <Allotment.Pane>{scriptEditor}</Allotment.Pane>
            <Allotment.Pane>
              {"results:"}
              {log.map((x, i) => {
                if (typeof x === "string") {
                  return <div key={i}>{x}</div>;
                } else {
                  return <div key={i}>{x.message}</div>;
                }
              })}
              {systemError?.message}
              {fatalScriptError?.message}
              <div
                ref={logRef}
                style={{ display: "flex", flexDirection: "column" }}
              ></div>
            </Allotment.Pane>
          </Allotment>
          <Allotment.Pane>{astEditor}</Allotment.Pane>
        </Allotment>
      </Allotment>
    </>
  );
}
