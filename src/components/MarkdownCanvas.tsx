import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from "react";
import "@blocknote/core/fonts/inter.css";
// Import BlockNoteView directly to avoid TypeScript errors
import {
  BlockNoteView,
  darkDefaultTheme,
  lightDefaultTheme,
  Theme,
} from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
// Import these directly for TypeScript compatibility
import {
  BasicTextStyleButton,
  BlockTypeSelect,
  ColorStyleButton,
  CreateLinkButton,
  FormattingToolbar,
  FormattingToolbarController,
  NestBlockButton,
  TextAlignButton,
  UnnestBlockButton,
  useCreateBlockNote,
} from "@blocknote/react";
// Import codeBlock functionality
import { codeBlock } from "@blocknote/code-block";

import SelectionPopup from "./SelectionPopup";

// 自訂 BlockNote theme，顏色參考 tailwind 的 bg-background/text-foreground
const lightCanvasTheme = {
  colors: {
    editor: {
      text: "#18181b", // 或 '#18181b' (tailwind text-foreground)
      background: "#ffffff", // tailwind bg-background (light)
    },
    menu: {
      text: "#18181b",
      background: "#e5e7eb",
    },
    tooltip: {
      text: "#18181b",
      background: "#f1f5f9",
    },
    hovered: {
      text: "#18181b",
      background: "#e0e7ef",
    },
    selected: {
      text: "#18181b",
      background: "#cbd5e1",
    },
    disabled: {
      text: "#a1a1aa",
      background: "#e5e7eb",
    },
    shadow: "#cbd5e1",
    border: "#e5e7eb",
    sideMenu: "#f1f5f9",
    highlights: lightDefaultTheme.colors!.highlights,
  },
  borderRadius: 8,
  fontFamily: "inherit",
} satisfies Theme;

const darkCanvasTheme = {
  ...lightCanvasTheme,
  colors: {
    ...lightCanvasTheme.colors,
    editor: {
      text: "#f4f4f5", // tailwind text-foreground (dark)
      background: "#18181b", // tailwind bg-background (dark)
    },
    menu: {
      text: "#f4f4f5",
      background: "#27272a",
    },
    tooltip: {
      text: "#f4f4f5",
      background: "#27272a",
    },
    hovered: {
      text: "#f4f4f5",
      background: "#27272a",
    },
    selected: {
      text: "#f4f4f5",
      background: "#3f3f46",
    },
    disabled: {
      text: "#71717a",
      background: "#27272a",
    },
    shadow: "#18181b",
    border: "#27272a",
    sideMenu: "#18181b",
    highlights: darkDefaultTheme.colors!.highlights,
  },
} satisfies Theme;

const canvasTheme = {
  light: lightCanvasTheme,
  dark: darkCanvasTheme,
};

interface MarkdownCanvasProps {
  content: string;
  isOpen: boolean;
  onClose: () => void;
  onAskGpt?: (selectedText: string) => void;
  onSave?: (editedContent: string) => void;
  onGenerateTitle?: (
    codeContent: string,
    callback: (title: string) => void,
  ) => void; // 新增 onGenerateTitle prop
}

const MarkdownCanvas: React.FC<MarkdownCanvasProps> = ({
  content,
  isOpen,
  onClose,
  onAskGpt,
  onSave,
  onGenerateTitle,
}) => {
  // Create the editor instance with proper configuration
  const editor = useCreateBlockNote({
    // Add code block highlighting config
    codeBlock,
    // Providing a default block to avoid the "initialContent must be non-empty" error
    initialContent: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Loading...",
            styles: {}, // Add the required styles property
          },
        ],
      },
    ],
  });

  const [editMode, setEditMode] = useState(false);
  const [rawMarkdown, setRawMarkdown] = useState("");
  const [loadingEditor, setLoadingEditor] = useState(true);

  // 新增狀態來防止閃爍
  const [hasInitialContent, setHasInitialContent] = useState(false);
  const isFirstRender = useRef(true);
  const prevContentRef = useRef("");

  // Other existing states
  const canvasRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("Code Editor");
  const [codeLanguage, setCodeLanguage] = useState("plaintext");
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [contentFullyLoaded, setContentFullyLoaded] = useState(false);
  const [shouldGenerateTitle, setShouldGenerateTitle] = useState(false);
  const [hasClosingBackticks, setHasClosingBackticks] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Text selection state
  const [showSelectionPopup, setShowSelectionPopup] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  // 檢測是否正在流式傳輸內容 (streaming)
  const isStreaming = useCallback(
    (newContent: string, oldContent: string): boolean => {
      // 如果內容增量式增加，可能是streaming
      if (
        newContent.length > oldContent.length &&
        newContent.startsWith(oldContent)
      ) {
        return true;
      }

      return false;
    },
    [],
  );

  // 檢測是否存在結束標記（用於檢測完整代碼塊）
  const hasEndingBackticks = useCallback((text: string): boolean => {
    // 分析文本是否有結束的```
    const lines = text.split("\n");
    // 找到第一個```之後，再找是否有另一個```
    let foundFirst = false;

    for (const line of lines) {
      if (!foundFirst && line.trim().startsWith("```")) {
        foundFirst = true;
        continue;
      }

      if (foundFirst && line.trim() === "```") {
        return true;
      }
    }

    return false;
  }, []);

  // Toggle editor editability when edit mode changes
  useEffect(() => {
    if (editor) {
      // In newer versions of BlockNote, editable is a property not a method
      // We need to recreate the editor with new options
      editor._tiptapEditor.setEditable(editMode);
    }
  }, [editMode, editor]);

  // Convert code to BlockNote format and update editor
  useEffect(() => {
    // 檢查是否正在streaming
    const streaming = isStreaming(content, prevContentRef.current);

    prevContentRef.current = content;

    // 如果已經有內容且正在streaming，避免重新顯示loading狀態
    if (hasInitialContent && streaming) {
      // 對於streaming，我們不設置loading狀態，防止閃爍
      setLoadingEditor(false);
    } else if (isFirstRender.current || !streaming) {
      // 只有第一次渲染或非streaming時才顯示loading
      setLoadingEditor(true);
      isFirstRender.current = false;
    }

    // Try to extract language from code block
    const languageMatch = content.match(/^```([^\s\n]+)/);

    if (languageMatch && languageMatch[1]) {
      const detectedLanguage = languageMatch[1];

      setCodeLanguage(detectedLanguage);

      // Dynamically load language modules when detected
      // This is done without affecting the component rendering
      if (detectedLanguage !== "plaintext") {
        // Only try to load the language module if it's possibly a real programming language
        import("../utils/languageLoader.ts")
          .then((module) => {
            // This utility function would handle importing language-specific modules
            // But we won't block rendering on this
            if (module.loadLanguage) {
              module.loadLanguage(detectedLanguage).catch(() => {
                // Just log the error, don't crash if language module not found
                console.log(
                  `Optional language ${detectedLanguage} not available`,
                );
              });
            }
          })
          .catch(() => {
            // Silently fail if the language loader doesn't exist
            // This is fine as it's just an optimization
          });
      }
    } else {
      setCodeLanguage("plaintext");
    }

    // 檢查內容是否有結束的```標記
    const hasClosing = hasEndingBackticks(content);

    setHasClosingBackticks(hasClosing);

    // Clean the content by removing markdown code fence markers
    let cleanContent = content;

    // if cleanContent contains `markdown`, then do this
    if (cleanContent.includes("markdown")) {
      cleanContent = cleanContent.replace(/^```[\w-]*\s*\n/m, "");
      // 檢查是否以```結束並去除
      if (cleanContent.includes("\n```")) {
        cleanContent = cleanContent.replace(/\n```\s*$/m, "");
      }
    }

    // Update raw markdown for raw view mode
    setRawMarkdown(cleanContent);

    // Track if we should update the hasInitialContent state
    const shouldSetHasInitialContent =
      cleanContent.trim() !== "" && !hasInitialContent;

    // Update BlockNote editor content
    const importMarkdown = async () => {
      try {
        // 避免重複處理相同的內容
        if (cleanContent.trim() === "") return;

        // Convert markdown to BlockNote blocks
        const blocks = await editor.tryParseMarkdownToBlocks(cleanContent);

        // Make sure we have valid blocks before replacing
        if (blocks && blocks.length > 0) {
          editor.replaceBlocks(editor.document, blocks);
        }

        // 將狀態更新移出 useEffect 依賴循環
        if (shouldSetHasInitialContent) {
          // 使用函數形式的 setState 來避免依賴於當前狀態
          setHasInitialContent(true);
        }

        // 這些更新不依賴於 hasInitialContent
        setContentFullyLoaded(true);

        // 當有結束標記時才生成標題，但移出無限循環
        if (hasClosing && !shouldGenerateTitle) {
          setShouldGenerateTitle(true);
        }
      } catch (error) {
        console.error("Error parsing markdown to blocks:", error);
      } finally {
        // Only update loading state if we have content or already have initial content
        if (cleanContent.trim() !== "") {
          setLoadingEditor(false);
        }
      }
    };

    // 只有當內容發生變化時才執行導入
    importMarkdown();

    // 從依賴項中移除可能導致循環的狀態
  }, [content, editor, isStreaming, hasEndingBackticks]);

  // Reset copy success message after 2 seconds
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (copySuccess) {
      timeout = setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    }

    return () => clearTimeout(timeout);
  }, [copySuccess]);

  // Capture the scroll position when the editor is opened
  useEffect(() => {
    if (isOpen) {
      // Store the current scroll position
      setScrollPosition(window.scrollY || document.documentElement.scrollTop);
      // 只有當程式碼區塊完整時（有結束標記）才生成標題
      setShouldGenerateTitle(hasClosingBackticks);
    } else {
      // 關閉編輯器時重置狀態，確保下次打開时重新載入
      isFirstRender.current = true;
      setHasInitialContent(false);
    }
  }, [isOpen, hasClosingBackticks]);

  // Restore the scroll position when editor state changes
  useEffect(() => {
    if (isOpen) {
      // Use a small timeout to ensure the DOM has updated
      const timer = setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 10);

      return () => clearTimeout(timer);
    }
  }, [isOpen, editMode, scrollPosition]);

  // Listen for selection changes in the editor
  useEffect(() => {
    const handleSelection = () => {
      if (editMode) return;

      const selection = window.getSelection();

      // Check if there's a text selection
      if (
        selection &&
        !selection.isCollapsed &&
        selection.toString().trim() !== ""
      ) {
        const selectedContent = selection.toString();

        setSelectedText(selectedContent);

        // Calculate position for the popup
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setPopupPosition({
          top: rect.bottom + window.scrollY + 5,
          left: rect.left + window.scrollX + rect.width / 2 - 40,
        });

        setShowSelectionPopup(true);
      } else {
        setShowSelectionPopup(false);
      }
    };

    // Handle mouse up events for selection
    const handleMouseUp = () => {
      handleSelection();
    };

    document.addEventListener("mouseup", handleMouseUp);

    // Create a mutation observer to watch for selection changes
    const selectionObserver = new MutationObserver(() => {
      handleSelection();
    });

    // Observe the editor container
    const editorContainer = document.querySelector(".bn-container");

    if (editorContainer) {
      selectionObserver.observe(editorContainer, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => {
      selectionObserver.disconnect();
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [editor, editMode]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        previewRef.current &&
        !previewRef.current.contains(event.target as Node)
      ) {
        setShowSelectionPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get clean code content from the editor
  const getCleanCodeContent = useCallback(async (): Promise<string> => {
    try {
      const markdown = await editor.blocksToMarkdownLossy(editor.document);
      // Remove markdown fence if present
      let cleanContent = markdown;

      cleanContent = cleanContent.replace(/^```[\w-]*\s*\n/m, "");
      if (cleanContent.includes("\n```")) {
        cleanContent = cleanContent.replace(/\n```\s*$/m, "");
      }

      return cleanContent;
    } catch (error) {
      console.error("Error converting blocks to markdown:", error);

      return rawMarkdown;
    }
  }, [editor, rawMarkdown]);

  // --- 新增: 儲存與取消編輯 ---
  const handleStartEdit = () => {
    setEditMode(true);
  };
  const handleCancelEdit = () => {
    setEditMode(false);
  };
  const handleSaveEdit = async () => {
    if (onSave) {
      const markdown = await editor.blocksToMarkdownLossy(editor.document);

      onSave(markdown);
    }
    setEditMode(false);
  };

  // Copy code to clipboard
  const handleCopyCode = async () => {
    const cleanContent = await getCleanCodeContent();

    navigator.clipboard.writeText(cleanContent).then(
      () => {
        setCopySuccess(true);
      },
      () => {
        console.error("Failed to copy code");
      },
    );
  };

  // Handle "Ask GPT" button click
  const handleAskGpt = (text: string) => {
    if (onAskGpt) {
      onAskGpt(text);
      setShowSelectionPopup(false);
    }
  };

  // Effect for title generation based on shouldGenerateTitle flag
  useEffect(() => {
    if (
      shouldGenerateTitle &&
      contentFullyLoaded &&
      isOpen &&
      !isGeneratingTitle &&
      !loadingEditor &&
      hasClosingBackticks && // 只有当有結束標記時才生成標題
      onGenerateTitle // 确保有 onGenerateTitle 回调
    ) {
      setShouldGenerateTitle(false);
      setIsGeneratingTitle(true);

      // 直接调用 onGenerateTitle prop，并传递当前代码内容和一个回调函数
      onGenerateTitle(rawMarkdown, (generatedTitle) => {
        setTitle(generatedTitle);
        setIsGeneratingTitle(false);
      });
    }
  }, [
    shouldGenerateTitle,
    contentFullyLoaded,
    isOpen,
    isGeneratingTitle,
    loadingEditor,
    hasClosingBackticks,
    rawMarkdown,
    onGenerateTitle,
  ]);

  // Manual title generation function - update to use the prop directly
  const handleManualGenerateTitle = () => {
    if (hasClosingBackticks && onGenerateTitle) {
      setIsGeneratingTitle(true);

      // 直接调用 onGenerateTitle prop
      onGenerateTitle(rawMarkdown, (generatedTitle) => {
        setTitle(generatedTitle);
        setIsGeneratingTitle(false);
      });
    } else {
      console.log(
        "無法生成標題：代碼塊不完整（缺少結束標記```）或没有提供 onGenerateTitle 方法",
      );
      // 可以選擇顯示通知給用戶，告知需要完整的代碼塊
    }
  };

  // Handle close button click
  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  // 只有當編輯器真正加載中且沒有初始內容時才顯示加載指示器
  const showLoadingIndicator = loadingEditor && !hasInitialContent;

  return (
    <div
      ref={canvasRef}
      className="markdown-canvas bg-background text-foreground dark:bg-background h-full w-full"
    >
      <div className="markdown-header bg-default-100 dark:bg-zinc-900 border-b border-default-200 dark:border-default-700 p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            className={`close-button p-1 rounded-full hover:bg-default-200 dark:hover:bg-default-700 transition-colors text-foreground`}
            title="Close editor"
            onClick={handleClose}
          >
            <svg
              className="w-5 h-5 text-foreground"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M6 18L18 6M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h3 className="font-medium text-lg truncate max-w-[250px] text-foreground">
            {title}
          </h3>
          {codeLanguage !== "plaintext" && (
            <div className="language-badge px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs rounded-md">
              {codeLanguage}
            </div>
          )}
          <button
            className={`title-button ml-2 px-2 py-1 text-xs rounded-md flex items-center gap-1 ${
              isGeneratingTitle || !hasClosingBackticks
                ? "bg-default-200/50 dark:bg-default-700/50 text-default-500 dark:text-default-400 cursor-not-allowed"
                : "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800"
            }`}
            disabled={isGeneratingTitle || !hasClosingBackticks}
            title={
              !hasClosingBackticks
                ? "Waiting for the code block to be done."
                : "Generate AI title for this code"
            }
            onClick={handleManualGenerateTitle}
          >
            {isGeneratingTitle ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-t-primary-500 border-r-primary-500 border-b-primary-500 border-l-transparent rounded-full animate-spin mr-1" />
                Generating...
              </>
            ) : (
              <>
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    clipRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    fillRule="evenodd"
                  />
                </svg>
                AI Title
              </>
            )}
          </button>
          {/* Edit 按鈕：切換 editMode 狀態 */}
          {!editMode && (
            <button
              className={`edit-button ml-2 px-2 py-1 text-xs rounded-md flex items-center gap-1 transition-colors ${
                isGeneratingTitle || !hasClosingBackticks
                  ? "bg-default-200/50 dark:bg-default-700/50 text-default-500 dark:text-default-400 cursor-not-allowed"
                  : "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800"
              }`}
              disabled={isGeneratingTitle || !hasClosingBackticks}
              onClick={handleStartEdit}
            >
              <svg
                className="w-3 h-3 opacity-70"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h18"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M16.243 3.757a2.121 2.121 0 113 3L7.5 19.5 3 21l1.5-4.5L16.243 3.757z" />
              </svg>
              Edit
            </button>
          )}
          {/* 編輯狀態下顯示 Save/Cancel */}
          {editMode && (
            <>
              <button
                className="ml-2 px-2 py-1 text-xs rounded-md flex items-center gap-1 bg-success-200 dark:bg-success-700 hover:bg-success-300 dark:hover:bg-success-600 transition-colors"
                onClick={handleSaveEdit}
              >
                Save
              </button>
              <button
                className="ml-2 px-2 py-1 text-xs rounded-md flex items-center gap-1 bg-default-200 dark:bg-default-700 hover:bg-default-300 dark:hover:bg-default-600 transition-colors"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            </>
          )}
        </div>
        <div className="markdown-controls">
          <button
            className={`copy-button p-1.5 rounded-md hover:bg-default-200 dark:hover:bg-default-700 transition-colors text-foreground ${
              copySuccess ? "text-success" : ""
            }`}
            title={copySuccess ? "Copied!" : "Copy code"}
            onClick={handleCopyCode}
          >
            {copySuccess ? (
              <svg
                className="w-5 h-5 text-success"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  clipRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  fillRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-foreground"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect height="13" rx="2" ry="2" width="13" x="9" y="9" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div className="markdown-content h-[calc(100%-40px)] overflow-auto">
        {showLoadingIndicator ? (
          <div className="loading-editor flex items-center justify-center h-full text-default-500">
            <div className="flex flex-col items-center">
              <div className="spinner w-8 h-8 border-3 border-t-primary border-r-primary border-b-primary border-l-transparent rounded-full animate-spin mb-2" />
              <span>Loading Canvas...</span>
            </div>
          </div>
        ) : (
          <div ref={previewRef} className="blocknote-container h-full">
            <Suspense
              fallback={
                <div className="loading-editor flex items-center justify-center h-full text-default-500">
                  <div className="flex flex-col items-center">
                    <div className="spinner w-8 h-8 border-3 border-t-primary border-r-primary border-b-primary border-l-transparent rounded-full animate-spin mb-2" />
                    <span>Loading editor...</span>
                  </div>
                </div>
              }
            >
              <BlockNoteView
                editable={editMode}
                editor={editor}
                formattingToolbar={editMode}
                theme={canvasTheme}
              >
                <FormattingToolbarController
                  formattingToolbar={() => (
                    <FormattingToolbar>
                      <BlockTypeSelect key={"blockTypeSelect"} />
                      <BasicTextStyleButton
                        key={"boldStyleButton"}
                        basicTextStyle={"bold"}
                      />
                      <BasicTextStyleButton
                        key={"italicStyleButton"}
                        basicTextStyle={"italic"}
                      />
                      <BasicTextStyleButton
                        key={"underlineStyleButton"}
                        basicTextStyle={"underline"}
                      />
                      <BasicTextStyleButton
                        key={"strikeStyleButton"}
                        basicTextStyle={"strike"}
                      />
                      <BasicTextStyleButton
                        key={"codeStyleButton"}
                        basicTextStyle={"code"}
                      />
                      <TextAlignButton
                        key={"textAlignLeftButton"}
                        textAlignment={"left"}
                      />
                      <TextAlignButton
                        key={"textAlignCenterButton"}
                        textAlignment={"center"}
                      />
                      <TextAlignButton
                        key={"textAlignRightButton"}
                        textAlignment={"right"}
                      />
                      <ColorStyleButton key={"colorStyleButton"} />
                      <NestBlockButton key={"nestBlockButton"} />
                      <UnnestBlockButton key={"unnestBlockButton"} />
                      <CreateLinkButton key={"createLinkButton"} />
                    </FormattingToolbar>
                  )}
                />
              </BlockNoteView>
            </Suspense>
            {showSelectionPopup && (
              <SelectionPopup
                position={popupPosition}
                selectedText={selectedText}
                onAskGpt={handleAskGpt}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownCanvas;
