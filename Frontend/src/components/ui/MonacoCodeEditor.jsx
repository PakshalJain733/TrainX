import React, { useRef } from "react";
import Editor from "@monaco-editor/react";
import "./MonacoCodeEditor.css";

// Map custom language keys to standard Monaco language identifiers
const LANGUAGE_MAP = {
  react: "javascript",
  jsx: "javascript",
  node: "javascript",
  js: "javascript",
  javascript: "javascript",
  typescript: "typescript",
  ts: "typescript",
  python: "python",
  py: "python",
  java: "java",
  cpp: "cpp",
  "c++": "cpp",
  c: "c",
  sql: "sql",
  html: "html",
  css: "css",
  json: "json",
  go: "go",
  golang: "go",
  php: "php",
  rust: "rust",
};

export default function MonacoCodeEditor({
  value = "",
  onChange,
  language = "javascript",
  height = "380px",
  readOnly = false,
  theme = "vibrant-dark",
  placeholder = "Write your code here...",
  options = {},
  className = "",
  onMount,
}) {
  const editorRef = useRef(null);
  const monacoLang = LANGUAGE_MAP[String(language).toLowerCase()] || language || "javascript";

  const handleBeforeMount = (monaco) => {
    // Define the vibrant-dark theme with rich colorful syntax highlighting
    monaco.editor.defineTheme("vibrant-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "e2e8f0", background: "0f172a" },
        { token: "comment", foreground: "64748b", fontStyle: "italic" },
        { token: "keyword", foreground: "f472b6", fontStyle: "bold" },
        { token: "keyword.control", foreground: "fb7185", fontStyle: "bold" },
        { token: "keyword.operator", foreground: "f43f5e" },
        { token: "string", foreground: "4ade80" },
        { token: "string.escape", foreground: "facc15" },
        { token: "number", foreground: "c084fc" },
        { token: "type", foreground: "38bdf8", fontStyle: "bold" },
        { token: "class", foreground: "38bdf8", fontStyle: "bold" },
        { token: "interface", foreground: "2dd4bf" },
        { token: "function", foreground: "60a5fa" },
        { token: "variable", foreground: "f1f5f9" },
        { token: "variable.parameter", foreground: "fbbf24" },
        { token: "constant", foreground: "fb923c" },
        { token: "tag", foreground: "f472b6", fontStyle: "bold" },
        { token: "tag.id", foreground: "a78bfa" },
        { token: "tag.class", foreground: "60a5fa" },
        { token: "attribute.name", foreground: "38bdf8" },
        { token: "attribute.value", foreground: "4ade80" },
        { token: "delimiter", foreground: "94a3b8" },
        { token: "delimiter.bracket", foreground: "fbbf24" },
        { token: "operator", foreground: "f472b6" },
        { token: "regexp", foreground: "fb923c" },
      ],
      colors: {
        "editor.background": "#0f172a",
        "editor.foreground": "#e2e8f0",
        "editorLineNumber.foreground": "#475569",
        "editorLineNumber.activeForeground": "#818cf8",
        "editorCursor.foreground": "#38bdf8",
        "editor.selectionBackground": "#33415580",
        "editor.inactiveSelectionBackground": "#1e293b80",
        "editor.lineHighlightBackground": "#1e293b50",
        "editorIndentGuide.background": "#1e293b",
        "editorIndentGuide.activeBackground": "#475569",
        "editorBracketMatch.background": "#818cf830",
        "editorBracketMatch.border": "#818cf8",
        "editorGutter.background": "#0f172a",
      },
    });

    // Define dracula vibrant theme
    monaco.editor.defineTheme("dracula-vibrant", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "f8f8f2", background: "181824" },
        { token: "comment", foreground: "6272a4", fontStyle: "italic" },
        { token: "keyword", foreground: "ff79c6", fontStyle: "bold" },
        { token: "string", foreground: "50fa7b" },
        { token: "number", foreground: "bd93f9" },
        { token: "type", foreground: "8be9fd", fontStyle: "bold" },
        { token: "function", foreground: "66d9ef" },
        { token: "variable", foreground: "f8f8f2" },
        { token: "constant", foreground: "ffb86c" },
        { token: "tag", foreground: "ff79c6" },
        { token: "attribute.name", foreground: "50fa7b" },
        { token: "delimiter.bracket", foreground: "ffb86c" },
      ],
      colors: {
        "editor.background": "#181824",
        "editor.foreground": "#f8f8f2",
        "editorLineNumber.foreground": "#6272a4",
        "editorLineNumber.activeForeground": "#ff79c6",
        "editorCursor.foreground": "#50fa7b",
        "editor.selectionBackground": "#44475a80",
        "editor.lineHighlightBackground": "#21222c80",
        "editorBracketMatch.background": "#ff79c630",
        "editorBracketMatch.border": "#ff79c6",
      },
    });
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    if (typeof onMount === "function") {
      onMount(editor, monaco);
    }
  };

  const defaultOptions = {
    minimap: { enabled: false },
    fontSize: 13.5,
    fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', monospace",
    lineNumbers: "on",
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    wordWrap: "on",
    readOnly: Boolean(readOnly),
    padding: { top: 12, bottom: 12 },
    cursorBlinking: "smooth",
    cursorSmoothCaretAnimation: "on",
    renderLineHighlight: "all",
    smoothScrolling: true,
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: "on",
    quickSuggestions: true,
    formatOnPaste: true,
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      bracketPairsHorizontal: true,
      indentation: true,
      highlightActiveBracketPair: true,
    },
    ...options,
  };

  return (
    <div className={`monaco-editor-shell ${className}`} style={{ height }}>
      <Editor
        height="100%"
        width="100%"
        language={monacoLang}
        value={value}
        beforeMount={handleBeforeMount}
        onMount={handleEditorDidMount}
        onChange={(val) => {
          if (typeof onChange === "function") {
            onChange(val || "");
          }
        }}
        theme={theme}
        options={defaultOptions}
        loading={
          <div className="monaco-editor-loading-placeholder">
            <span>Loading Monaco Code Editor...</span>
          </div>
        }
      />
    </div>
  );
}
