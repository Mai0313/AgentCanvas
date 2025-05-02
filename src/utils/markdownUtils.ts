/**
 * 檢測文本是否包含 Markdown 格式
 */
export const containsMarkdown = (text: string): boolean => {
  if (!text) return false;

  // 基本檢測 Markdown 類內容
  const markdownPatterns = [
    /^#+\s+.+$/m, // 標題
    /\*\*.+\*\*/, // 粗體
    /\*.+\*/, // 斜體
    /^>\s+.+$/m, // 引用塊
    /^```[\s\S]*?```$/m, // 代碼塊
    /^\s*[-*+]\s+.+$/m, // 列表
    /^\s*\d+\.\s+.+$/m, // 有序列表
    /\[.+\]\(.+\)/, // 連結
    /!\[.+\]\(.+\)/, // 圖片
    /^[\s-]{3,}$/m, // 水平線
  ];

  return markdownPatterns.some((pattern) => pattern.test(text));
};

/**
 * 提取文本中最長的代碼塊
 */
export const extractLongestCodeBlock = (
  text: string,
): {
  longestBlock: string;
  blockPosition: { start: number; end: number } | null;
  lineCount: number;
} => {
  if (!text) {
    return { longestBlock: "", blockPosition: null, lineCount: 0 };
  }

  // 查找所有代碼塊
  const codeBlockRegex = /```[\s\S]*?```/g;
  const matches: Array<{ text: string; index: number; lineCount: number }> = [];

  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // 計算代碼塊中的行數
    const lineCount = (match[0].match(/\n/g) || []).length;

    matches.push({
      text: match[0],
      index: match.index,
      lineCount: lineCount,
    });
  }

  if (matches.length === 0) {
    return { longestBlock: "", blockPosition: null, lineCount: 0 };
  }

  // 找出最長的代碼塊
  let longestBlockIndex = 0;
  let maxLength = 0;

  matches.forEach((match, index) => {
    if (match.text.length > maxLength) {
      maxLength = match.text.length;
      longestBlockIndex = index;
    }
  });

  const longestMatch = matches[longestBlockIndex];
  const start = longestMatch.index;
  const end = start + longestMatch.text.length;

  return {
    longestBlock: longestMatch.text,
    blockPosition: { start, end },
    lineCount: longestMatch.lineCount,
  };
};

/**
 * 檢測正在進行中的代碼塊（尚未閉合的代碼塊）
 */
export const detectInProgressCodeBlock = (
  text: string,
  minLines: number = 5,
): {
  codeBlock: string;
  blockPosition: { start: number; end: number } | null;
  lineCount: number;
} => {
  if (!text) {
    return { codeBlock: "", blockPosition: null, lineCount: 0 };
  }

  // 找到最後一個代碼塊開始標記
  const lastBlockStartIndex = text.lastIndexOf("```");

  if (lastBlockStartIndex === -1) {
    return { codeBlock: "", blockPosition: null, lineCount: 0 };
  }

  // 檢查在此開始標記之後是否有結束標記
  const textAfterLastOpen = text.substring(lastBlockStartIndex);
  const hasClosingMarker = textAfterLastOpen.indexOf("```", 3) !== -1;

  // 如果有結束標記，則這個塊是完整的，不是進行中的
  if (hasClosingMarker) {
    return { codeBlock: "", blockPosition: null, lineCount: 0 };
  }

  // 計算此進行中代碼塊的行數
  const inProgressBlock = textAfterLastOpen;
  const lineCount = (inProgressBlock.match(/\n/g) || []).length;

  // 如果行數 >= minLines，則返回此塊
  if (lineCount >= minLines) {
    return {
      codeBlock: inProgressBlock,
      blockPosition: { start: lastBlockStartIndex, end: text.length },
      lineCount: lineCount,
    };
  }

  return { codeBlock: "", blockPosition: null, lineCount: 0 };
};
