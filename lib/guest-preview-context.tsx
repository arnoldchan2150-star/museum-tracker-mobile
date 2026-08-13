import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";

type GuestPreviewContextValue = {
  isGuestPreview: boolean;
  enterGuestPreview: () => void;
  exitGuestPreview: () => void;
};

const GuestPreviewContext = createContext<GuestPreviewContextValue | null>(null);

export function GuestPreviewProvider({ children }: PropsWithChildren) {
  const [isGuestPreview, setIsGuestPreview] = useState(false);
  const value = useMemo(() => ({
    isGuestPreview,
    enterGuestPreview: () => setIsGuestPreview(true),
    exitGuestPreview: () => setIsGuestPreview(false),
  }), [isGuestPreview]);
  return <GuestPreviewContext.Provider value={value}>{children}</GuestPreviewContext.Provider>;
}

export function useGuestPreview(): GuestPreviewContextValue {
  const context = useContext(GuestPreviewContext);
  if (!context) throw new Error("useGuestPreview must be used inside GuestPreviewProvider");
  return context;
}
