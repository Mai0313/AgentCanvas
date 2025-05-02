import React from "react";
import { ModelSetting } from "../types";
// import { Input } from "@heroui/input";
// import { Select, SelectItem } from "@heroui/select";
// import { Accordion, AccordionItem } from "@heroui/accordion";

interface ModelSettingsProps {
  settings: ModelSetting;
  onSettingsChange: (settings: ModelSetting) => void;
}

const ModelSettings: React.FC<ModelSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    onSettingsChange({
      ...settings,
      [name]: value,
    });
  };

  // Handle numeric inputs like temperature and maxTokens
  const handleNumericChange = (name: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onSettingsChange({
        ...settings,
        [name]: numValue,
      });
    }
  };

  return (
    <div className="model-settings">
      {/* <Accordion isCompact>
        <AccordionItem
          key="api-settings"
          aria-label="API Settings"
          title="API Settings"
          startContent={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 22H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 8V6C5 4.89543 5.89543 4 7 4H17C18.1046 4 19 4.89543 19 6V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 17.5V18C7 19.1046 7.89543 20 9 20H15C16.1046 20 17 19.1046 17 18V17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="3" y="8" width="18" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="13" r="2" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          }
        >
          <div className="space-y-3 px-1">
            <div className="api-type">
              <Select
                name="api_type"
                label="API Type"
                placeholder="Select API type"
                selectedKeys={[settings.api_type]}
                className="w-full"
                onChange={(e) => {
                  const value = e.target.value;
                  onSettingsChange({
                    ...settings,
                    api_type: value as "openai" | "azure",
                  });
                }}
              >
                <SelectItem key="openai">OpenAI</SelectItem>
                <SelectItem key="azure">Azure OpenAI</SelectItem>
              </Select>
            </div>
            
            <div className="base-url">
              <Input
                type="text"
                name="baseUrl"
                label="API Base URL"
                placeholder={settings.api_type === "azure" ? "https://your-resource.openai.azure.com" : "https://api.openai.com"}
                value={settings.baseUrl}
                onChange={handleChange}
              />
            </div>
            
            <div className="api-key">
              <Input
                type="password"
                name="apiKey"
                label="API Key"
                placeholder="Enter your API key"
                value={settings.apiKey}
                onChange={handleChange}
              />
            </div>
            
            {settings.api_type === "azure" && (
              <>
                <div className="azure-deployment">
                  <Input
                    type="text"
                    name="azureDeployment"
                    label="Azure Deployment Name"
                    placeholder="Enter deployment name"
                    value={settings.azureDeployment || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="azure-api-version">
                  <Input
                    type="text"
                    name="azureApiVersion"
                    label="Azure API Version"
                    placeholder="e.g., 2023-05-15"
                    value={settings.azureApiVersion || ""}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}
          </div>
        </AccordionItem>

        <AccordionItem
          key="advanced-settings"
          aria-label="Advanced Settings"
          title="Advanced Settings"
          startContent={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19.4 15C19.1277 15.6171 19.2583 16.3378 19.73 16.82L19.79 16.88C20.1643 17.2544 20.3728 17.7692 20.3728 18.305C20.3728 18.8408 20.1643 19.3556 19.79 19.73C19.4156 20.1043 18.9008 20.3128 18.365 20.3128C17.8292 20.3128 17.3144 20.1043 16.94 19.73L16.88 19.67C16.3978 19.1983 15.6772 19.0677 15.06 19.34C14.4515 19.6022 14.0608 20.2072 14.06 20.87V21C14.06 21.5304 13.8493 22.0391 13.4742 22.4142C13.0991 22.7893 12.5904 23 12.06 23C11.5296 23 11.0209 22.7893 10.6458 22.4142C10.2707 22.0391 10.06 21.5304 10.06 21V20.91C10.0492 20.237 9.63833 19.6322 9.01997 19.38C8.40274 19.1077 7.68219 19.2383 7.19997 19.71L7.13997 19.77C6.76555 20.1443 6.25073 20.3528 5.71497 20.3528C5.17921 20.3528 4.66439 20.1443 4.28997 19.77C3.91567 19.3956 3.7072 18.8808 3.7072 18.345C3.7072 17.8092 3.91567 17.2944 4.28997 16.92L4.34997 16.86C4.82167 16.3778 4.95225 15.6572 4.67997 15.04C4.41776 14.4315 3.81276 14.0408 3.14997 14.04H2.99997C2.46955 14.04 1.96086 13.8293 1.58577 13.4542C1.21068 13.0791 0.999969 12.5704 0.999969 12.04C0.999969 11.5096 1.21068 11.0009 1.58577 10.6258C1.96086 10.2507 2.46955 10.04 2.99997 10.04H3.08997C3.76297 10.0292 4.36776 9.61836 4.61997 9C4.89224 8.38275 4.76166 7.6622 4.28997 7.18L4.22997 7.12C3.85567 6.74558 3.6472 6.23076 3.6472 5.695C3.6472 5.15923 3.85567 4.64442 4.22997 4.27C4.60439 3.89569 5.1192 3.68722 5.65497 3.68722C6.19073 3.68722 6.70554 3.89569 7.07997 4.27L7.13997 4.33C7.62219 4.80169 8.34274 4.93227 8.95997 4.66L8.99997 4.65C9.60844 4.38789 9.99914 3.78289 9.99997 3.12V3C9.99997 2.46957 10.2107 1.96086 10.5858 1.58579C10.9608 1.21071 11.4695 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0008 3.75287 14.3915 4.35787 15 4.62C15.6172 4.8923 16.3378 4.76172 16.82 4.29L16.88 4.23C17.2544 3.85569 17.7692 3.64722 18.305 3.64722C18.8408 3.64722 19.3556 3.85569 19.73 4.23C20.1043 4.60442 20.3128 5.11923 20.3128 5.655C20.3128 6.19077 20.1043 6.70558 19.73 7.08L19.67 7.14C19.1983 7.62223 19.0677 8.34277 19.34 8.96V9C19.6022 9.60844 20.2072 9.99914 20.87 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.2471 14.0008 19.6421 14.3915 19.38 15L19.4 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        >
          <div className="space-y-3 px-1">
            <div className="temperature">
              <Input
                type="number"
                name="temperature"
                label="Temperature"
                placeholder="0.0 - 1.0"
                description="Controls randomness (0.0 is deterministic, 1.0 is creative)"
                min={0}
                max={1}
                step={0.1}
                value={settings.temperature.toString()}
                onChange={(e) => handleNumericChange("temperature", e.target.value)}
              />
            </div>
            
            <div className="max-tokens">
              <Input
                type="number"
                name="maxTokens"
                label="Max Tokens"
                placeholder="e.g., 2048"
                description="Maximum length of generated response"
                min={1}
                value={settings.maxTokens.toString()}
                onChange={(e) => handleNumericChange("maxTokens", e.target.value)}
              />
            </div>
          </div>
        </AccordionItem>
      </Accordion> */}
    </div>
  );
};

export default ModelSettings;
