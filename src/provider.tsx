import type { NavigateOptions } from "react-router-dom";

import React, { createContext, useContext, useState } from "react";
import { HeroUIProvider } from "@heroui/system";
import { useHref, useNavigate } from "react-router-dom";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

// 新增 ModeLanguageContext
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

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  // 新增全域 state
  const [mode, setMode] = useState("");
  const [userLanguage, setUserLanguage] = useState("");

  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      <ModeLanguageContext.Provider
        value={{ mode, setMode, userLanguage, setUserLanguage }}
      >
        {children}
      </ModeLanguageContext.Provider>
    </HeroUIProvider>
  );
}
