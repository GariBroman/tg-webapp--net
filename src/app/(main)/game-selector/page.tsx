"use client";

import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

export default function GameSelectorPage() {
  const router = useRouter();

  const games = [
    {
      id: "tapper",
      name: "Тапалка",
      description: "Кликайте и зарабатывайте очки",
      route: "/"
    },
    {
      id: "agario",
      name: "AgarioWar",
      description: "Сетевая игра в стиле Agar.io",
      route: "/agario"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Выберите игру</h3>
        <p className="text-sm text-muted-foreground">
          Доступные игры для майнинга
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {games.map((game) => (
          <Card 
            key={game.id}
            className="p-6 cursor-pointer hover:bg-accent"
            onClick={() => router.push(game.route)}
          >
            <h4 className="font-medium mb-2">{game.name}</h4>
            <p className="text-sm text-muted-foreground">{game.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
} 