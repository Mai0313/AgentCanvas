import type { NavigateOptions } from "react-router-dom";

import React, { createContext, useContext, useState } from "react";
import { HeroUIProvider } from "@heroui/system";
import { useHref, useNavigate } from "react-router-dom";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

// ModeLanguage Context
export interface ModeLanguageContextType {
  mode: string;
  setMode: (mode: string) => void;
  userLanguage: string;
  setUserLanguage: (lang: string) => void;
}

const ModeLanguageContext = createContext<ModeLanguageContextType | undefined>(
  undefined,
);

export function useModeLanguage() {
  const ctx = useContext(ModeLanguageContext);

  if (!ctx)
    throw new Error("useModeLanguage must be used within ModeLanguageProvider");

  return ctx;
}

// Generation Status Context
export interface GenerationStatusContextType {
  generatingImageMessageId: string | null;
  setGeneratingImageMessageId: (id: string | null) => void;
  generatingCodeMessageId: string | null;
  setGeneratingCodeMessageId: (id: string | null) => void;
  isGeneratingImage: (messageId: string) => boolean;
  isGeneratingCode: (messageId: string) => boolean;
}

const GenerationStatusContext = createContext<
  GenerationStatusContextType | undefined
>(undefined);

export function useGenerationStatus() {
  const ctx = useContext(GenerationStatusContext);

  if (!ctx) throw new Error("useGenerationStatus must be used within Provider");

  return ctx;
}

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  // Mode and language state
  const [mode, setMode] = useState("");
  const [userLanguage, setUserLanguage] = useState("");

  // Generation status state
  const [generatingImageMessageId, setGeneratingImageMessageId] = useState<
    string | null
  >(null);
  const [generatingCodeMessageId, setGeneratingCodeMessageId] = useState<
    string | null
  >(null);

  // Helper functions to check if a specific message is generating
  const isGeneratingImage = (messageId: string): boolean =>
    generatingImageMessageId === messageId;

  const isGeneratingCode = (messageId: string): boolean =>
    generatingCodeMessageId === messageId;

  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      <ModeLanguageContext.Provider
        value={{ mode, setMode, userLanguage, setUserLanguage }}
      >
        <GenerationStatusContext.Provider
          value={{
            generatingImageMessageId,
            setGeneratingImageMessageId,
            generatingCodeMessageId,
            setGeneratingCodeMessageId,
            isGeneratingImage,
            isGeneratingCode,
          }}
        >
          {children}
        </GenerationStatusContext.Provider>
      </ModeLanguageContext.Provider>
    </HeroUIProvider>
  );
}
