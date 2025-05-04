import { useState } from "react";

import ChatBox from "@/components/ChatBox";
import { getDefaultModelSettings } from "@/utils/modelUtils";
import { Message, MessageContent, ModelSetting } from "@/types";
import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import SplitText from "@/components/SplitText";

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
          <SplitText
            animationFrom={{ opacity: 0, transform: "translate3d(0,40px,0)" }}
            animationTo={{ opacity: 1, transform: "translate3d(0,0,0)" }}
            className={title()}
            delay={60}
            easing="easeOutCubic"
            text="Make"
          />
          <SplitText
            animationFrom={{ opacity: 0, transform: "translate3d(0,40px,0)" }}
            animationTo={{ opacity: 1, transform: "translate3d(0,0,0)" }}
            className={title({ color: "violet" })}
            delay={60}
            easing="easeOutCubic"
            text=" Agent"
          />
          <br />
          <SplitText
            animationFrom={{ opacity: 0, transform: "translate3d(0,40px,0)" }}
            animationTo={{ opacity: 1, transform: "translate3d(0,0,0)" }}
            className={title()}
            delay={60}
            easing="easeOutCubic"
            text="become more "
          />
          <SplitText
            animationFrom={{ opacity: 0, transform: "translate3d(0,40px,0)" }}
            animationTo={{ opacity: 1, transform: "translate3d(0,0,0)" }}
            className={title({ color: "violet" })}
            delay={60}
            easing="easeOutCubic"
            text="interactive"
          />
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
