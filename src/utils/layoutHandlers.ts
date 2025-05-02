import { RefObject } from "react";

/**
 * 處理 Sidebar 調整大小事件
 */
export const handleSidebarResizing = (
  event: MouseEvent,
  isResizingSidebar: boolean,
  setSidebarWidth: React.Dispatch<React.SetStateAction<number>>,
): void => {
  if (!isResizingSidebar) return;

  const newWidth = event.clientX;
  // 限制寬度在合理範圍內
  if (newWidth >= 200 && newWidth <= 350) {
    setSidebarWidth(newWidth);
  }
};

/**
 * 處理 Markdown 區域調整大小事件
 */
export const handleMarkdownResizing = (
  event: MouseEvent,
  isResizingMarkdown: boolean,
  isMarkdownCanvasOpen: boolean,
  mainContainerRef: RefObject<HTMLDivElement | null>,
  setMarkdownWidth: React.Dispatch<React.SetStateAction<number>>,
): void => {
  if (!isResizingMarkdown || !isMarkdownCanvasOpen) return;

  const containerWidth = mainContainerRef.current?.clientWidth || 0;

  if (containerWidth && mainContainerRef.current) {
    // 根據鼠標位置計算新寬度
    const mainRect = mainContainerRef.current.getBoundingClientRect();
    const fromRight = mainRect.right - event.clientX;
    const newWidthPercent = (fromRight / containerWidth) * 100;

    // 應用限制 (20% 到 70%)
    const limitedWidth = Math.max(20, Math.min(70, newWidthPercent));
    setMarkdownWidth(limitedWidth);
  }
};

/**
 * 設置調整大小事件處理
 */
export const setupResizeEventHandlers = (
  isResizingSidebar: boolean,
  isResizingMarkdown: boolean,
  isMarkdownCanvasOpen: boolean,
  mainContainerRef: RefObject<HTMLDivElement | null>,
  setSidebarWidth: React.Dispatch<React.SetStateAction<number>>,
  setMarkdownWidth: React.Dispatch<React.SetStateAction<number>>,
  setIsResizingSidebar: React.Dispatch<React.SetStateAction<boolean>>,
  setIsResizingMarkdown: React.Dispatch<React.SetStateAction<boolean>>,
): (() => void) => {
  const onMouseMove = (e: MouseEvent) => {
    handleSidebarResizing(e, isResizingSidebar, setSidebarWidth);
    handleMarkdownResizing(
      e,
      isResizingMarkdown,
      isMarkdownCanvasOpen,
      mainContainerRef,
      setMarkdownWidth,
    );
  };

  const onMouseUp = () => {
    setIsResizingSidebar(false);
    setIsResizingMarkdown(false);
    document.documentElement.style.cursor = "";
  };

  if (isResizingSidebar || isResizingMarkdown) {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  return () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };
};

/**
 * 設置 Sidebar Resizer 事件處理
 */
export const setupSidebarResizer = (
  sidebarResizerRef: RefObject<HTMLDivElement | null>,
  setIsResizingSidebar: React.Dispatch<React.SetStateAction<boolean>>,
): (() => void) => {
  const sidebarResizer = sidebarResizerRef.current;
  if (!sidebarResizer) return () => {};

  const onMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);
    document.documentElement.style.cursor = "col-resize";
  };

  sidebarResizer.addEventListener("mousedown", onMouseDown);

  return () => {
    sidebarResizer.removeEventListener("mousedown", onMouseDown);
  };
};

/**
 * 設置 Markdown Resizer 事件處理
 */
export const setupMarkdownResizer = (
  markdownResizerRef: RefObject<HTMLDivElement | null>,
  isMarkdownCanvasOpen: boolean,
  setIsResizingMarkdown: React.Dispatch<React.SetStateAction<boolean>>,
): (() => void) => {
  const markdownResizer = markdownResizerRef.current;
  if (!markdownResizer || !isMarkdownCanvasOpen) return () => {};

  const onMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    setIsResizingMarkdown(true);
    document.documentElement.style.cursor = "col-resize";
  };

  markdownResizer.addEventListener("mousedown", onMouseDown);

  return () => {
    markdownResizer.removeEventListener("mousedown", onMouseDown);
  };
};
