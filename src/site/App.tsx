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
import { createUseStyles } from "react-jss";

function div(str: string, classname?: string | null) {
  const elem = document.createElement("div");
  classname != null && elem.setAttribute("class", classname);
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
  const styles = useStyles();
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
    logRef.current?.replaceChildren();
    const system = new InterpreterSystem();
    const editor = scriptEditorObj;

    function log(
      x: string | Error | ValType["Value"],
      as: "log" | "value" | "error"
    ) {
      if (!logRef.current) {
        return;
      }

      const classname =
        as === "error" ? styles.logerror : as === "log" ? styles.logitem : null;

      console.log(classname);
      if (typeof x === "string") {
        logRef.current.appendChild(div(x, classname));
      } else if (x instanceof Error) {
        logRef.current.appendChild(div(`Error: ${x.message}`, styles.logerror));
      } else {
        logRef.current.appendChild(div(stringOfValue(x), classname));
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

      for (const logitem of system.console._log) {
        log(logitem, "log");
      }

      log(result, "value");

      // setFinalContext(finalContext);
    } catch (e) {
      if (e instanceof Error) {
        log(e, "error");
      } else if (typeof e === "string") {
        log(e, "error");
      } else {
        console.error(e);
      }
    }

    setFatalScriptError(system.console._fatalError);
    setLog(system.console._log);
  }, [
    astEditorObj,
    scriptEditorObj,
    setScript,
    styles.logerror,
    styles.logitem,
  ]);

  return (
    <>
      <Allotment>
        <Allotment.Pane minSize={100} maxSize={300} className={styles.sidebar}>
          <h2>klisp</h2>
          <p>A very simple lisp by Kevin Chavez</p>
        </Allotment.Pane>
        <Allotment>
          <Allotment vertical>
            <Allotment.Pane>{scriptEditor}</Allotment.Pane>
            <Allotment.Pane>
              <button onClick={doEvaluate}>eval</button>

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

const useStyles = createUseStyles({
  sidebar: {
    padding: "0px 6px",
  },
  logitem: {
    color: "gray",
  },
  logerror: {
    color: "red",
  },
});
