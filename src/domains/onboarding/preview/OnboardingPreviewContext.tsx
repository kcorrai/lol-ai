"use client";

import { createContext, useContext } from "react";

interface OnboardingPreviewValue {
  // True while the forced first-journey (TASK-217) is running. Empty tabs read this to render an
  // illustrative, clearly-labelled preview of their populated state instead of a bare empty box,
  // so the guided tour can actually *show* each section rather than just describe it (TASK-219).
  previewActive: boolean;
}

const OnboardingPreviewContext = createContext<OnboardingPreviewValue>({ previewActive: false });

export function OnboardingPreviewProvider({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <OnboardingPreviewContext.Provider value={{ previewActive: active }}>
      {children}
    </OnboardingPreviewContext.Provider>
  );
}

export function useOnboardingPreview(): OnboardingPreviewValue {
  return useContext(OnboardingPreviewContext);
}
