import { useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";

import DefaultLayout from "@/layouts/default";
import ChatBox from "@/components/ChatBox";
import MarkdownCanvas from "@/components/MarkdownCanvas";
import { Message, ModelSetting, MessageContent } from "@/types";
import { fetchModels, detectTaskType } from "@/services/openai";
import {
  extractLongestCodeBlock,
  detectInProgressCodeBlock,
} from "@/utils/markdownUtils";
import { getDefaultModelSettings } from "@/utils/modelUtils";
import {
  copyMessage,
  editMessage,
  deleteMessage,
  regenerateMessage,
  handleImageGeneration,
  handleStandardChatMode,
} from "@/utils/messageHandlers";
import {
  openMarkdownCanvas,
  closeMarkdownCanvas,
  saveMarkdownContent,
  handleCanvasMode,
} from "@/utils/canvasHandlers";
import {
  setupResizeEventHandlers,
  setupMarkdownResizer,
} from "@/utils/layoutHandlers";

// Import HeroUI components

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [settings, setSettings] = useState<ModelSetting>(
    getDefaultModelSettings(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string>(uuidv4());

  // Markdown canvas state for BlockNote editor
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [isMarkdownCanvasOpen, setIsMarkdownCanvasOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );

  // State to track code block position
  const [codeBlockPosition, setCodeBlockPosition] = useState<{
    start: number;
    end: number;
  } | null>(null);

  // Resizable layout states
  const [markdownWidth, setMarkdownWidth] = useState(40); // Default 40% width for markdown
  const [isResizingMarkdown, setIsResizingMarkdown] = useState(false);

  // Refs for resizable elements
  const appContainerRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const markdownResizerRef = useRef<HTMLDivElement>(null);

  // Model states
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);

  // Handle text selection from both chat and markdown canvas
  const handleAskGpt = (selectedText: string) => {
    // 創建一個自定義事件來傳遞選中的文字
    const event = new CustomEvent("setQuotedText", {
      detail: { quotedText: selectedText },
    });

    document.dispatchEvent(event);

    // Focus the chat input field
    const chatInputElement = document.querySelector(
      ".chat-input-form textarea",
    ) as HTMLTextAreaElement;

    if (chatInputElement) {
      chatInputElement.focus();
    }

    // Close markdown canvas if it's open
    if (isMarkdownCanvasOpen) {
      handleCloseMarkdownCanvas();
    }
  };

  // 處理消息複製 - 使用新模組
  const handleCopyMessage = (content: string) => {
    copyMessage(content, setError);
  };

  // 處理消息編輯 - 使用新模組
  const handleEditMessage = (messageId: string, newContent: string) => {
    editMessage(messageId, newContent, setMessages);
  };

  // 處理消息刪除 - 使用新模組
  const handleDeleteMessage = (messageId: string) => {
    deleteMessage(messageId, setMessages);
  };

  // 處理消息重新生成 - 使用新模組
  const handleRegenerateMessage = async (
    messageId: string,
    modelName?: string,
  ) => {
    await regenerateMessage(
      messageId,
      modelName,
      messages,
      settings,
      setMessages,
      setStreamingMessageId,
      setIsLoading,
      setError,
    );
  };

  // 從 API 獲取可用模型
  const getAvailableModels = async () => {
    if (!settings.apiKey || !settings.baseUrl) {
      // 如果沒有設置 API 密鑰或基礎 URL，則返回預設模型列表
      return ["gpt-4o"];
    }

    setIsLoadingModels(true);
    try {
      const models = await fetchModels(settings, {
        onStart: () => setIsLoadingModels(true),
        onSuccess: (data) => {
          const modelIds = data.map((model) => model.id);

          setAvailableModels(modelIds);
        },
        onError: (error) => {
          console.error("Failed to fetch models:", error);
          // 失敗时使用預設模型列表
          setAvailableModels(["gpt-4o"]);
        },
        onComplete: () => setIsLoadingModels(false),
      });

      return models ? models.map((model) => model.id) : availableModels;
    } catch (error) {
      console.error("Error fetching models:", error);
      setIsLoadingModels(false);

      return availableModels;
    }
  };

  // Setup markdown resizer - 使用新模組
  useEffect(() => {
    const cleanupMarkdownResizer = setupMarkdownResizer(
      markdownResizerRef,
      isMarkdownCanvasOpen,
      setIsResizingMarkdown,
    );

    return cleanupMarkdownResizer;
  }, [isMarkdownCanvasOpen]);

  // Handle resizing - 使用新模組
  useEffect(() => {
    const cleanupResizeHandlers = setupResizeEventHandlers(
      false,
      isResizingMarkdown,
      isMarkdownCanvasOpen,
      contentContainerRef,
      () => {},
      setMarkdownWidth,
      () => {},
      setIsResizingMarkdown,
    );

    return cleanupResizeHandlers;
  }, [isResizingMarkdown, isMarkdownCanvasOpen]);

  // Memoize generateNewThreadId to avoid dependency issues
  const generateNewThreadId = useCallback(() => {
    // Generate UUID and remove all hyphens, then take substring
    const newThreadId =
      "thread_dvc_" + uuidv4().replace(/-/g, "").substring(0, 16);

    setThreadId(newThreadId);

    // Update URL with the new thread ID without page reload
    const url = new URL(window.location.href);

    // Ensure the URL is properly formed with the base path
    const basePath = "/chat";

    if (basePath && !url.pathname.startsWith(basePath)) {
      url.pathname = `${basePath}${url.pathname.startsWith("/") ? "" : "/"}${url.pathname}`;
    }

    url.searchParams.set("thread_id", newThreadId);
    window.history.pushState({ threadId: newThreadId }, "", url.toString());

    // Optionally clear messages to start a fresh conversation
    setMessages([]);

    // Close any open markdown canvas
    if (isMarkdownCanvasOpen) {
      handleCloseMarkdownCanvas();
    }
  }, [isMarkdownCanvasOpen]);

  useEffect(() => {
    // Check if URL already has a thread ID
    const url = new URL(window.location.href);
    const existingThreadId = url.searchParams.get("thread_id");

    // Verify the URL contains the correct base path
    const basePath = "/chat";
    const needsPathUpdate = basePath && !url.pathname.startsWith(basePath);

    if (existingThreadId) {
      // Use the existing thread ID from URL
      setThreadId(existingThreadId);

      // Update path if needed but keep the thread ID
      if (needsPathUpdate) {
        const newPath = `${basePath}${url.pathname.startsWith("/") ? "" : "/"}${url.pathname.replace(/^\//, "")}`;

        url.pathname = newPath;
        window.history.replaceState(
          { threadId: existingThreadId },
          "",
          url.toString(),
        );
      }
    } else {
      // Only generate new ID if we don't have one
      generateNewThreadId();
    }
  }, [generateNewThreadId]);

  // Add button/functionality to start a new thread
  const startNewThread = () => {
    generateNewThreadId();
  };

  // 新增一個用於處理下拉選單打開時的函數
  const handleDropdownOpenChange = (isOpen: boolean) => {
    if (isOpen && !isLoadingModels) {
      // 當下拉選單打開時，重新獲取模型列表
      getAvailableModels().then((models) => {
        setAvailableModels(models);
      });
    }
  };

  const handleSendMessage = async (content: string | MessageContent[]) => {
    // If this is the first message of a conversation, ensure we have a thread ID
    if (messages.length === 0 && !threadId) {
      generateNewThreadId();
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // First determine the task type if content is a string
      const messageText =
        typeof content === "string"
          ? content
          : content.find((item) => item.type === "text")?.text || "";

      // Only detect task type if we have text content
      let taskType: "canvas" | "image" | "chat" = "chat"; // Default to chat

      if (messageText) {
        try {
          taskType = await detectTaskType(messageText, settings);
          console.log(`Detected task type: ${taskType}`);
        } catch (err) {
          console.error("Error in task detection:", err);
          // Continue with default chat mode if detection fails
        }
      }

      const assistantMessageId = uuidv4();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: taskType === "image" ? "Creating your Image..." : "",
        timestamp: new Date(),
        isGeneratingImage: taskType === "image", // Mark as generating image if detected as image task
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingMessageId(assistantMessageId);

      if (taskType === "image") {
        // Handle image generation - 使用新模組
        await handleImageGeneration(
          messageText,
          assistantMessageId,
          settings,
          setMessages,
        );
      } else if (taskType === "canvas") {
        // Enhanced canvas mode with two-step generation - 使用新模組
        await handleCanvasMode(
          userMessage,
          settings,
          setMessages,
          assistantMessageId,
          setMarkdownContent,
          setEditingMessageId,
          setCodeBlockPosition,
          setIsMarkdownCanvasOpen,
        );
      } else {
        // Handle normal chat or code tasks - 使用新模組
        await handleStandardChatMode(
          messages,
          userMessage,
          assistantMessageId,
          settings,
          setMessages,
        );
      }
    } catch (err: any) {
      setError(
        err.message ||
          "Failed to get response from the AI. Please check your settings and try again.",
      );
      console.error("Chat completion error:", err);
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  };

  const toggleMarkdownCanvas = (messageId: string, content: string) => {
    // If already open for this message, close it
    if (isMarkdownCanvasOpen && editingMessageId === messageId) {
      closeMarkdownCanvas(
        setIsMarkdownCanvasOpen,
        setEditingMessageId,
        setCodeBlockPosition,
      );
    } else {
      // First try to find any in-progress code block
      const { codeBlock: inProgressBlock, blockPosition: inProgressPosition } =
        detectInProgressCodeBlock(content, 0);

      if (inProgressBlock && inProgressPosition) {
        openMarkdownCanvas(
          messageId,
          inProgressBlock,
          inProgressPosition,
          setMarkdownContent,
          setEditingMessageId,
          setCodeBlockPosition,
          setIsMarkdownCanvasOpen,
          isMarkdownCanvasOpen,
        );
      } else {
        // Fall back to completed code block
        const { longestBlock, blockPosition } =
          extractLongestCodeBlock(content);

        if (longestBlock && blockPosition) {
          openMarkdownCanvas(
            messageId,
            longestBlock,
            blockPosition,
            setMarkdownContent,
            setEditingMessageId,
            setCodeBlockPosition,
            setIsMarkdownCanvasOpen,
            isMarkdownCanvasOpen,
          );
        }
      }
    }
  };

  const handleSaveMarkdown = (editedContent: string) => {
    saveMarkdownContent(
      editedContent,
      editingMessageId,
      codeBlockPosition,
      setMessages,
      setMarkdownContent,
    );
  };

  const handleCloseMarkdownCanvas = () => {
    closeMarkdownCanvas(
      setIsMarkdownCanvasOpen,
      setEditingMessageId,
      setCodeBlockPosition,
    );
  };

  return (
    <DefaultLayout>
      <div className="flex flex-col w-full h-full">
        {/* 頂部導航欄 - 包含New Conversation、模型選擇和Thread ID */}
        <div className="flex items-center justify-between p-2 bg-content1/30 border-b border-default-200 dark:border-default-800">
          <div className="flex items-center gap-3 flex-wrap">
            {/* 新對話按鈕 */}
            <Button
              color="primary"
              size="sm"
              startContent={
                <svg
                  fill="none"
                  height="18"
                  viewBox="0 0 24 24"
                  width="18"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15.6729 3.91287C16.8918 2.69392 18.8682 2.69392 20.0871 3.91287C21.3061 5.13182 21.3061 7.10813 20.0871 8.32708L14.1499 14.2643C13.3849 15.0293 12.3925 15.5255 11.3215 15.6785L9.14142 15.9899C8.82983 16.0344 8.51546 15.9297 8.29289 15.7071C8.07033 15.4845 7.96554 15.1701 8.01005 14.8586L8.32149 12.6785C8.47449 11.6075 8.97072 10.615 9.7357 9.85006L15.6729 3.91287ZM18.6729 5.32708C18.235 4.88918 17.525 4.88918 17.0871 5.32708L11.1499 11.2643C10.6909 11.7233 10.3932 12.3187 10.3014 12.9613L10.1785 13.8215L11.0386 13.6986C11.6812 13.6068 12.2767 13.3091 12.7357 12.8501L18.6729 6.91287C19.1108 6.47497 19.1108 5.76499 18.6729 5.32708ZM11 3.99929C11.0004 4.55157 10.5531 4.99963 10.0008 5.00007C9.00227 5.00084 8.29769 5.00827 7.74651 5.06064C7.20685 5.11191 6.88488 5.20117 6.63803 5.32695C6.07354 5.61457 5.6146 6.07351 5.32698 6.63799C5.19279 6.90135 5.10062 7.24904 5.05118 7.8542C5.00078 8.47105 5 9.26336 5 10.4V13.6C5 14.7366 5.00078 15.5289 5.05118 16.1457C5.10062 16.7509 5.19279 17.0986 5.32698 17.3619C5.6146 17.9264 6.07354 18.3854 6.63803 18.673C6.90138 18.8072 7.24907 18.8993 7.85424 18.9488C8.47108 18.9992 9.26339 19 10.4 19H13.6C14.7366 19 15.5289 18.9992 16.1458 18.9488C16.7509 18.8993 17.0986 18.8072 17.362 18.673C17.9265 18.3854 18.3854 17.9264 18.673 17.3619C18.7988 17.1151 18.8881 16.7931 18.9393 16.2535C18.9917 15.7023 18.9991 14.9977 18.9999 13.9992C19.0003 13.4469 19.4484 12.9995 20.0007 13C20.553 13.0004 21.0003 13.4485 20.9999 14.0007C20.9991 14.9789 20.9932 15.7808 20.9304 16.4426C20.8664 17.116 20.7385 17.7136 20.455 18.2699C19.9757 19.2107 19.2108 19.9756 18.27 20.455C17.6777 20.7568 17.0375 20.8826 16.3086 20.9421C15.6008 21 14.7266 21 13.6428 21H10.3572C9.27339 21 8.39925 21 7.69138 20.9421C6.96253 20.8826 6.32234 20.7568 5.73005 20.455C4.78924 19.9756 4.02433 19.2107 3.54497 18.2699C3.24318 17.6776 3.11737 17.0374 3.05782 16.3086C2.99998 15.6007 2.99999 14.7266 3 13.6428V10.3572C2.99999 9.27337 2.99998 8.39922 3.05782 7.69134C3.11737 6.96249 3.24318 6.3223 3.54497 5.73001C4.02433 4.7892 4.78924 4.0243 5.73005 3.54493C6.28633 3.26149 6.88399 3.13358 7.55735 3.06961C8.21919 3.00673 9.02103 3.00083 9.99922 3.00007C10.5515 2.99964 10.9996 3.447 11 3.99929Z"
                    fill="currentColor"
                  />
                </svg>
              }
              variant="light"
              onClick={startNewThread}
            >
              New Conversation
            </Button>

            {/* 模型選擇 */}
            <Dropdown onOpenChange={handleDropdownOpenChange}>
              <DropdownTrigger>
                <Button
                  endContent={
                    <svg
                      fill="none"
                      height="16"
                      viewBox="0 0 24 24"
                      width="16"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6 9L12 15L18 9"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                      />
                    </svg>
                  }
                  size="sm"
                  variant="flat"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      fill="none"
                      height="16"
                      viewBox="0 0 24 24"
                      width="16"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M12 7V12L15 15"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                      />
                    </svg>
                    <span>
                      {isLoadingModels
                        ? "Loading models..."
                        : settings.model || "Select Model"}
                    </span>
                  </div>
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Model Selection"
                className="max-h-[300px] overflow-auto"
                onAction={(key) => {
                  setSettings({
                    ...settings,
                    model: key.toString(),
                  });
                }}
              >
                {isLoadingModels ? (
                  <DropdownItem key="loading" isDisabled>
                    Loading available models...
                  </DropdownItem>
                ) : availableModels.length > 0 ? (
                  availableModels.map((model) => (
                    <DropdownItem
                      key={model}
                      className={settings.model === model ? "text-primary" : ""}
                      startContent={
                        settings.model === model ? (
                          <svg
                            fill="none"
                            height="16"
                            viewBox="0 0 24 24"
                            width="16"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M5 13L9 17L19 7"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                            />
                          </svg>
                        ) : null
                      }
                    >
                      {model}
                    </DropdownItem>
                  ))
                ) : (
                  <DropdownItem key="no-models" isDisabled>
                    No models available
                  </DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown>

            {/* Thread ID 顯示在這裡 */}
            <Chip
              color="secondary"
              size="sm"
              startContent={
                <svg
                  fill="none"
                  height="14"
                  viewBox="0 0 24 24"
                  width="14"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 10V20M8 10L4 9.5V19.5L8 20M8 10L12 10.5V20.5L8 20M16 4L12 4.5V10.5L16 10V4Z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
              }
              variant="flat"
            >
              <span className="text-xs text-default-500 truncate">
                {threadId.substring(0, 10)}...
              </span>
            </Chip>

            {/* 可以在這裡添加額外的設置按鈕 */}
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onClick={() => {
                // 移除未使用的變數
                // 當需要實現設置功能時可以再添加回來
              }}
            >
              <svg
                fill="none"
                height="18"
                viewBox="0 0 24 24"
                width="18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
                <path
                  d="M19.4 15C19.1277 15.6171 19.2583 16.3378 19.73 16.82L19.79 16.88C20.1643 17.2544 20.3728 17.7692 20.3728 18.305C20.3728 18.8408 20.1643 19.3556 19.79 19.73C19.4156 20.1043 18.9008 20.3128 18.365 20.3128C17.8292 20.3128 17.3144 20.1043 16.94 19.73L16.88 19.67C16.3978 19.1983 15.6772 19.0677 15.06 19.34C14.4515 19.6022 14.0608 20.2072 14.06 20.87V21C14.06 21.5304 13.8493 22.0391 13.4742 22.4142C13.0991 22.7893 12.5904 23 12.06 23C11.5296 23 11.0209 22.7893 10.6458 22.4142C10.2707 22.0391 10.06 21.5304 10.06 21V20.91C10.0492 20.237 9.63833 19.6322 9.01997 19.38C8.40274 19.1077 7.68219 19.2383 7.19997 19.71L7.13997 19.77C6.76555 20.1443 6.25073 20.3528 5.71497 20.3528C5.17921 20.3528 4.66439 20.1443 4.28997 19.77C3.91567 19.3956 3.7072 18.8808 3.7072 18.345C3.7072 17.8092 3.91567 17.2944 4.28997 16.92L4.34997 16.86C4.82167 16.3778 4.95225 15.6572 4.67997 15.04C4.41776 14.4315 3.81276 14.0408 3.14997 14.04H2.99997C2.46955 14.04 1.96086 13.8293 1.58577 13.4542C1.21068 13.0791 0.999969 12.5704 0.999969 12.04C0.999969 11.5096 1.21068 11.0009 1.58577 10.6258C1.96086 10.2507 2.46955 10.04 2.99997 10.04H3.08997C3.76297 10.0292 4.36776 9.61836 4.61997 9C4.89224 8.38275 4.76166 7.6622 4.28997 7.18L4.22997 7.12C3.85567 6.74558 3.6472 6.23076 3.6472 5.695C3.6472 5.15923 3.85567 4.64442 4.22997 4.27C4.60439 3.89569 5.1192 3.68722 5.65497 3.68722C6.19073 3.68722 6.70554 3.89569 7.07997 4.27L7.13997 4.33C7.62219 4.80169 8.34274 4.93227 8.95997 4.66L8.99997 4.65C9.60844 4.38789 9.99914 3.78289 9.99997 3.12V3C9.99997 2.46957 10.2107 1.96086 10.5858 1.58579C10.9608 1.21071 11.4695 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0008 3.75287 14.3915 4.35787 15 4.62C15.6172 4.8923 16.3378 4.76172 16.82 4.29L16.88 4.23C17.2544 3.85569 17.7692 3.64722 18.305 3.64722C18.8408 3.64722 19.3556 3.85569 19.73 4.23C20.1043 4.60442 20.3128 5.11923 20.3128 5.655C20.3128 6.19077 20.1043 6.70558 19.73 7.08L19.67 7.14C19.1983 7.62223 19.0677 8.34277 19.34 8.96V9C19.6022 9.60844 20.2072 9.99914 20.87 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.2471 14.0008 19.6421 14.3915 19.38 15L19.4 15Z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </Button>
          </div>

          {/* 右側的Model Info顯示 */}
          <div className="flex items-center">
            <Popover placement="bottom-end">
              <PopoverTrigger>
                <Button
                  isIconOnly
                  className="text-warning"
                  size="sm"
                  variant="light"
                >
                  <svg
                    fill="none"
                    height="20"
                    viewBox="0 0 24 24"
                    width="20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                    <path
                      d="M12 16V12"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                    <path
                      d="M12 8H12.01"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="px-1 py-2 w-80">
                  <div className="text-small font-bold">Model Info</div>
                  <div className="text-tiny mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="font-medium">Model:</div>
                      <div>{settings.model || "Not selected"}</div>

                      <div className="font-medium">Temperature:</div>
                      <div>{settings.temperature}</div>

                      <div className="font-medium">Max Tokens:</div>
                      <div>{settings.maxTokens || "Default"}</div>

                      <div className="font-medium">Base URL:</div>
                      <div className="truncate">
                        {settings.baseUrl || "Default"}
                      </div>

                      <div className="font-medium">API Key:</div>
                      <div>{settings.apiKey ? "***" : "Not set"}</div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div
          ref={appContainerRef}
          className="app flex w-full h-[calc(100vh-120px)] relative"
        >
          {/* Main content area with chat and markdown */}
          <div
            ref={contentContainerRef}
            className="flex flex-1 h-full overflow-hidden"
          >
            {/* Chat content area */}
            <div
              className="flex-grow h-full overflow-auto bg-default-50/30 dark:bg-default-900/30"
              style={{
                width: isMarkdownCanvasOpen
                  ? `${100 - markdownWidth}%`
                  : "100%",
              }}
            >
              <ChatBox
                currentModel={settings.model}
                editingMessageId={editingMessageId}
                fetchModels={getAvailableModels}
                isLoading={isLoading}
                isLoadingModels={isLoadingModels}
                longestCodeBlockPosition={codeBlockPosition}
                messages={messages}
                settings={settings}
                streamingMessageId={streamingMessageId}
                toggleMarkdownCanvas={toggleMarkdownCanvas}
                onCopy={handleCopyMessage}
                onDelete={handleDeleteMessage}
                onEdit={handleEditMessage}
                onRegenerate={handleRegenerateMessage}
                onSendMessage={handleSendMessage}
              />

              {isLoading && (
                <div className="loading-indicator flex items-center justify-center p-4">
                  <div className="spinner mr-2 w-5 h-5 border-2 border-t-primary border-r-primary border-b-primary border-l-transparent rounded-full animate-spin" />
                  <p>Thinking...</p>
                </div>
              )}

              {error && (
                <div className="error-message flex items-center justify-between p-4 bg-danger-50 dark:bg-danger-900/50 text-danger border border-danger m-4 rounded-lg">
                  <p>{error}</p>
                  <button
                    className="ml-4 p-1 rounded-full hover:bg-danger-100 dark:hover:bg-danger-800"
                    onClick={() => setError(null)}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Markdown editor with resizer */}
            {isMarkdownCanvasOpen && (
              <>
                <div
                  ref={markdownResizerRef}
                  className="resizer cursor-col-resize w-1 bg-primary/30 hover:bg-primary/50 z-10"
                />
                <div
                  className="overflow-auto h-full bg-default-100/30 dark:bg-default-900/60"
                  style={{ width: `${markdownWidth}%` }}
                >
                  <MarkdownCanvas
                    content={markdownContent}
                    isOpen={isMarkdownCanvasOpen}
                    modelSettings={settings}
                    onAskGpt={handleAskGpt}
                    onClose={handleCloseMarkdownCanvas}
                    onSave={handleSaveMarkdown}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
