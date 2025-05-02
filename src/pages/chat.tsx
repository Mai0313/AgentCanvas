import { useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import ChatBox from "@/components/ChatBox";
import ModelSettings from "@/components/ModelSettings";
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
  setupSidebarResizer,
  setupMarkdownResizer,
} from "@/utils/layoutHandlers";

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
  const [sidebarWidth, setSidebarWidth] = useState(250); // Default sidebar width
  const [markdownWidth, setMarkdownWidth] = useState(40); // Default 40% width for markdown
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingMarkdown, setIsResizingMarkdown] = useState(false);

  // Refs for resizable elements
  const appContainerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const markdownResizerRef = useRef<HTMLDivElement>(null);
  const sidebarResizerRef = useRef<HTMLDivElement>(null);

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
    editMessage(messageId, newContent, messages, setMessages);
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
      return [
        "gpt-4",
        "gpt-4-turbo",
        "gpt-3.5-turbo",
        "claude-instant-v1",
        "claude-v2",
      ];
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
          setAvailableModels([
            "gpt-4",
            "gpt-4-turbo",
            "gpt-3.5-turbo",
            "claude-instant-v1",
            "claude-v2",
          ]);
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

  // Setup sidebar resizer - 使用新模組
  useEffect(() => {
    const cleanupSidebarResizer = setupSidebarResizer(
      sidebarResizerRef,
      setIsResizingSidebar,
    );

    return cleanupSidebarResizer;
  }, []);

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
      isResizingSidebar,
      isResizingMarkdown,
      isMarkdownCanvasOpen,
      contentContainerRef,
      setSidebarWidth,
      setMarkdownWidth,
      setIsResizingSidebar,
      setIsResizingMarkdown,
    );

    return cleanupResizeHandlers;
  }, [isResizingSidebar, isResizingMarkdown, isMarkdownCanvasOpen]);

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
      <div className="flex flex-col items-center w-full py-4">
        <div className="inline-block max-w-lg text-center justify-center mb-4">
          <h1 className={title()}>Chat</h1>
        </div>

        <div
          ref={appContainerRef}
          className="app flex w-full h-[calc(100vh-200px)] relative"
        >
          {/* Sidebar with resizer */}
          <div
            ref={sidebarRef}
            className="sidebar h-full bg-default-50 dark:bg-default-900 border-r border-default-200 dark:border-default-800"
            style={{ width: `${sidebarWidth}px` }}
          >
            <div className="thread-controls p-4 border-b border-default-200 dark:border-default-800">
              <button
                className="new-thread-btn w-full p-2 mb-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors"
                onClick={startNewThread}
              >
                New Conversation
              </button>
              <div className="thread-id text-xs text-default-500 mt-2 truncate">
                Thread ID: {threadId}
              </div>
            </div>
            <ModelSettings settings={settings} onSettingsChange={setSettings} />
            <div
              ref={sidebarResizerRef}
              className="sidebar-resizer absolute top-0 right-0 w-1 h-full bg-default-300/30 hover:bg-primary/50 cursor-col-resize z-10"
            />
          </div>

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
