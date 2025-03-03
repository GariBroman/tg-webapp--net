"use client";

import { TonConnectButton } from "@tonconnect/ui-react";
import { Button } from "~/components/ui/button";
import { useTonWallet } from "@tonconnect/ui-react";
import { formatTonAddress } from "../../lib/ton-utils";

export function CustomTonConnectButton() {
  const wallet = useTonWallet();
  
  return (
    <TonConnectButton />
  );
}

/**
 * Кнопка для подключения TON кошелька с кастомным дизайном
 */
export function CustomTonButton({ 
  variant = "default", 
  size = "default",
  className = "",
  onClick
}: { 
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link",
  size?: "default" | "sm" | "lg" | "icon",
  className?: string,
  onClick?: () => void
}) {
  const wallet = useTonWallet();
  
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={onClick}
    >
      {wallet ? formatTonAddress(wallet.account.address) : "Подключить кошелёк"}
    </Button>
  );
} 