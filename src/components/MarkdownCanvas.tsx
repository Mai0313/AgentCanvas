import React, { useState, useEffect, useRef, useCallback } from "react";

import { Message } from "../types";
import { getDefaultModelSettings } from "../utils/modelUtils";
import { chatCompletion } from "../services/openai";

// Import BlockNote components and styles
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
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

// 導入代碼塊高亮功能
import { codeBlock } from "@blocknote/code-block";

// 導入圖標
import closeIcon from "../assets/icon/close-icon.svg";
import copyCodeIcon from "../assets/icon/copy-code.svg";
import editCodeIcon from "../assets/icon/edit-code.svg";

import SelectionPopup from "./SelectionPopup";

interface MarkdownCanvasProps {
  content: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
  onAskGpt?: (selectedText: string) => void;
}

const MarkdownCanvas: React.FC<MarkdownCanvasProps> = ({
  content,
  isOpen,
  onClose,
  onSave,
  onAskGpt,
}) => {
  // Create the editor instance with proper configuration
  // Call useCreateBlockNote directly at the component level (not inside a callback)
  const editor = useCreateBlockNote({
    // 添加代碼塊高亮配置
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
      setCodeLanguage(languageMatch[1]);
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
        // Convert markdown to BlockNote blocks
        const blocks = await editor.tryParseMarkdownToBlocks(cleanContent);

        // Make sure we have valid blocks before replacing
        if (blocks && blocks.length > 0) {
          editor.replaceBlocks(editor.document, blocks);
        }

        // Batch our state updates to avoid the infinite loop
        // Only update hasInitialContent if needed and not already done
        if (shouldSetHasInitialContent) {
          setHasInitialContent(true);
        }

        // These updates don't depend on hasInitialContent
        setContentFullyLoaded(true);

        // 當有結束標記時才生成標題
        if (hasClosing) {
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

    importMarkdown();
    // 添加 hasInitialContent 到依賴數組，但使用條件檢查來避免無限循環
  }, [content, editor, isStreaming, hasEndingBackticks, hasInitialContent]);

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
      // Default settings for the API call with specific model for title generation
      const settings = getDefaultModelSettings("gpt-4o-mini");

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
  }, [getCleanCodeContent, loadingEditor, hasClosingBackticks]);

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
      <div className="markdown-header">
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            className="close-button"
            title="Close editor"
            onClick={handleClose}
          >
            <img alt="Close" height="24" src={closeIcon} width="24" />
          </button>
          <h3>{title}</h3>
          <div className="language-badge">
            {codeLanguage !== "plaintext" && codeLanguage}
          </div>
          <button
            className="title-button"
            disabled={isGeneratingTitle || !hasClosingBackticks}
            title={
              !hasClosingBackticks
                ? "Waiting for the code block to be done."
                : ""
            }
            onClick={handleManualGenerateTitle}
          >
            {isGeneratingTitle ? "Generating..." : "AI Title"}
          </button>
          <button
            className="title-button"
            style={{ marginLeft: "8px" }}
            onClick={toggleRawView}
          >
            <img alt="Edit" height="8" src={editCodeIcon} width="8" />
            {isRawView ? "Save" : "Edit"}
          </button>
        </div>
        <div className="markdown-controls">
          <button
            className={`icon-button ${copySuccess ? "success" : ""}`}
            title={copySuccess ? "Copied" : "Copy"}
            onClick={handleCopyCode}
          >
            <img alt="Copy" height="24" src={copyCodeIcon} width="24" />
          </button>
        </div>
      </div>

      <div className="markdown-content">
        {showLoadingIndicator ? (
          <div className="loading-editor">Loading Canvas...</div>
        ) : isRawView ? (
          <textarea
            ref={rawEditorRef}
            className="markdown-editor"
            value={rawMarkdown}
            wrap="off"
            onChange={handleRawMarkdownChange}
          />
        ) : (
          <div
            ref={previewRef}
            className="blocknote-container"
            style={{ height: "100%" }}
          >
            {/* Switch to BlockNoteView from Mantine with proper formatting toolbar */}
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
