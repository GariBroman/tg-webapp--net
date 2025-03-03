"use client";

import { useRouter } from "next/navigation";

export function MiningHeader() {
  const router = useRouter();

  return (
    <div className="border-b">
      <div className="flex h-16 items-center justify-between bg-card px-4">
        <div 
          className="text-xl font-bold cursor-pointer" 
          onClick={() => router.push("/game-selector")}
        >
          Hashcash
        </div>
      </div>
    </div>
  );
} 