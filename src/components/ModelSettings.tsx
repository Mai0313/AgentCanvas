import React, { useState, useEffect, useCallback } from "react";

import { ModelSetting } from "../types";
import { fetchModels } from "../services/openai";

interface ModelSettingsProps {
  settings: ModelSetting;
  onSettingsChange: (settings: ModelSetting) => void;
}

const ModelSettings: React.FC<ModelSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const [models, setModels] = useState<Array<{ id: string }>>([]);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    onSettingsChange({
      ...settings,
      [name]: value,
    });
  };

  // Use useCallback to memoize the function
  const fetchModelsList = useCallback(async () => {
    if (!settings.apiKey || !settings.baseUrl) return;

    try {
      await fetchModels(settings, {
        onStart: () => setIsLoadingModels(true),
        onSuccess: (modelsList) => {
          setModels(modelsList);
          console.log("Fetched models:", modelsList);
        },
        onError: (error) => console.error("Failed to fetch models:", error),
        onComplete: () => setIsLoadingModels(false),
      });
    } catch (error) {
      // Any additional error handling specific to the component (optional)
    }
  }, [settings]); // Include settings as a dependency

  useEffect(() => {
    if (settings.apiKey && settings.baseUrl) {
      fetchModelsList();
    }
  }, [settings.apiKey, settings.baseUrl, fetchModelsList]); // Include fetchModelsList in dependencies

  return (
    <div className="model-settings">
      <h3>Model Settings</h3>

      <div className="settings-group">
        <label>Model</label>
        <select name="model" value={settings.model} onChange={handleChange}>
          {isLoadingModels ? (
            <option value="">Loading models...</option>
          ) : models.length > 0 ? (
            models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.id}
              </option>
            ))
          ) : (
            <option value="gpt-4o">gpt-4o</option>
          )}
        </select>
      </div>
    </div>
  );
};

export default ModelSettings;
