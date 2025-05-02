import React, { ReactNode, useState, useEffect, useRef, useCallback } from "react";
import { Message } from "../types";
import SelectionPopup from "./SelectionPopup";

// Import BlockNote components
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteEditor } from "@blocknote/core";

// 導入代碼塊高亮功能
import { codeBlock } from "@blocknote/code-block";

// 導入圖標
import copyCodeIcon from "../assets/icon/copy-code.svg";
import editCodeIcon from "../assets/icon/edit-code.svg";
import deleteIcon from "../assets/icon/delete.svg";
import regenerateIcon from "../assets/icon/regenerate.svg";

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  isEditing?: boolean;
  longestCodeBlockPosition?: { start: number; end: number } | null;
  toggleMarkdownCanvas: () => void;
  onAskGpt?: (selectedText: string) => void;
  onCopy?: (content: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onRegenerate?: (messageId: string, modelName?: string) => void;
  fetchModels?: () => Promise<string[]>;
  currentModel?: string;
  isLoadingModels?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isStreaming = false,
  isEditing = false,
  longestCodeBlockPosition = null,
  toggleMarkdownCanvas,
  onAskGpt,
  onCopy,
  onEdit,
  onDelete,
  onRegenerate,
  fetchModels,
  currentModel = "",
  isLoadingModels = false,
}) => {
  const [showSelectionPopup, setShowSelectionPopup] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [blockNoteEditor, setBlockNoteEditor] = useState<BlockNoteEditor | null>(null);
  const [isBlockNoteLoading, setIsBlockNoteLoading] = useState(true);

  // Keep track of streaming state to prevent flickering
  const [hasInitialContent, setHasInitialContent] = useState(false);
  const prevStreamingRef = useRef(isStreaming);

  const messageRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize a read-only editor for displaying content
  // Call useCreateBlockNote hook directly at the component level (not inside a callback)
  const editor = useCreateBlockNote({
    // 添加代碼高亮支持
    codeBlock,
    initialContent: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Loading...",
            styles: {},
          },
        ],
      },
    ],
  });

  // Store the editor instance
  useEffect(() => {
    setBlockNoteEditor(editor);
  }, [editor]);

  // Helper function to convert message content to string, wrapped in useCallback
  const getMessageContentAsString = useCallback((): string => {
    if (typeof message.content === "string") {
      return message.content;
    } else if (Array.isArray(message.content)) {
      // Join text parts from the message content array
      return message.content
        .filter((item) => item.type === "text")
        .map((item) => item.text)
        .filter(Boolean)
        .join("\n");
    }
    return "";
  }, [message.content]);

  // Update streaming state tracking
  useEffect(() => {
    // When we have content and we're streaming, mark that we have initial content
    if (isStreaming && getMessageContentAsString().trim() !== "") {
      setHasInitialContent(true);
    }

    // If streaming stops, reset our flag after a short delay
    if (!isStreaming && prevStreamingRef.current) {
      setTimeout(() => {
        setHasInitialContent(false);
      }, 500); // Small delay to avoid flickering when streaming ends
    }

    prevStreamingRef.current = isStreaming;
  }, [isStreaming, getMessageContentAsString]);

  // Update BlockNote editor content when message changes
  useEffect(() => {
    const updateEditor = async () => {
      if (!blockNoteEditor) return;

      // Get the content string
      const contentStr = getMessageContentAsString();
      const hasContent = contentStr.trim() !== "";

      // Only show loading initially or when not streaming
      // This prevents flickering during streaming
      if (!isStreaming && !isGeneratingContent()) {
        setIsBlockNoteLoading(true);
      }

      try {
        // Only update the editor if we have content
        if (hasContent) {
          const blocks = await blockNoteEditor.tryParseMarkdownToBlocks(contentStr);
          if (blocks && blocks.length > 0) {
            blockNoteEditor.replaceBlocks(blockNoteEditor.document, blocks);
          }

          // Only mark as not loading when we're not streaming or we have initial content
          if (!isStreaming || (isStreaming && hasInitialContent)) {
            setIsBlockNoteLoading(false);
          }
        }
      } catch (error) {
        console.error("Error parsing content to BlockNote format:", error);
        setIsBlockNoteLoading(false);
      }

      // Make editor read-only
      blockNoteEditor._tiptapEditor.setEditable(false);
    };

    // Check if we're in any special state that should prevent loading indicator
    function isGeneratingContent() {
      return message.isGeneratingImage || message.isGeneratingCode;
    }

    // Update the editor when message content changes
    if (!isEditMode && blockNoteEditor) {
      updateEditor();
    }
  }, [
    message.content,
    blockNoteEditor,
    getMessageContentAsString,
    isEditMode,
    isStreaming,
    hasInitialContent,
    message.isGeneratingImage,
    message.isGeneratingCode,
  ]);

  // 當模型下拉選單打開時，獲取可用模型
  useEffect(() => {
    if (showModelDropdown && fetchModels && !availableModels.length && !loadingModels) {
      setLoadingModels(true);
      fetchModels()
        .then((models) => {
          setAvailableModels(models);
        })
        .catch((err) => {
          console.error("獲取模型列表失敗:", err);
        })
        .finally(() => {
          setLoadingModels(false);
        });
    }
  }, [showModelDropdown, fetchModels, availableModels.length, loadingModels]);

  // 當進入編輯模式時，設置初始內容
  useEffect(() => {
    if (isEditMode) {
      setEditedContent(getMessageContentAsString());
      // 聚焦文本框並移動光標到末尾
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.selectionStart = textareaRef.current.value.length;
          textareaRef.current.selectionEnd = textareaRef.current.value.length;
        }
      }, 0);
    }
  }, [isEditMode, getMessageContentAsString]);

  // 處理點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle mouse up event to detect text selection
  const handleMouseUp = () => {
    if (isEditMode) return; // 編輯模式下不啟用文字選擇

    const selection = window.getSelection();
    // If there's a selection and it's not empty
    if (selection && !selection.isCollapsed && selection.toString().trim() !== "") {
      const selectedContent = selection.toString();
      setSelectedText(selectedContent);
      // Calculate position for the popup
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setPopupPosition({
        top: rect.bottom + window.scrollY + 5, // Position below the selection with a small gap
        left: rect.left + window.scrollX + rect.width / 2 - 40, // Center the popup
      });
      setShowSelectionPopup(true);
    } else {
      setShowSelectionPopup(false);
    }
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setShowSelectionPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 處理複製按鈕點擊事件
  const handleCopy = () => {
    const contentToCopy = getMessageContentAsString();

    if (onCopy) {
      onCopy(contentToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } else {
      // 備用方案：直接使用 clipboard API
      navigator.clipboard.writeText(contentToCopy).then(
        () => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        },
        (err) => {
          console.error("無法複製內容: ", err);
        },
      );
    }
  };

  // 處理編輯按鈕點擊事件
  const handleEdit = () => {
    setIsEditMode(true);
  };

  // 處理保存按鈕點擊事件
  const handleSave = () => {
    if (onEdit && editedContent.trim() !== "") {
      onEdit(message.id, editedContent);
    }
    setIsEditMode(false);

    // 如果是用戶消息，編輯後自動重新生成回應
    if (message.role === "user" && onRegenerate) {
      onRegenerate(message.id);
    }
  };

  // 處理取消按鈕點擊事件
  const handleCancel = () => {
    setIsEditMode(false);
    setEditedContent(getMessageContentAsString());
  };

  // 處理刪除按鈕點擊事件
  const handleDelete = () => {
    if (onDelete) {
      onDelete(message.id);
    }
  };

  // 處理重新生成按鈕點擊事件
  const handleRegenerate = (modelName?: string) => {
    if (onRegenerate) {
      onRegenerate(message.id, modelName);
      setShowModelDropdown(false);
    }
  };

  // 切換模型下拉選單
  const toggleModelDropdown = () => {
    setShowModelDropdown(!showModelDropdown);
  };

  // Function to render images from MessageContent array
  const renderMessageImages = () => {
    if (Array.isArray(message.content)) {
      return message.content
        .filter((item) => item.type === "image_url")
        .map(
          (item, index) =>
            item.image_url && (
              <div key={`img-${index}`} className='message-image-container'>
                <img src={item.image_url.url} alt='Attached' className='message-image' />
              </div>
            ),
        );
    }
    return null;
  };

  // Function to render the message content with BlockNote or fallback options
  const processMessageContent = (): ReactNode => {
    // 如果處於編輯模式，渲染文本編輯區
    if (isEditMode) {
      return (
        <div key='edit-container' className='edit-container'>
          <textarea
            ref={textareaRef}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className='edit-textarea'
            rows={Math.max(5, editedContent.split("\n").length)}
          />
          <div className='edit-buttons'>
            <button onClick={handleSave} className='edit-save-button'>
              Send
            </button>
            <button onClick={handleCancel} className='edit-cancel-button'>
              Cancel
            </button>
          </div>
        </div>
      );
    }

    // 如果正在生成圖像，顯示動態加載效果
    if (message.isGeneratingImage) {
      return (
        <div key='generating-image' className='generating-image-container'>
          <div className='generating-image-animation'>
            <div className='brush-stroke'></div>
            <div className='brush-stroke'></div>
            <div className='brush-stroke'></div>
          </div>
          <div className='generating-image-text'>
            {typeof message.content === "string" ? message.content : "Creating your Image..."}
          </div>
        </div>
      );
    }

    // 如果正在生成代碼，顯示靜態占位符，防止內容跳動
    if (message.isGeneratingCode) {
      return (
        <div key='generating-code' className='generating-code-container'>
          <div className='generating-code-text'>
            {typeof message.content === "string" ? message.content : "Generating..."}
          </div>
          <div className='generating-code-hint'>Response will be moved into Canvas</div>
        </div>
      );
    }

    // For streaming content, once we have initial content, always show the editor
    // This prevents flickering during streaming updates
    if (isStreaming && hasInitialContent && blockNoteEditor) {
      return (
        <div className='blocknote-message-container'>
          <BlockNoteView
            editor={blockNoteEditor}
            theme='dark'
            editable={false}
            formattingToolbar={false}
          />
        </div>
      );
    }

    // If this is normal (non-streaming) content, use BlockNote for formatting
    if (blockNoteEditor && !isBlockNoteLoading) {
      return (
        <div className='blocknote-message-container'>
          <BlockNoteView
            editor={blockNoteEditor}
            theme='dark'
            editable={false}
            formattingToolbar={false}
          />
        </div>
      );
    }

    // Only show loading indicator if we're not streaming or we don't have content yet
    if (isBlockNoteLoading && (!isStreaming || !hasInitialContent)) {
      return <div className='message-loading'>Loading content...</div>;
    }

    // Fallback to original rendering if BlockNote isn't available
    const messageContent = getMessageContentAsString();
    return (
      <div className='message-text-fallback'>
        {messageContent.split("\n").map((line, i) => (
          <div key={i}>{line || <br />}</div>
        ))}
      </div>
    );
  };

  // Handle "Ask GPT" button click
  const handleAskGpt = (text: string) => {
    if (onAskGpt) {
      onAskGpt(text);
      setShowSelectionPopup(false);
    }
  };

  return (
    <div
      ref={messageRef}
      className={`message ${message.role} ${
        isStreaming ? "streaming" : ""
      } ${isEditMode ? "editing" : ""}`}
      onMouseUp={handleMouseUp}
    >
      <div className='message-header'>
        <span className='role'>{message.role === "assistant" ? "AI" : "You"}</span>
        <span className='timestamp'>
          {message.timestamp.toLocaleTimeString()}
          {isStreaming && !message.isGeneratingImage && (
            <span className='streaming-indicator'> (typing...)</span>
          )}
        </span>
      </div>

      <div className='message-content'>
        {processMessageContent()}
        {isStreaming &&
          message.content === "" &&
          !message.isGeneratingImage &&
          !message.isGeneratingCode && <div className='typing-indicator'>...</div>}
        {/* Render images from message content array */}
        {Array.isArray(message.content) && renderMessageImages()}
        {/* Render legacy image URL if present */}
        {message.imageUrl && (
          <div className='message-image-container'>
            <img src={message.imageUrl} alt='Generated' className='message-image' />
          </div>
        )}
      </div>

      {/* 消息操作按鈕 - 對於所有非流式傳輸的消息都顯示 */}
      {!isEditMode && !isStreaming && (
        <div className='message-actions'>
          <button
            onClick={handleCopy}
            className={`action-button with-icon ${copySuccess ? "copy-success" : ""}`}
            title='Copy to clipboard'
          >
            <img src={copyCodeIcon} alt='Copy' className='icon-action' />
            {copySuccess ? "Copied" : "Copy"}
          </button>

          <button onClick={handleEdit} className='action-button with-icon' title='Edit message'>
            <img src={editCodeIcon} alt='Edit' className='icon-action' />
            Edit
          </button>

          {/* 只對助手消息顯示刪除和重新生成按鈕 */}
          {message.role === "assistant" && (
            <>
              <button
                onClick={handleDelete}
                className='action-button with-icon'
                title='Delete message'
              >
                <img src={deleteIcon} alt='Delete' className='icon-action' />
                Delete
              </button>

              <div className='regenerate-dropdown-container' ref={dropdownRef}>
                <button
                  onClick={toggleModelDropdown}
                  className='action-button with-icon regenerate-button'
                  title='Regenerate response'
                >
                  <img src={regenerateIcon} alt='Regenerate' className='icon-action' />
                  Regenerate {showModelDropdown ? "▲" : "▼"}
                </button>

                {showModelDropdown && (
                  <div className='model-dropdown'>
                    <div className='model-dropdown-header'>Choose model:</div>

                    {/* 當前模型選項 */}
                    <div className='model-dropdown-item' onClick={() => handleRegenerate()}>
                      Current ({currentModel || "default"})
                    </div>

                    {/* 載入提示 */}
                    {(loadingModels || isLoadingModels) && (
                      <div className='model-dropdown-item loading'>Loading models...</div>
                    )}

                    {/* 可用模型列表 */}
                    {availableModels.length > 0 &&
                      !loadingModels &&
                      !isLoadingModels &&
                      availableModels
                        .filter((model) => model !== currentModel) // 過濾掉當前模型
                        .map((model) => (
                          <div
                            key={model}
                            className='model-dropdown-item'
                            onClick={() => handleRegenerate(model)}
                          >
                            {model}
                          </div>
                        ))}

                    {/* 沒有模型時顯示提示 */}
                    {!loadingModels && !isLoadingModels && availableModels.length === 0 && (
                      <div className='model-dropdown-item no-models'>
                        No other models available
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {showSelectionPopup && (
        <SelectionPopup
          position={popupPosition}
          selectedText={selectedText}
          onAskGpt={handleAskGpt}
        />
      )}
    </div>
  );
};

export default MessageItem;
