import { Allotment } from "allotment";
import "allotment/dist/style.css";
import * as monaco from "monaco-editor";
import { editor } from "monaco-editor";
import { useCallback, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { tryParse } from "..";
import { InterpreterSystem } from "../lib/interpreter/env";
import { interpret } from "../lib/interpreter/interpreter";
import "./App.css";
import { useEditor } from "./useEditor";

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

function App() {
  const [fatalScriptError, setFatalScriptError] = useState<Error | null>(null);
  const [systemError, setSystemError] = useState<Error | null>(null);
  const [log, setLog] = useState<(Error | string)[]>([]);

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

      const finalContext = interpret(ast);
      // setFinalContext(finalContext);
    } catch (e) {
      if (e instanceof Error) {
        setSystemError(e);
      } else if (typeof e === "string") {
        setSystemError(new Error(e));
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
            <Allotment.Pane>{"results:"}</Allotment.Pane>
          </Allotment>
          <Allotment.Pane>{astEditor}</Allotment.Pane>
        </Allotment>

        {/* <div
          style={{
            width: "100%",
            height: "100%",
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gridTemplateRows: "repeat(2, 1fr)",
          }}
        >
          {scriptEditor}
          {features.has("ast") ? astEditor : <div />}
          {evaluationBox}
          {features.has("compile") ? tsEditor : <div />} }
        </div> */}
      </Allotment>
    </>
  );
}

export default App;
