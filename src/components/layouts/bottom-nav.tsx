"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "~/lib/utils";
import { Button } from "../ui/button";
import { Pickaxe } from "../icons/pickaxe";
import { Store, ListChecks, BarChart3, Wallet } from "lucide-react";

const items = [
  {
    label: "MINING",
    icon: Pickaxe,
    href: "/",
  },
  {
    label: "DAO",
    icon: Store,
    href: "/dao",
  },
  {
    label: "TASKS",
    icon: ListChecks,
    href: "/tasks",
  },
  {
    label: "STATS",
    icon: BarChart3,
    href: "/stats",
  },
  {
    label: "WALLET",
    icon: Wallet,
    href: "/wallet",
  },
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 h-16 border-t bg-background/80 backdrop-blur-lg">
      <nav className="mx-auto flex h-full max-w-md items-center justify-around px-6">
        {items.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            size="lg"
            className={cn(
              "flex h-12 w-12 flex-col items-center justify-center gap-1 rounded-xl p-0",
              pathname === item.href && "bg-accent text-accent-foreground"
            )}
            onClick={() => router.push(item.href)}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Button>
        ))}
      </nav>
    </div>
  );
} 