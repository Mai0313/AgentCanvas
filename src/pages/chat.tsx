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
import { Alert } from "@heroui/alert";

import DefaultLayout from "@/layouts/default";
import ChatBox from "@/components/ChatBox";
import MarkdownCanvas from "@/components/MarkdownCanvas";
import { ModelSettingsModal } from "@/components/ModelSettings";
import { Message, ModelSetting, MessageContent } from "@/types";
import { fetchModels, detectTaskType, detectUserLang } from "@/utils/openai";
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
  handleCanvasModeNext,
  updateCanvasTitle,
} from "@/utils/canvasHandlers";
import {
  setupResizeEventHandlers,
  setupMarkdownResizer,
} from "@/utils/layoutHandlers";
import { useModeLanguage, useGenerationStatus } from "@/provider";

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
  // 新增：縮小狀態與對應訊息ID
  const [isMarkdownMinimized, setIsMarkdownMinimized] = useState(false);
  const [minimizedMarkdownMessageId, setMinimizedMarkdownMessageId] = useState<
    string | null
  >(null);

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

  // 新增一個 state 控制 Alert 顯示
  const [showThinking, setShowThinking] = useState(false);

  // fullscreen 狀態 class
  const fullscreenClass = isMarkdownCanvasOpen ? "main-content-fullscreen" : "";

  // Add state for mode and language
  const { mode, setMode, userLanguage, setUserLanguage } = useModeLanguage();

  // Add generation status
  const { setGeneratingImageMessageId, setGeneratingCodeMessageId } =
    useGenerationStatus();

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

  // 監控 isLoading 狀態，自動顯示/隱藏 Alert
  useEffect(() => {
    if (isLoading) {
      setShowThinking(true);
    } else if (showThinking) {
      // 延遲 500ms 再關閉，避免閃爍
      const timer = setTimeout(() => setShowThinking(false), 500);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // 处理 Canvas 标题生成的新函数
  const handleGenerateTitle = (
    codeContent: string,
    callback: (title: string) => void,
  ) => {
    // 使用现有的 updateCanvasTitle 工具函数实现标题生成
    if (codeContent.trim()) {
      // 创建一个适配器函数，将 callback 转换为符合 React.Dispatch<React.SetStateAction<string>> 类型
      const setTitleAdapter: React.Dispatch<React.SetStateAction<string>> = (
        value,
      ) => {
        // 处理函数形式的 SetStateAction
        const newTitle = typeof value === "function" ? value("") : value;

        callback(newTitle);
      };

      // 创建一个空的状态设置函数，因为这个状态由 MarkdownCanvas 内部管理
      const setIsGeneratingAdapter: React.Dispatch<
        React.SetStateAction<boolean>
      > = () => {};

      updateCanvasTitle(
        codeContent,
        settings,
        setTitleAdapter,
        setIsGeneratingAdapter,
      );
    }
  };

  // Update generateNewThreadId to only set thread ID
  const generateNewThreadId = useCallback(
    (keepMessages = false) => {
      const newThreadId =
        "thread_" + uuidv4().replace(/-/g, "").substring(0, 16);

      setThreadId(newThreadId);

      // Update URL with the new thread ID only
      const url = new URL(window.location.href);
      const basePath = "/chat";

      if (basePath && !url.pathname.startsWith(basePath)) {
        url.pathname = `${basePath}${
          url.pathname.startsWith("/") ? "" : "/"
        }${url.pathname}`;
      }
      url.searchParams.set("thread_id", newThreadId);
      window.history.pushState({ threadId: newThreadId }, "", url.toString());

      // 只有當 keepMessages 為 false 時才清空訊息
      if (!keepMessages) {
        setMessages([]);
      }

      if (isMarkdownCanvasOpen) {
        handleCloseMarkdownCanvas();
      }
    },
    [isMarkdownCanvasOpen],
  );

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
        const newPath = `${basePath}${
          url.pathname.startsWith("/") ? "" : "/"
        }${url.pathname.replace(/^\//, "")}`;

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

  // Update startNewThread to clear mode/language
  const startNewThread = () => {
    setMode("");
    setUserLanguage("");
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
      content: content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      let currentMode = mode;
      let currentLang = userLanguage;

      const messageText =
        typeof content === "string"
          ? content
          : content.find((item) => item.type === "text")?.text || "";

      // Only detect mode/language if not set yet
      if (!currentMode || !currentLang) {
        // Detect mode
        let detectedMode: "canvas" | "image" | "chat" = "chat";

        if (messageText) {
          try {
            detectedMode = await detectTaskType(messageText, settings);
          } catch (err) {
            detectedMode = "chat";
            console.error("Error detecting task type:", err);
          }
        }

        // Use LLM to detect language from messageText
        let detectedLang = "en-US";

        if (messageText) {
          try {
            detectedLang = await detectUserLang(messageText, settings);
          } catch (err) {
            detectedLang = "en-US";
            console.error("Error detecting user language:", err);
          }
        }

        currentMode = detectedMode;
        currentLang = detectedLang;

        // Update state
        setMode(detectedMode);
        setUserLanguage(detectedLang);
        generateNewThreadId(true); // 傳入 true 來保留已添加的用戶訊息
      }

      const assistantMessageId = uuidv4();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: currentMode === "image" ? "Creating your Image..." : "",
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingMessageId(assistantMessageId);
      console.log("Detected mode:", currentMode);
      console.log("All Messages", messages);
      console.log("Current Message", userMessage);
      console.log("Current CodeBlock", markdownContent);

      if (currentMode === "image") {
        // Handle image generation - 使用新模組
        setGeneratingImageMessageId(assistantMessageId);
        await handleImageGeneration(
          messageText,
          assistantMessageId,
          settings,
          setMessages,
          currentLang,
        );
        setGeneratingImageMessageId(null);
      } else if (currentMode === "canvas") {
        if (messages.length === 0) {
          // 第一個 canvas 問題，走原本流程
          await handleCanvasMode(
            userMessage,
            settings,
            setMessages,
            assistantMessageId,
            setMarkdownContent,
            setEditingMessageId,
            setIsMarkdownCanvasOpen,
            currentLang,
          );
        } else {
          await handleCanvasModeNext(
            userMessage,
            markdownContent,
            settings,
            setMessages,
            assistantMessageId,
            setMarkdownContent,
            setEditingMessageId,
            setIsMarkdownCanvasOpen,
            currentLang,
          );
        }
      } else {
        // Handle normal chat or code tasks - 使用新模組
        setGeneratingCodeMessageId(assistantMessageId);
        await handleStandardChatMode(
          messages,
          userMessage,
          assistantMessageId,
          settings,
          setMessages,
          currentLang,
        );
        setGeneratingCodeMessageId(null);
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

  useEffect(() => {
    // 首頁 quickstart 自動帶入訊息
    if (typeof window !== "undefined") {
      const quickMsg = window.localStorage.getItem("quickstart_message");

      if (quickMsg) {
        try {
          const parsed = JSON.parse(quickMsg);

          // 僅當目前沒有訊息時才自動發送
          if (messages.length === 0) {
            handleSendMessage(parsed);
          }
        } catch (err) {
          console.error("Error in task detection:", err);
        }
        window.localStorage.removeItem("quickstart_message");
      }
    }
  }, []); // 只在初次載入時執行

  const toggleMarkdownCanvas = (messageId: string, content: string) => {
    // If already open for this message, close it
    if (isMarkdownCanvasOpen && editingMessageId === messageId) {
      closeMarkdownCanvas(setIsMarkdownCanvasOpen, setEditingMessageId);
    } else {
      openMarkdownCanvas(
        messageId,
        content,
        setMarkdownContent,
        setEditingMessageId,
        setIsMarkdownCanvasOpen,
        isMarkdownCanvasOpen,
      );
    }
  };

  // 讓 Save 觸發後自動引用進 ChatBox
  const handleSaveMarkdown = (editedContent: string) => {
    saveMarkdownContent(
      editedContent,
      editingMessageId,
      setMessages,
      setMarkdownContent,
    );
  };

  const handleCloseMarkdownCanvas = () => {
    // 不是直接關閉，而是縮小到AI訊息
    setIsMarkdownCanvasOpen(false);
    setIsMarkdownMinimized(true);
    setMinimizedMarkdownMessageId(editingMessageId);
  };

  // 恢復全螢幕MarkdownCanvas
  const handleRestoreMarkdownCanvas = () => {
    setIsMarkdownCanvasOpen(true);
    setIsMarkdownMinimized(false);
    // 保持editingMessageId/minimizedMarkdownMessageId不變
  };

  const [showModelSettings, setShowModelSettings] = useState(false);

  return (
    <DefaultLayout>
      {/* Thinking Alert 右上角浮動顯示 */}
      {showThinking && (
        <div className="fixed top-6 right-6 z-[9999]">
          <Alert
            className="shadow-lg animate-fadeInUp"
            color="primary"
            variant="solid"
          >
            <div className="flex items-center gap-2">
              <span className="spinner w-4 h-4 border-2 border-t-primary border-r-primary border-b-primary border-l-transparent rounded-full animate-spin" />
              Thinking...
            </div>
          </Alert>
        </div>
      )}
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
          </div>

          {/* 右側的Model Info顯示 */}
          <div className="flex items-center">
            <Button
              isIconOnly
              aria-label="Edit Model Settings"
              className="text-warning"
              size="sm"
              variant="light"
              onClick={() => setShowModelSettings(true)}
            >
              {/* Custom SVG icon with currentColor for dark mode support */}
              <svg
                fill="none"
                height="24"
                viewBox="0 0 48 48"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M36.686 15.171C37.9364 16.9643 38.8163 19.0352 39.2147 21.2727H44V26.7273H39.2147C38.8163 28.9648 37.9364 31.0357 36.686 32.829L40.0706 36.2137L36.2137 40.0706L32.829 36.686C31.0357 37.9364 28.9648 38.8163 26.7273 39.2147V44H21.2727V39.2147C19.0352 38.8163 16.9643 37.9364 15.171 36.686L11.7863 40.0706L7.92939 36.2137L11.314 32.829C10.0636 31.0357 9.18372 28.9648 8.78533 26.7273H4V21.2727H8.78533C9.18372 19.0352 10.0636 16.9643 11.314 15.171L7.92939 11.7863L11.7863 7.92939L15.171 11.314C16.9643 10.0636 19.0352 9.18372 21.2727 8.78533V4H26.7273V8.78533C28.9648 9.18372 31.0357 10.0636 32.829 11.314L36.2137 7.92939L40.0706 11.7863L36.686 15.171Z"
                  fill="none"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="4"
                />
                <path
                  d="M24 29C26.7614 29 29 26.7614 29 24C29 21.2386 26.7614 19 24 19C21.2386 19 19 21.2386 19 24C19 26.7614 21.2386 29 24 29Z"
                  fill="none"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="4"
                />
              </svg>
            </Button>
            <ModelSettingsModal
              open={showModelSettings}
              settings={settings}
              onClose={() => setShowModelSettings(false)}
              onSettingsChange={setSettings}
            />
          </div>
        </div>

        <div
          ref={appContainerRef}
          className="app flex w-full h-[calc(100vh-120px)] relative"
        >
          {/* Main content area with chat and markdown */}
          <div
            ref={contentContainerRef}
            className={`flex flex-1 h-full overflow-hidden ${fullscreenClass} bg-background text-foreground dark:bg-background`}
          >
            {/* Chat content area */}
            <div
              className="flex-grow h-full overflow-auto bg-background text-foreground dark:bg-background"
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
                isMarkdownMinimized={isMarkdownMinimized}
                messages={messages}
                minimizedMarkdownMessageId={minimizedMarkdownMessageId}
                settings={settings}
                streamingMessageId={streamingMessageId}
                toggleMarkdownCanvas={toggleMarkdownCanvas}
                onCopy={handleCopyMessage}
                onDelete={handleDeleteMessage}
                onEdit={handleEditMessage}
                onRegenerate={handleRegenerateMessage}
                onRestoreMarkdownCanvas={handleRestoreMarkdownCanvas}
                onSendMessage={handleSendMessage}
              />

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
                    onAskGpt={handleAskGpt}
                    onClose={handleCloseMarkdownCanvas}
                    onGenerateTitle={handleGenerateTitle}
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
