"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CheckCircle2, Clock } from "lucide-react";

export default function TasksPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="scroll-m-20 text-3xl font-extrabold">TASKS</h1>
        <p className="text-muted-foreground">
          Выполняйте задания и получайте вознаграждения
        </p>
      </div>

      <div className="space-y-4">
        <TaskCard 
          title="Ежедневный вход"
          description="Войдите в приложение каждый день"
          reward={10}
          completed={true}
        />
        
        <TaskCard 
          title="Пригласить друга"
          description="Пригласите друга и получите бонус"
          reward={50}
          completed={false}
        />
        
        <TaskCard 
          title="Подписаться на канал"
          description="Подпишитесь на наш Telegram канал"
          reward={20}
          completed={false}
        />
        
        <TaskCard 
          title="Первая покупка"
          description="Совершите первую покупку в магазине"
          reward={100}
          completed={false}
        />
      </div>
    </>
  );
}

interface TaskCardProps {
  title: string;
  description: string;
  reward: number;
  completed: boolean;
}

function TaskCard({ title, description, reward, completed }: TaskCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {completed ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Clock className="h-5 w-5 text-yellow-500" />
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="font-medium">
            Награда: <span className="text-primary">{reward} ⭐</span>
          </div>
          <Button 
            variant={completed ? "outline" : "default"} 
            size="sm" 
            disabled={completed}
          >
            {completed ? "Выполнено" : "Выполнить"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 