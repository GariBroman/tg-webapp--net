"use client";

import { useEffect } from "react";
import { Card } from "~/components/ui/card";

export default function AgarioPage() {
  useEffect(() => {
    // Здесь будет инициализация игры Agar.io
    // TODO: Добавить интеграцию с https://github.com/owenashurst/agar.io-clone.git
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">AgarioWar</h3>
        <p className="text-sm text-muted-foreground">
          Сетевая игра в стиле Agar.io
        </p>
      </div>

      <Card className="aspect-video w-full">
        <div id="game-container" className="w-full h-full" />
      </Card>
    </div>
  );
} 