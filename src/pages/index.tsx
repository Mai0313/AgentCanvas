import { useState } from "react";

import ChatBox from "@/components/ChatBox";
import { getDefaultModelSettings } from "@/utils/modelUtils";
import { Message, MessageContent, ModelSetting } from "@/types";
import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";

export default function IndexPage() {
  const [messages] = useState<Message[]>([]);
  const [isLoading] = useState(false);
  const [streamingMessageId] = useState<string | null>(null);
  const [editingMessageId] = useState<string | null>(null);
  const [settings] = useState<ModelSetting>(getDefaultModelSettings());
  const [transitioning, setTransitioning] = useState(false);

  // 處理首頁送出訊息
  const handleSendMessage = (content: string | MessageContent[]) => {
    setTransitioning(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "quickstart_message",
        JSON.stringify(content),
      );
    }
    setTimeout(() => {
      window.location.href = "/chat";
    }, 500);
  };

  return (
    <DefaultLayout>
      <section
        className={`flex flex-col items-center justify-center gap-4 py-8 md:py-10 transition-opacity duration-500 ${transitioning ? "opacity-0" : "opacity-100"}`}
      >
        <div className="inline-block max-w-lg text-center justify-center">
          <span className={title()}>Make&nbsp;</span>
          <span className={title({ color: "violet" })}>Agent&nbsp;</span>
          <br />
          <span className={title()}>
            become more&nbsp;
            <span className={title({ color: "violet" })}>interactive</span>
          </span>
        </div>
        <div className="w-full max-w-2xl mt-8">
          <ChatBox
            editingMessageId={editingMessageId}
            isLoading={isLoading}
            longestCodeBlockPosition={null}
            messages={messages}
            settings={settings}
            streamingMessageId={streamingMessageId}
            toggleMarkdownCanvas={() => {}}
            onSendMessage={handleSendMessage}
          />
        </div>
      </section>
    </DefaultLayout>
  );
}
