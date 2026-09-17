"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Eye,
  Edit,
  Save,
  FileText,
  BookOpen,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Link,
  FileCode,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownEditorProps {
  document?: {
    id: string;
    name: string;
    content?: string;
  } | null;
  isNewFile?: boolean;
  initialContent?: string;
  onClose: () => void;
  onSave: (name: string, content: string) => Promise<void>;
}

export default function MarkdownEditor({
  document,
  isNewFile = false,
  initialContent = "",
  onClose,
  onSave,
}: MarkdownEditorProps) {
  // Default to split view on desktop (sm breakpoint), edit view on mobile
  const [mode, setMode] = useState<"edit" | "preview" | "split">(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 640 ? "split" : "edit";
    }
    return "edit";
  });
  const [content, setContent] = useState(initialContent);
  const [fileName, setFileName] = useState(document?.name || "untitled.md");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load content for existing documents
  useEffect(() => {
    if (document?.id && !isNewFile) {
      setLoading(true);
      fetch(`/api/documents/${document.id}/content`)
        .then((res) => res.text())
        .then((text) => {
          setContent(text);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error loading markdown:", error);
          setLoading(false);
        });
    }
  }, [document?.id, isNewFile]);

  // Formatting helpers
  const insertFormatting = (
    before: string,
    after: string = "",
    placeholder: string = "text"
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const textToInsert = selectedText || placeholder;

    const newContent =
      content.substring(0, start) +
      before +
      textToInsert +
      after +
      content.substring(end);

    setContent(newContent);

    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Line-based formatting (headings, lists)
  const formatLines = (prefix: string, removeExisting: boolean = true) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Find the start of the first line and end of the last line
    const beforeCursor = content.substring(0, start);
    const afterCursor = content.substring(end);
    const lineStart = beforeCursor.lastIndexOf("\n") + 1;
    const lineEndIndex = content.indexOf("\n", end);
    const lineEnd = lineEndIndex === -1 ? content.length : lineEndIndex;

    // Get the selected lines
    const selectedLines = content.substring(lineStart, lineEnd);
    const lines = selectedLines.split("\n");

    // Process each line
    const processedLines = lines.map((line) => {
      // Remove existing list markers or headings if requested
      let cleanLine = line;
      if (removeExisting) {
        // Remove heading markers (# ## ###)
        cleanLine = line.replace(/^#+\s*/, "");
        // Remove list markers (-, *, 1., 2., etc)
        cleanLine = cleanLine.replace(/^[-*]\s+/, "");
        cleanLine = cleanLine.replace(/^\d+\.\s+/, "");
      }

      // Add new prefix (don't add to empty lines)
      return cleanLine.trim() ? prefix + cleanLine : cleanLine;
    });

    const newContent =
      content.substring(0, lineStart) +
      processedLines.join("\n") +
      content.substring(lineEnd);

    setContent(newContent);

    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      const newStart = lineStart;
      const newEnd = lineStart + processedLines.join("\n").length;
      textarea.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  const formatBold = () => insertFormatting("**", "**", "bold text");
  const formatItalic = () => insertFormatting("*", "*", "italic text");
  const formatHeading1 = () => formatLines("# ");
  const formatHeading2 = () => formatLines("## ");
  const formatHeading3 = () => formatLines("### ");
  const formatBulletList = () => formatLines("- ");
  const formatNumberedList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const beforeCursor = content.substring(0, start);
    const afterCursor = content.substring(end);
    const lineStart = beforeCursor.lastIndexOf("\n") + 1;
    const lineEndIndex = content.indexOf("\n", end);
    const lineEnd = lineEndIndex === -1 ? content.length : lineEndIndex;

    const selectedLines = content.substring(lineStart, lineEnd);
    const lines = selectedLines.split("\n");

    // Process each line with incrementing numbers
    const processedLines = lines.map((line, index) => {
      let cleanLine = line;
      // Remove existing markers
      cleanLine = line.replace(/^#+\s*/, "");
      cleanLine = cleanLine.replace(/^[-*]\s+/, "");
      cleanLine = cleanLine.replace(/^\d+\.\s+/, "");

      // Add numbered prefix (don't add to empty lines)
      return cleanLine.trim() ? `${index + 1}. ${cleanLine}` : cleanLine;
    });

    const newContent =
      content.substring(0, lineStart) +
      processedLines.join("\n") +
      content.substring(lineEnd);

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const newStart = lineStart;
      const newEnd = lineStart + processedLines.join("\n").length;
      textarea.setSelectionRange(newStart, newEnd);
    }, 0);
  };
  const formatCode = () => insertFormatting("`", "`", "code");
  const formatCodeBlock = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || "code here";

    const newContent =
      content.substring(0, start) +
      "```\n" +
      selectedText +
      "\n```" +
      content.substring(end);

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + 4; // Position after ```\n
      textarea.setSelectionRange(
        newCursorPos,
        newCursorPos + selectedText.length
      );
    }, 0);
  };
  const formatLink = () =>
    insertFormatting("[", "](https://example.com)", "link text");

  const handleSave = async () => {
    if (!fileName.trim()) {
      alert("Please enter a file name");
      return;
    }

    // Ensure .md extension
    const finalName = fileName.endsWith(".md") ? fileName : `${fileName}.md`;

    setSaving(true);
    try {
      await onSave(finalName, content);
      onClose();
    } catch (error) {
      console.error("Error saving markdown:", error);
      alert("Failed to save file");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
    // Ctrl/Cmd + B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === "b") {
      e.preventDefault();
      formatBold();
    }
    // Ctrl/Cmd + I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === "i") {
      e.preventDefault();
      formatItalic();
    }
    // Escape to close
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-7xl h-[95vh] sm:h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-dark-700">
          {/* Mobile: Two rows */}
          <div className="sm:hidden flex flex-col gap-3">
            {/* Row 1: Filename and Actions */}
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary-400 shrink-0" />
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="bg-dark-700 border border-dark-600 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 flex-1 min-w-0"
                placeholder="File name..."
                disabled={!isNewFile}
              />
            </div>

            {/* Row 2: All buttons - only show opposite mode button on mobile */}
            <div className="flex items-center gap-2">
              {/* Show Edit button only in preview mode, Preview button only in edit mode */}
              {mode === "preview" ? (
                <button
                  onClick={() => setMode("edit")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors bg-primary-600 text-white hover:bg-primary-700 flex-1 justify-center"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
              ) : (
                <button
                  onClick={() => setMode("preview")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors bg-dark-700 text-gray-400 hover:text-white hover:bg-dark-600 flex-1 justify-center"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </button>
              )}
              <button
                onClick={() => setShowManual(!showManual)}
                className="p-1.5 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition-colors shrink-0"
                title="Help"
              >
                <BookOpen className="h-4 w-4" />
              </button>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-xs flex items-center gap-1.5 shrink-0"
              >
                <Save className="h-4 w-4" />
                {saving ? "..." : "Save"}
              </button>
              <button
                onClick={onClose}
                className="px-2.5 py-1.5 bg-dark-700 hover:bg-dark-600 text-gray-300 font-medium rounded-lg transition-colors text-xs flex items-center gap-1 shrink-0"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>

          {/* Desktop: Single row */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary-400 shrink-0" />
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
                placeholder="File name..."
                disabled={!isNewFile}
              />
            </div>

            {/* View Mode Toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode("edit")}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                  mode === "edit"
                    ? "bg-primary-600 text-white"
                    : "bg-dark-700 text-gray-400 hover:text-white hover:bg-dark-600"
                }`}
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => setMode("split")}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                  mode === "split"
                    ? "bg-primary-600 text-white"
                    : "bg-dark-700 text-gray-400 hover:text-white hover:bg-dark-600"
                }`}
              >
                <FileText className="h-4 w-4" />
                Split
              </button>
              <button
                onClick={() => setMode("preview")}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                  mode === "preview"
                    ? "bg-primary-600 text-white"
                    : "bg-dark-700 text-gray-400 hover:text-white hover:bg-dark-600"
                }`}
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowManual(!showManual)}
                className="px-3 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 font-medium rounded-lg transition-colors text-sm flex items-center gap-2"
                title="Markdown Manual"
              >
                <BookOpen className="h-4 w-4" />
                Help
              </button>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={onClose}
                className="px-3 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 font-medium rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <p>Loading...</p>
            </div>
          ) : (
            <>
              {/* Editor */}
              {(mode === "edit" || mode === "split") && (
                <div
                  className={`${
                    mode === "split"
                      ? "w-1/2 border-r border-dark-700"
                      : "w-full"
                  } flex flex-col`}
                >
                  <div className="px-3 py-2 border-b border-dark-700 bg-dark-700/50 flex items-center justify-between gap-2 overflow-x-auto">
                    {/* Only show label in split mode, save space otherwise */}
                    {mode === "split" && (
                      <p className="text-xs text-gray-400 font-medium shrink-0">
                        MARKDOWN EDITOR
                      </p>
                    )}
                    {/* Formatting Toolbar - Show only essential buttons on mobile */}
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <button
                        onClick={formatBold}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-600 rounded transition-colors"
                        title="Bold (Ctrl+B)"
                      >
                        <Bold className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={formatItalic}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-600 rounded transition-colors"
                        title="Italic (Ctrl+I)"
                      >
                        <Italic className="h-3.5 w-3.5" />
                      </button>
                      <div className="w-px h-4 bg-dark-600 mx-0.5 sm:mx-1" />
                      <button
                        onClick={formatHeading1}
                        className="hidden sm:block p-1.5 text-gray-400 hover:text-white hover:bg-dark-600 rounded transition-colors"
                        title="Heading 1"
                      >
                        <Heading1 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={formatHeading2}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-600 rounded transition-colors"
                        title="Heading 2"
                      >
                        <Heading2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={formatHeading3}
                        className="hidden sm:block p-1.5 text-gray-400 hover:text-white hover:bg-dark-600 rounded transition-colors"
                        title="Heading 3"
                      >
                        <Heading3 className="h-3.5 w-3.5" />
                      </button>
                      <div className="w-px h-4 bg-dark-600 mx-0.5 sm:mx-1" />
                      <button
                        onClick={formatBulletList}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-600 rounded transition-colors"
                        title="Bullet List"
                      >
                        <List className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={formatNumberedList}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-600 rounded transition-colors"
                        title="Numbered List"
                      >
                        <ListOrdered className="h-3.5 w-3.5" />
                      </button>
                      <div className="w-px h-4 bg-dark-600 mx-1" />
                      <button
                        onClick={formatCode}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-600 rounded transition-colors"
                        title="Inline Code"
                      >
                        <Code className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={formatCodeBlock}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-600 rounded transition-colors"
                        title="Code Block"
                      >
                        <FileCode className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={formatLink}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-600 rounded transition-colors"
                        title="Insert Link"
                      >
                        <Link className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-dark-800 text-white p-4 font-mono text-sm focus:outline-none resize-none"
                    placeholder="# Start writing markdown..."
                    spellCheck={false}
                  />
                </div>
              )}

              {/* Preview */}
              {(mode === "preview" || mode === "split") && (
                <div
                  className={`${
                    mode === "split" ? "w-1/2" : "w-full"
                  } flex flex-col overflow-hidden`}
                >
                  {/* Only show label in split mode, save space otherwise */}
                  {mode === "split" && (
                    <div className="p-3 border-b border-dark-700 bg-dark-700/50">
                      <p className="text-xs text-gray-400 font-medium">
                        PREVIEW
                      </p>
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <div className="prose prose-invert prose-sm sm:prose-base max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content || "*No content to preview*"}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 sm:p-3 border-t border-dark-700 bg-dark-700/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <span>Lines: {content.split("\n").length}</span>
            <span>Chars: {content.length}</span>
            <span className="hidden sm:inline">
              Words: {content.trim().split(/\s+/).filter(Boolean).length}
            </span>
          </div>
          <div className="hidden sm:block">
            <span className="text-gray-500">Ctrl+S to save • Esc to close</span>
          </div>
        </div>
      </div>

      {/* Markdown Manual Modal */}
      {showManual && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60 p-2 sm:p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-3xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-dark-800 border-b border-dark-700 p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary-400" />
                <h3 className="text-lg font-semibold text-white">
                  Markdown Quick Reference
                </h3>
              </div>
              <button
                onClick={() => setShowManual(false)}
                className="p-1 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Introduction */}
              <div className="bg-primary-900/20 border border-primary-700/30 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-semibold text-primary-400">
                  Why Use Markdown?
                </h4>
                <ul className="text-sm text-gray-300 space-y-1.5 list-disc list-inside">
                  <li>
                    <strong>Plain text format</strong> - Works everywhere, never
                    gets corrupted, easy to version control
                  </li>
                  <li>
                    <strong>Human readable</strong> - Easy to read even without
                    rendering, unlike HTML or other markup languages
                  </li>
                  <li>
                    <strong>Fast to write</strong> - Focus on content, not
                    formatting. No need to use mouse or complex menus
                  </li>
                  <li>
                    <strong>Universal</strong> - Supported by GitHub, Discord,
                    Reddit, documentation sites, and thousands of apps
                  </li>
                  <li>
                    <strong>Future-proof</strong> - Will be readable decades
                    from now, unlike proprietary formats
                  </li>
                </ul>
              </div>

              {/* Headers */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary-400 uppercase tracking-wide">
                  Headers
                </h4>
                <div className="bg-dark-900 rounded-lg p-4 font-mono text-sm text-gray-300 space-y-1">
                  <div># Heading 1</div>
                  <div>## Heading 2</div>
                  <div>### Heading 3</div>
                  <div>#### Heading 4</div>
                </div>
              </div>

              {/* Emphasis */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary-400 uppercase tracking-wide">
                  Emphasis
                </h4>
                <div className="bg-dark-900 rounded-lg p-4 font-mono text-sm text-gray-300 space-y-1">
                  <div>**bold text** or __bold text__</div>
                  <div>*italic text* or _italic text_</div>
                  <div>~~strikethrough~~</div>
                  <div>***bold and italic***</div>
                </div>
              </div>

              {/* Lists */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary-400 uppercase tracking-wide">
                  Lists
                </h4>
                <div className="bg-dark-900 rounded-lg p-4 space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Unordered:</p>
                    <div className="font-mono text-sm text-gray-300 space-y-1">
                      <div>- Item 1</div>
                      <div>- Item 2</div>
                      <div className="pl-4">- Sub-item</div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Ordered:</p>
                    <div className="font-mono text-sm text-gray-300 space-y-1">
                      <div>1. First item</div>
                      <div>2. Second item</div>
                      <div className="pl-4">1. Sub-item</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary-400 uppercase tracking-wide">
                  Links & Images
                </h4>
                <div className="bg-dark-900 rounded-lg p-4 font-mono text-sm text-gray-300 space-y-1">
                  <div>[Link text](https://example.com)</div>
                  <div>[Link with title](https://example.com "Title")</div>
                  <div>![Image alt text](image-url.jpg)</div>
                </div>
              </div>

              {/* Code */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary-400 uppercase tracking-wide">
                  Code
                </h4>
                <div className="bg-dark-900 rounded-lg p-4 space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Inline code:</p>
                    <div className="font-mono text-sm text-gray-300">
                      Use `code` in your text
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Code block:</p>
                    <div className="font-mono text-sm text-gray-300 space-y-1">
                      <div>```javascript</div>
                      <div>function hello() {"{"}</div>
                      <div className="pl-4">console.log("Hello");</div>
                      <div>{"}"}</div>
                      <div>```</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Blockquotes */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary-400 uppercase tracking-wide">
                  Blockquotes
                </h4>
                <div className="bg-dark-900 rounded-lg p-4 font-mono text-sm text-gray-300 space-y-1">
                  <div>&gt; This is a quote</div>
                  <div>&gt; It can span multiple lines</div>
                </div>
              </div>

              {/* Tables */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary-400 uppercase tracking-wide">
                  Tables
                </h4>
                <div className="bg-dark-900 rounded-lg p-4 font-mono text-sm text-gray-300 space-y-1">
                  <div>| Column 1 | Column 2 |</div>
                  <div>|----------|----------|</div>
                  <div>| Cell 1 | Cell 2 |</div>
                  <div>| Cell 3 | Cell 4 |</div>
                </div>
              </div>

              {/* Horizontal Rule */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary-400 uppercase tracking-wide">
                  Horizontal Rule
                </h4>
                <div className="bg-dark-900 rounded-lg p-4 font-mono text-sm text-gray-300">
                  ---
                </div>
              </div>

              {/* Task Lists */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary-400 uppercase tracking-wide">
                  Task Lists
                </h4>
                <div className="bg-dark-900 rounded-lg p-4 font-mono text-sm text-gray-300 space-y-1">
                  <div>- [ ] Unchecked task</div>
                  <div>- [x] Checked task</div>
                </div>
              </div>

              {/* Official Spec Link */}
              <div className="mt-8 p-4 bg-dark-900/50 border border-dark-700 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">
                  Need more details? Check the official specification:
                </p>
                <a
                  href="https://www.markdownguide.org/basic-syntax/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300 text-sm underline flex items-center gap-2"
                >
                  Markdown Guide - Basic Syntax
                  <span className="text-xs">↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
