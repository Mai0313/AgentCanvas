import React from "react";
import { Divider } from "@heroui/divider";

import { ModelSetting } from "../types";

interface ModelSettingsProps {
  settings: ModelSetting;
  onSettingsChange: (settings: ModelSetting) => void;
}

const ModelSettings: React.FC<ModelSettingsProps> = ({
  settings,
  // onSettingsChange,
}) => {
  return (
    <div className="model-settings">
      {/* 只保留最小必要的信息，移除 API settings 和 advanced Settings */}
      <div className="model-info mt-4">
        <div className="flex items-center gap-2 my-4">
          <span className="text-xs text-default-500">Model Info</span>
          <Divider className="flex-grow" />
        </div>

        <div className="text-sm">
          <p className="flex justify-between">
            <span className="text-default-500">Provider:</span>
            <span className="font-medium">
              {settings.api_type === "azure" ? "Azure OpenAI" : "OpenAI"}
            </span>
          </p>
          <p className="mt-2 flex justify-between">
            <span className="text-default-500">Temperature:</span>
            <span className="font-medium">
              {settings.temperature.toFixed(1)}
            </span>
          </p>
          <p className="mt-2 flex justify-between">
            <span className="text-default-500">Max Tokens:</span>
            <span className="font-medium">{settings.maxTokens}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModelSettings;
