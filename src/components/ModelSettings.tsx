import React, { useState } from "react";
import { Divider } from "@heroui/divider";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import { ModelSetting } from "../types";

interface ModelSettingsProps {
  settings: ModelSetting;
  onSettingsChange: (settings: ModelSetting) => void;
}

const ModelSettings: React.FC<ModelSettingsProps> = ({ settings }) => {
  return (
    <div className="model-settings">
      {/* 只保留最小必要的信息，移除 API settings 和 advanced Settings */}
      <div className="model-info mt-4">
        <div className="flex items-center gap-2 my-4">
          <span className="text-xs text-default-500">Model Information</span>
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

interface ModelSettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: ModelSetting;
  onSettingsChange: (settings: ModelSetting) => void;
}

export const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
  open,
  onClose,
  settings,
  onSettingsChange,
}) => {
  const [form, setForm] = useState<ModelSetting>(settings);

  // 判斷是否有環境變數 VITE_API_KEY
  const isApiKeyEnv = Boolean(import.meta.env.VITE_API_KEY);

  React.useEffect(() => {
    setForm(settings);
  }, [settings, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "temperature"
          ? parseFloat(value)
          : name === "maxTokens"
            ? parseInt(value)
            : value,
    }));
  };

  const handleSave = () => {
    onSettingsChange(form);
    onClose();
  };

  return (
    <Modal isOpen={open} placement="center" onClose={onClose}>
      <ModalContent>
        <ModalHeader>編輯 Model 設定</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1" htmlFor="api_type">
              <span>API Type</span>
              <select
                className="border rounded px-2 py-1"
                disabled={isApiKeyEnv}
                id="api_type"
                name="api_type"
                value={form.api_type}
                onChange={handleChange}
              >
                <option value="openai">OpenAI</option>
                <option value="azure">Azure OpenAI</option>
              </select>
            </label>
            <label className="flex flex-col gap-1" htmlFor="model">
              <span>Model</span>
              <Input
                disabled={isApiKeyEnv}
                id="model"
                name="model"
                value={form.model}
                onChange={handleChange}
              />
            </label>
            <label className="flex flex-col gap-1" htmlFor="baseUrl">
              <span>Base URL</span>
              <Input
                disabled={isApiKeyEnv}
                id="baseUrl"
                name="baseUrl"
                value={form.baseUrl}
                onChange={handleChange}
              />
            </label>
            <label className="flex flex-col gap-1" htmlFor="apiKey">
              <span>API Key</span>
              <Input
                disabled={isApiKeyEnv}
                id="apiKey"
                name="apiKey"
                type="password"
                value={form.apiKey}
                onChange={handleChange}
              />
            </label>
            <label className="flex flex-col gap-1" htmlFor="temperature">
              <span>Temperature</span>
              <Input
                disabled={isApiKeyEnv}
                id="temperature"
                name="temperature"
                step="0.1"
                type="number"
                value={String(form.temperature)}
                onChange={handleChange}
              />
            </label>
            <label className="flex flex-col gap-1" htmlFor="maxTokens">
              <span>Max Tokens</span>
              <Input
                disabled={isApiKeyEnv}
                id="maxTokens"
                name="maxTokens"
                type="number"
                value={String(form.maxTokens)}
                onChange={handleChange}
              />
            </label>
            {form.api_type === "azure" && (
              <>
                <label
                  className="flex flex-col gap-1"
                  htmlFor="azureDeployment"
                >
                  <span>Azure Deployment</span>
                  <Input
                    disabled={isApiKeyEnv}
                    id="azureDeployment"
                    name="azureDeployment"
                    value={form.azureDeployment || ""}
                    onChange={handleChange}
                  />
                </label>
                <label
                  className="flex flex-col gap-1"
                  htmlFor="azureApiVersion"
                >
                  <span>Azure API Version</span>
                  <Input
                    disabled={isApiKeyEnv}
                    id="azureApiVersion"
                    name="azureApiVersion"
                    value={form.azureApiVersion || ""}
                    onChange={handleChange}
                  />
                </label>
              </>
            )}
            {isApiKeyEnv && (
              <div className="text-warning text-xs mt-2">
                此設定由公司內部環境變數鎖定，無法編輯。
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onClick={onClose}>
            取消
          </Button>
          <Button color="primary" disabled={isApiKeyEnv} onClick={handleSave}>
            儲存
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ModelSettings;
