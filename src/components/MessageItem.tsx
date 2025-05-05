import React, {
  ReactNode,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { Image } from "@heroui/image";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Spinner } from "@heroui/react";
import { Textarea } from "@heroui/react";

import { Message } from "../types";

import SelectionPopup from "./SelectionPopup";
import SplitText from "./SplitText";

// Icons for the action buttons
const CopyIcon = (props: any) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path
      d="M16 12.9V17.1C16 20.6 14.6 22 11.1 22H6.9C3.4 22 2 20.6 2 17.1V12.9C2 9.4 3.4 8 6.9 8H11.1C14.6 8 16 9.4 16 12.9Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      d="M22 6.9V11.1C22 14.6 20.6 16 17.1 16H16V12.9C16 9.4 14.6 8 11.1 8H8V6.9C8 3.4 9.4 2 12.9 2H17.1C20.6 2 22 3.4 22 6.9Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
);

const EditIcon = (props: any) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path
      d="M11.4925 2.78906H7.75349C4.67849 2.78906 2.75049 4.96606 2.75049 8.04806V16.3621C2.75049 19.4441 4.66949 21.6211 7.75349 21.6211H16.5775C19.6625 21.6211 21.5815 19.4441 21.5815 16.3621V12.3341"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      clipRule="evenodd"
      d="M8.82812 10.921L16.3011 3.44799C17.2321 2.51799 18.7411 2.51799 19.6721 3.44799L20.8891 4.66499C21.8201 5.59599 21.8201 7.10599 20.8891 8.03599L13.3801 15.545C12.9731 15.952 12.4211 16.181 11.8451 16.181H8.09912L8.19312 12.401C8.20712 11.845 8.43412 11.315 8.82812 10.921Z"
      fillRule="evenodd"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      d="M15.1655 4.60254L19.7315 9.16854"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
);

const DeleteIcon = (props: any) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path
      d="M21.07 5.23C19.46 5.07 17.85 4.95 16.23 4.86V4.85L16.01 3.55C15.86 2.63 15.64 1.25 13.3 1.25H10.7C8.36 1.25 8.14 2.57 7.99 3.54L7.77 4.82C6.83 4.88 5.9 4.94 4.96 5.03L2.93 5.23C2.51 5.27 2.21 5.64 2.25 6.05C2.29 6.46 2.65 6.76 3.07 6.72L5.1 6.52C10.35 6 15.63 6.2 20.93 6.73H21.01C21.39 6.73 21.72 6.44 21.76 6.05C21.79 5.64 21.49 5.27 21.07 5.23Z"
      fill="currentColor"
    />
    <path
      d="M19.23 8.14C18.99 7.89 18.66 7.75 18.32 7.75H5.68C5.34 7.75 5 7.89 4.77 8.14C4.54 8.39 4.41 8.73 4.43 9.08L5.05 19.34C5.16 20.86 5.3 22.76 8.79 22.76H15.21C18.7 22.76 18.84 20.87 18.95 19.34L19.57 9.09C19.59 8.73 19.46 8.39 19.23 8.14ZM13.66 17.75H10.33C9.92 17.75 9.58 17.41 9.58 17C9.58 16.59 9.92 16.25 10.33 16.25H13.66C14.07 16.25 14.41 16.59 14.41 17C14.41 17.41 14.07 17.75 13.66 17.75ZM14.5 13.75H9.5C9.09 13.75 8.75 13.41 8.75 13C8.75 12.59 9.09 12.25 9.5 12.25H14.5C14.91 12.25 15.25 12.59 15.25 13C15.25 13.41 14.91 13.75 14.5 13.75Z"
      fill="currentColor"
    />
  </svg>
);

const RegenerateIcon = (props: any) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path
      d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      d="M15.97 12.4699L9.41998 12.4999"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      d="M12.7 9.3302L16 12.5002L12.7 15.6702"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
);

const renderMessageImages = (message: Message) => {
  if (Array.isArray(message.content)) {
    const images = message.content
      .filter((item) => item.type === "image_url")
      .map(
        (item, index) =>
          item.image_url && (
            <div key={`img-${index}`} className="message-image-container mb-4">
              <Image
                isBlurred
                isZoomed
                alt="Attached"
                className="w-full max-w-md object-cover rounded-xl"
                radius="md"
                src={item.image_url.url}
              />
            </div>
          ),
      );

    return images.length > 0 ? <div className="space-y-2">{images}</div> : null;
  }

  return null;
};

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  isEditing?: boolean;
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
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const messageRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // 當模型下拉選單打開時，獲取可用模型
  useEffect(() => {
    if (fetchModels && availableModels.length === 0 && !loadingModels) {
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
  }, [fetchModels, availableModels.length, loadingModels]);

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

  // Handle mouse up event to detect text selection
  const handleMouseUp = () => {
    if (isEditMode) return; // 編輯模式下不啟用文字選擇

    const selection = window.getSelection();

    // If there's a selection and it's not empty
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
      if (
        messageRef.current &&
        !messageRef.current.contains(event.target as Node)
      ) {
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
    }
  };

  // Function to render the message content with SplitText
  const processMessageContent = (): ReactNode => {
    if (isEditMode) {
      return (
        <div key="edit-container" className="edit-container w-full">
          <Textarea
            ref={textareaRef}
            fullWidth
            classNames={{
              input: "resize-y min-h-[120px] p-2",
              inputWrapper: "bg-default-100 dark:bg-default-50",
            }}
            maxRows={20}
            minRows={5}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
          />
          <div className="edit-buttons flex justify-end gap-2 mt-2">
            <Button color="primary" onClick={handleSave}>
              Save
            </Button>
            <Button variant="flat" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    if (message.isGeneratingImage) {
      return (
        <Card
          key="generating-image"
          className="generating-image-container p-4 text-center"
        >
          <div className="flex flex-col items-center justify-center">
            <Spinner className="mb-4" color="primary" size="lg" />
            <div className="generating-image-text">
              {typeof message.content === "string"
                ? message.content
                : "Creating your Image..."}
            </div>
          </div>
        </Card>
      );
    }

    if (message.isGeneratingCode) {
      return (
        <Card key="generating-code" className="generating-code-container p-4">
          <div className="generating-code-text text-default-500">
            {typeof message.content === "string"
              ? message.content
              : "Generating..."}
          </div>
          <div className="generating-code-hint text-primary text-sm mt-2">
            Response will be moved into Canvas
          </div>
        </Card>
      );
    }

    const messageContent = getMessageContentAsString();

    // 檢查是否為引用內容（以 > 開頭，允許多行）
    const isQuoteBlock =
      messageContent.trim().startsWith(">") ||
      messageContent.trim().startsWith("> ") ||
      messageContent.trim().startsWith(">\n") ||
      /^>/.test(messageContent.trim());
    if (isQuoteBlock) {
      return (
        <div className="italic text-default-500 flex items-center gap-1">
          <svg
            className="w-4 h-4 text-primary"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M7 17h8M7 13h8M9 9h6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          引用內容已隱藏
        </div>
      );
    }

    return (
      <SplitText
        animationFrom={{ opacity: 0, transform: "translate3d(0,50px,0)" }}
        animationTo={{ opacity: 1, transform: "translate3d(0,0,0)" }}
        className="text-foreground text-base whitespace-pre-line"
        delay={isStreaming ? 10 : 20} // 更快的動畫速度
        easing="easeOutCubic"
        rootMargin="-50px"
        text={messageContent}
        threshold={0.2}
      />
    );
  };

  // Handle "Ask GPT" button click
  const handleAskGpt = (text: string) => {
    if (onAskGpt) {
      onAskGpt(text);
      setShowSelectionPopup(false);
    }
  };

  // Define a bg color class based on the role
  const roleBgClass =
    message.role === "assistant"
      ? "bg-primary-50 dark:bg-primary-900/20"
      : "bg-default-50 dark:bg-default-100/10";

  // Helper for conditional rendering with proper TypeScript typing
  const renderConditional = (
    condition: boolean,
    element: JSX.Element | null,
  ) => {
    return condition ? element : null;
  };

  return (
    <Card
      ref={messageRef}
      className={`message mb-4 ${isStreaming ? "border-primary" : ""} ${isEditMode ? "border-warning" : ""}`}
      onMouseUp={handleMouseUp}
    >
      <div
        className={`message-header flex justify-between items-center p-2 px-4 ${roleBgClass} rounded-t-lg`}
      >
        <span className="role font-medium">
          {message.role === "assistant" ? "AI" : "You"}
        </span>
        <span className="timestamp text-default-400 text-sm">
          {message.timestamp.toLocaleTimeString()}
          {renderConditional(
            isStreaming && !message.isGeneratingImage,
            <span className="streaming-indicator ml-2 text-primary">
              <Spinner className="inline-block mr-1" size="sm" />
              typing...
            </span>,
          )}
        </span>
      </div>

      <div className="message-content p-4">
        {processMessageContent()}
        {renderConditional(
          isStreaming &&
            message.content === "" &&
            !message.isGeneratingImage &&
            !message.isGeneratingCode,
          <div className="typing-indicator flex justify-center">
            <Spinner color="primary" size="sm" />
          </div>,
        )}
        {/* Render images from message content array using HeroUI Image */}
        {Array.isArray(message.content) && renderMessageImages(message)}
        {/* Render legacy image URL if present using HeroUI Image */}
        {renderConditional(
          !!message.imageUrl,
          <div className="message-image-container mt-4">
            <Image
              isBlurred
              isZoomed
              alt="Generated"
              className="w-full max-w-md rounded-xl"
              radius="md"
              src={message.imageUrl || ""}
            />
          </div>,
        )}
      </div>

      {/* 消息操作按鈕 - 對於所有非流式傳輸的消息都顯示 */}
      {renderConditional(
        !isEditMode && !isStreaming,
        <div className="message-actions flex flex-wrap gap-2 p-2 px-4 border-t">
          <Button
            color={copySuccess ? "success" : "default"}
            size="sm"
            startContent={<CopyIcon />}
            variant="flat"
            onClick={handleCopy}
          >
            {copySuccess ? "Copied" : "Copy"}
          </Button>

          <Button
            size="sm"
            startContent={<EditIcon />}
            variant="flat"
            onClick={handleEdit}
          >
            Edit
          </Button>

          {/* 只對助手消息顯示刪除和重新生成按鈕 */}
          {renderConditional(
            message.role === "assistant",
            <>
              <Button
                color="danger"
                size="sm"
                startContent={<DeleteIcon />}
                variant="flat"
                onClick={handleDelete}
              >
                Delete
              </Button>

              <Dropdown>
                <DropdownTrigger>
                  <Button
                    color="secondary"
                    size="sm"
                    startContent={<RegenerateIcon />}
                    variant="flat"
                  >
                    Regenerate
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Regenerate options"
                  onAction={(key) => {
                    if (key === "current") {
                      handleRegenerate();
                    } else {
                      handleRegenerate(key.toString());
                    }
                  }}
                >
                  <DropdownItem key="current">
                    Current ({currentModel || "default"})
                  </DropdownItem>
                  <DropdownItem
                    key="divider"
                    className="h-px bg-default-200 dark:bg-default-100"
                  />

                  {renderConditional(
                    loadingModels || isLoadingModels,
                    <DropdownItem
                      key="loading"
                      isDisabled
                      startContent={<Spinner size="sm" />}
                    >
                      Loading models...
                    </DropdownItem>,
                  )}

                  {renderConditional(
                    availableModels.length > 0 &&
                      !loadingModels &&
                      !isLoadingModels,
                    <>
                      {availableModels
                        .filter((model) => model !== currentModel)
                        .map((model) => (
                          <DropdownItem key={model}>{model}</DropdownItem>
                        ))}
                    </>,
                  )}

                  {renderConditional(
                    !loadingModels &&
                      !isLoadingModels &&
                      availableModels.length === 0,
                    <DropdownItem key="no-models" isDisabled>
                      No other models available
                    </DropdownItem>,
                  )}
                </DropdownMenu>
              </Dropdown>
            </>,
          )}
        </div>,
      )}

      {renderConditional(
        showSelectionPopup,
        <SelectionPopup
          position={popupPosition}
          selectedText={selectedText}
          onAskGpt={handleAskGpt}
        />,
      )}
    </Card>
  );
};

export default MessageItem;
