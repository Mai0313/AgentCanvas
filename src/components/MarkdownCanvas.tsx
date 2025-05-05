import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from "react";
import "@blocknote/core/fonts/inter.css";
// Import BlockNoteView directly to avoid TypeScript errors
import { BlockNoteView } from "@blocknote/mantine";
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

import { Message, ModelSetting } from "../types";
import { getDefaultModelSettings } from "../utils/modelUtils";
import { chatCompletion } from "../services/openai";
import closeIcon from "../assets/icon/close-icon.svg";
import copyCodeIcon from "../assets/icon/copy-code.svg";
import editCodeIcon from "../assets/icon/edit-code.svg";

import SelectionPopup from "./SelectionPopup";

interface MarkdownCanvasProps {
  content: string;
  isOpen: boolean;
  onClose: () => void;
  onAskGpt?: (selectedText: string) => void;
  onSave?: (editedContent: string) => void;
  modelSettings?: ModelSetting;
}

const MarkdownCanvas: React.FC<MarkdownCanvasProps> = ({
  content,
  isOpen,
  onClose,
  onAskGpt,
  modelSettings,
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

  const [editMode] = useState(false);
  const [rawMarkdown, setRawMarkdown] = useState("");
  const [isRawView, setIsRawView] = useState(false);
  const [loadingEditor, setLoadingEditor] = useState(true);

  // 新增狀態來防止閃爍
  const [hasInitialContent, setHasInitialContent] = useState(false);
  const isFirstRender = useRef(true);
  const prevContentRef = useRef("");

  // Other existing states
  const canvasRef = useRef<HTMLDivElement>(null);
  const rawEditorRef = useRef<HTMLTextAreaElement>(null);
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
      if (isRawView || editMode) return;

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
  }, [editor, isRawView, editMode]);

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
    if (isRawView) {
      return rawMarkdown;
    }

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
  }, [editor, isRawView, rawMarkdown]);

  // Handle raw markdown changes in textarea
  const handleRawMarkdownChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const newContent = e.target.value;

    setRawMarkdown(newContent);

    // 檢查原始編輯模式中是否有完整的代碼塊
    // 我們將原始文本包裝在代碼標記中進行檢查
    const wrappedContent = `\`\`\`${codeLanguage}\n${newContent}\n\`\`\``;
    const hasClosing = hasEndingBackticks(wrappedContent);

    setHasClosingBackticks(hasClosing);
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

  // Toggle raw view
  const toggleRawView = () => {
    if (!isRawView) {
      // Get current content as markdown before switching to raw view
      editor.blocksToMarkdownLossy(editor.document).then((markdown) => {
        let cleanContent = markdown;

        setRawMarkdown(cleanContent);
        setIsRawView(true);
      });
    } else {
      setIsRawView(false);

      // Update the editor with the raw markdown
      const updateFromRaw = async () => {
        try {
          const blocks = await editor.tryParseMarkdownToBlocks(rawMarkdown);

          editor.replaceBlocks(editor.document, blocks);

          // 檢查轉換後的內容是否有完整代碼塊
          const hasClosing = hasEndingBackticks(rawMarkdown);

          setHasClosingBackticks(hasClosing);
        } catch (error) {
          console.error("Error updating from raw markdown:", error);
        }
      };

      updateFromRaw();
    }
  };

  // Generate title for the code snippet
  const generateTitle = useCallback(async () => {
    // 只有當編輯器載入完成且代碼塊完整時才生成標題
    if (loadingEditor || !hasClosingBackticks) return;

    const cleanContent = await getCleanCodeContent();

    if (!cleanContent.trim()) return;

    setIsGeneratingTitle(true);
    console.log("Generating title via Chat Completion API");

    try {
      // Use the user's current model settings or fall back to default if not provided
      const settings = modelSettings || getDefaultModelSettings();

      const messages: Message[] = [
        {
          id: "system-msg",
          role: "system",
          content:
            "You are an assistant that helps name code snippets concisely.",
          timestamp: new Date(),
        },
        {
          id: "user-msg",
          role: "user",
          content: `Given this code snippet, provide a short, descriptive title (3-5 words) that describes what the code does. Don't include words like "code", "function", "class", etc. Just give the title directly:\n\n${cleanContent}`,
          timestamp: new Date(),
        },
      ];

      let generatedTitle = "";

      await chatCompletion(messages, settings, (token) => {
        generatedTitle += token;
      });

      // Clean up the title (remove quotes if present)
      generatedTitle = generatedTitle.replace(/^["']|["']$/g, "").trim();
      if (generatedTitle) {
        setTitle(generatedTitle);
      }
    } catch (error) {
      console.error("Error generating title:", error);
    } finally {
      setIsGeneratingTitle(false);
      setShouldGenerateTitle(false);
    }
  }, [getCleanCodeContent, loadingEditor, hasClosingBackticks, modelSettings]);

  // Effect for title generation based on shouldGenerateTitle flag
  useEffect(() => {
    if (
      shouldGenerateTitle &&
      contentFullyLoaded &&
      isOpen &&
      !isGeneratingTitle &&
      !loadingEditor &&
      hasClosingBackticks // 只有當有結束標記時才生成標題
    ) {
      const titleTimer = setTimeout(() => {
        generateTitle();
      }, 100);

      return () => clearTimeout(titleTimer);
    }
  }, [
    shouldGenerateTitle,
    contentFullyLoaded,
    isOpen,
    isGeneratingTitle,
    generateTitle,
    loadingEditor,
    hasClosingBackticks,
  ]);

  // Manual title generation function
  const handleManualGenerateTitle = () => {
    if (hasClosingBackticks) {
      setShouldGenerateTitle(true);
    } else {
      console.log("無法生成標題：代碼塊不完整（缺少結束標記```）");
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
    <div ref={canvasRef} className="markdown-canvas">
      <div className="markdown-header bg-default-100 dark:bg-default-800 border-b border-default-200 dark:border-default-700 p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            className="close-button p-1 rounded-full hover:bg-default-200 dark:hover:bg-default-700 transition-colors"
            title="Close editor"
            onClick={handleClose}
          >
            <img alt="Close" className="w-5 h-5" src={closeIcon} />
          </button>
          <h3 className="font-medium text-lg truncate max-w-[250px]">{title}</h3>
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
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path clipRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" fillRule="evenodd" />
                </svg>
                AI Title
              </>
            )}
          </button>
          <button
            className="edit-button ml-2 px-2 py-1 text-xs rounded-md flex items-center gap-1 bg-default-200 dark:bg-default-700 hover:bg-default-300 dark:hover:bg-default-600 transition-colors"
            onClick={toggleRawView}
          >
            <img alt="Edit" className="w-3 h-3 opacity-70" src={editCodeIcon} />
            {isRawView ? "Save" : "Edit"}
          </button>
        </div>
        <div className="markdown-controls">
          <button
            className={`copy-button p-1.5 rounded-md hover:bg-default-200 dark:hover:bg-default-700 transition-colors ${copySuccess ? "text-success" : ""}`}
            title={copySuccess ? "Copied!" : "Copy code"}
            onClick={handleCopyCode}
          >
            {copySuccess ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd" />
              </svg>
            ) : (
              <img alt="Copy" className="w-5 h-5" src={copyCodeIcon} />
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
        ) : isRawView ? (
          <textarea
            ref={rawEditorRef}
            className="markdown-editor w-full h-full p-4 bg-default-50 dark:bg-default-900 font-mono text-sm resize-none focus:outline-none"
            value={rawMarkdown}
            wrap="off"
            onChange={handleRawMarkdownChange}
          />
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
                formattingToolbar={false}
                theme="dark"
              >
                <FormattingToolbarController
                  formattingToolbar={() => (
                    <FormattingToolbar>
                      <BlockTypeSelect key={"blockTypeSelect"} />
                      <BasicTextStyleButton key={"boldStyleButton"} basicTextStyle={"bold"} />
                      <BasicTextStyleButton key={"italicStyleButton"} basicTextStyle={"italic"} />
                      <BasicTextStyleButton key={"underlineStyleButton"} basicTextStyle={"underline"} />
                      <BasicTextStyleButton key={"strikeStyleButton"} basicTextStyle={"strike"} />
                      <BasicTextStyleButton key={"codeStyleButton"} basicTextStyle={"code"} />
                      <TextAlignButton key={"textAlignLeftButton"} textAlignment={"left"} />
                      <TextAlignButton key={"textAlignCenterButton"} textAlignment={"center"} />
                      <TextAlignButton key={"textAlignRightButton"} textAlignment={"right"} />
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
