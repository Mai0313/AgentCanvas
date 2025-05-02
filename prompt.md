## Project Description

LLM Chatbot Frontend UI

- 這個專案是使用 `Vite` 和 `TypeScript` 開發 並透過 `yarn` 進行套件管理
  - 你不需要編輯 `package.json` 你也不需要執行安裝套件的命令 你只需要提醒我安裝你需要的套件

## Supporting Features

- 現在可以很明確知道我的 ChatBox 是放在 `flex flex-1 h-full overflow-hidden` 這個區塊裡面 markdownCanvas也是放在這裡面 但我不知道為何他會導致我的UI沒辦法完整使用整個 `app flex w-full h-[calc(100vh-200px)] relative` 的區塊

- 當收到使用者訊息後 會透過 `chatCompletion` 來判斷任務內容
  - `canvas`
    - `canvas` 模式下 原本 `chat` 會被拆成兩個 `chatCompletion` 但 輸出的結果會跟 `chat` 模式一樣
    - 當 `taskType === "canvas"` 的時候 會觸發兩個chat completion
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
    - 透過代碼框的方式來偵測是否需要進入 `MarkdownCanvas` 模式
    - 當偵測到第一個代碼框時 會開始將後續代碼透過 `Streaming` 的方式輸出到 `MarkdownCanvas` 內
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

## TODO Features
- 你不需要修改主要功能 主要任務是修改網站的風格與設計
  - 選擇模型的部分我希望透過 `@heroui/dropdown` 來完成 並且 選擇模型 New Conversation 和 Thread ID 應該要放在Chat Page最外層的sidebar裡面 讓User可以選擇打開或關閉
    - New Conversation 我希望可以透過 `@heroui/button` 來完成
    - Thread ID我也想透過 `heroui` 來完成
    - 簡單來說就是下面這一區塊我都想透過 `heroui` 來完成
    ```
    New Conversation
    Thread ID: thread_dvc_786724e0b6ba47c6
    Model Settings
    Model
    ```
  - 其中一個功能會顯示出 Image 我希望可以透過這個套件來美化他 `import {Image} from "@heroui/image";`

- 為何我的UI整個跑掉了 上面本來是所有功能 功能看起來是正常 只是排版有問題 你可以參考一下 src/styles/styles.css 我不確定是不是我沒有引入這個

- 請幫我將這個網站改到 root path `/it-canvas/experimental` 底下

- 請幫我檢查整個codebase 幫我把一些沒有用到的function移除 並且將一些功能模組化
  - 例如目前有很多function散落在各處 或是 一段代碼的長度超長也有一些無意義的 let 定義

- 請幫我增加一個功能 當使用者用滑鼠把某段字反白時 希望可以跳出一個選項在反白的字下面
  - `Ask GPT`
    - 當使用者點擊這個選項時 彈出一個臨時的小視窗 那個小視窗是一個小型的chatbox 將反白的字當成引用 並讓user輸入他想問的問題但當實際調用
      `chatCompletion` 的時候 需要將Chatbox的所有對話紀錄 和 反白的字 和 使用者輸入的問題一起送給
      `chatCompletion` 讓他生成一段回覆回覆的部分要用streaming的方式生成在臨時的Chatbox
