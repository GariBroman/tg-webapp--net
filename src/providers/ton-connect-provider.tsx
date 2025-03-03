"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { ReactNode } from "react";

// Манифест для TON Connect
const manifestUrl = "https://tg-webapp-mir.loca.lt/tonconnect-manifest.json";

export function TonConnectProvider({ children }: { children: ReactNode }) {
  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      {children}
    </TonConnectUIProvider>
  );
} 