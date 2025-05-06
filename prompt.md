## Project Description

`AgentCanvas` 是基於 `Vite` 和 `TypeScript` 開發 並透過 `yarn` 進行套件管理
  - 你不需要編輯 `package.json` 你也不需要執行安裝套件的命令 你只需要提醒我安裝你需要的套件

## Supporting Features
- 當收到使用者訊息後 會透過兩個 `chatCompletion` 來做下面兩件事情
  - 判斷使用者語言 `currentLang`
  - 判斷任務內容 `currentMode`
    - `canvas`
      - 進入 `canvas` 模式後會將 `MarkdownCanvas` 與 `ChatBox` 改為全螢幕模式 當使用者點擊 `X` (`Close`) 按鈕 就會將 `MarkdownCanvas` 縮小到 `ChatBox` 內
      - `canvas` 模式下 原本 `chat` 會被拆成兩個 `chatCompletion` 但 輸出的結果會跟 `chat` 模式一樣
      - 當 `currentMode` = "canvas" 的時候 會觸發兩個chat completion
        - 第一個 `chatCompletion`
          會先將user的問題放進去 並讓LLM只能透過一個代碼框來回答問題 並且 將這段用 `streaming`
          的方式寫入 `MarkdownCanvas`
        - 當上述完成以後 將問題與生成完畢的代碼框一起放進第二個 `chatCompletion` 來生成後續的描述
        - 這兩個 `chatCompletion` 將會同時進行並且輸出在同一個 `ChatBox` 內 保持與 `chat`
          模式相同的行為
    - `image`
      - 生圖模式會透過 `generateImageAndText` 來產生圖片與對應的文字
      - 當圖片生成完畢後會同時與文字渲染到 `ChatBox`
      - 先透過 `generateImageAndText` 來產生圖片 圖片產生以後會將 `imageUrl` 放進 `chatCompletion`
        來生成對應的圖片敘述
    - `chat`
      - 進行普通的問答對話
  - 狀態皆會存在網址中 以便後續使用
- MarkdownCanvas 和 ChatBox 之間會有一個 `ResizeBox` 用於給使用者調整每一區塊的大小
- 當使用者框選出一段文字後
  - 會有一個 `ContextMenu` 彈出來
  - 當使用者點擊 `Ask GPT` 時會將選取的文字傳給 `ChatBox` 並且等待使用者輸入問題後送出
- 每一段 LLM 的回應下方新增幾個按鈕
  - `Copy`
    - 當使用者點擊這個按鈕時 會將該段回應的內容複製到剪貼簿
  - `Edit`
    - 當使用者點擊這個按鈕時 會將該段回應變成可編輯狀態 並且有額外一個 Send 按鈕 讓使用者修改以後點選送出
    - 當使用者編輯完畢後 點擊 `Send` 按鈕會將編輯後的內容送出
  - `Delete`
    - 當使用者點擊這個按鈕時 會將該段回應刪除
  - `Regenerate`
    - 當使用者點擊這個按鈕時 會將該段對話刪除 並重新生成一次對話
    - 當使用者編輯完畢後 點擊 `Send` 按鈕會將編輯後的內容送出
- 使用者可以透過電腦的ctrl + v 來貼上圖片 貼上以後要送進chat completion
- 使用者可以透過 Copy Edit 的按鈕來編輯訊息
  - Copy: 複製
  - Edit: 編輯 當編輯完成以後會重新送出訊息
- 支援 `Dark Mode` 與 `Light Mode`
- 可以從首頁直接開始對話 並會透過一個流暢的動畫轉移過去

## TODO Features
- 當進入 `canvas` 模式後 會透過兩個 `chatCompletion` 來判斷狀態 但有一個情況比較特別
  - 如果模型已經提供對應代碼 而 User 只是編輯了 `MarkdownCanvas` 進行後續提問 `canvas` 模式的行為要反過來
    - 先透過第一個 `chatCompletion` 來回答使用者的問題
    - 透過第二個 `chatCompletion` 來生成修改後的代碼並輸出到 `MarkdownCanvas`



能不能幫我在 `openai.ts`
- 在 Canvas 模式下 會透過兩個 chatCompletion 來做兩件事情
  - 第一個 chatCompletion 會將使用者的問題放進去 並讓 LLM 只能透過一個代碼框來回答問題
  - 第二個 chatCompletion 會將第一個 chatCompletion 的結果放進去 並且將這段用 streaming 的方式寫入 MarkdownCanvas
我希望你幫我將 `展開 Canvas 編輯器` 這個按鈕移動到最後一則AI回覆的上方

- `handleAskGpt` 能不能把引用的部分藏入 `@heroui/modal` 讓使用者可以點擊以後查看？
  - 有一點需要注意 `handleAskGpt` 那邊好像是透過 `>` 來判斷哪裡是引用來的訊息 所以可能要在每一行 (包括空行) 前面加上 `>` 來讓後續的訊息能被正確的判斷

如果把 `MarkdownCanvas` 改成一個function call的話會不會比較好處理？


`yarn run docusaurus generate-typedoc`
