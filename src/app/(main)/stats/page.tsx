"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/react";

export default function StatsPage() {
  const { data: user } = api.tg.getUser.useQuery();
  
  return (
    <>
      <div className="mb-6">
        <h1 className="scroll-m-20 text-3xl font-extrabold">STATS</h1>
        <p className="text-muted-foreground">
          Статистика и информация о вашей активности
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Block" value="#1" />
        <StatCard title="Difficulty" value="#!?#" />
        <StatCard title="Reward" value="#!?#" />
        <StatCard title="Online" value="#!?#" />
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-2xl font-bold">Mining of Real USDT Rewards</h2>
        <p className="text-sm text-muted-foreground">
          Hashcash is backed by USDT and current ratio is 1 Hashcash = 1 USDT, 
          meaning the more correct hashes you found—the more USDT you receive. 
          All Memhash spent on upgrades for this mining will be refunded after completion.
        </p>
      </div>

      <div className="mt-8">
        <p className="text-sm text-muted-foreground">
          Access to Hashcash is limited to people who hold <span className="font-bold">at least 50%</span> of 
          mined $MEMHASH balance.
        </p>
      </div>
    </>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
}

function StatCard({ title, value }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-mono font-bold">{value}</div>
      </CardContent>
    </Card>
  );
} 