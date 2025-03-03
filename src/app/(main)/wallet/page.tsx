"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { Progress } from "~/components/ui/progress";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Settings } from "lucide-react";
import { useTonAddress, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { formatNanoTon } from "../../../lib/ton-utils";
import { useRouter } from "next/navigation";

export default function WalletPage() {
  const { data: user } = api.tg.getUser.useQuery();
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const router = useRouter();
  const userFriendlyAddress = useTonAddress();
  
  // Проверяем, подключен ли кошелек
  const isConnected = !!wallet;
  
  // Функция для подключения TON кошелька
  const connectWallet = () => {
    tonConnectUI.openModal();
  };
  
  // Функция для отключения TON кошелька
  const disconnectWallet = () => {
    tonConnectUI.disconnect();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Кошелёк</h3>
          <p className="text-sm text-muted-foreground">
            Управляйте своим TON кошельком
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/settings")}
        >
          <Settings className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Настройки</span>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Мой баланс</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">MAXTON</span>
            <span className="font-mono font-bold">{user?.tapCount || 0}</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Энергия</span>
              <span className="font-mono font-bold">2,000</span>
            </div>
            <Progress value={65} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {isConnected ? (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>TON Кошелёк</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-muted-foreground">Баланс</div>
                  <div className="font-mono font-bold">
                    {wallet?.balance ? formatNanoTon(wallet.balance) : "0"} TON
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground truncate max-w-[200px]">
                    {userFriendlyAddress}
                  </div>
                </div>
                <WalletIcon className="h-10 w-10 text-primary" />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 w-full"
                onClick={disconnectWallet}
              >
                Отключить кошелёк
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              size="lg" 
              className="w-full flex items-center justify-center"
              onClick={() => tonConnectUI.openModal()}
            >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Отправить
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full flex items-center justify-center"
              onClick={() => {
                // Копируем адрес в буфер обмена
                if (userFriendlyAddress) {
                  navigator.clipboard.writeText(userFriendlyAddress);
                  // Здесь можно добавить уведомление о копировании
                }
              }}
            >
              <ArrowDownLeft className="mr-2 h-4 w-4" />
              Получить
            </Button>
          </div>

          <div className="mt-6">
            <h2 className="mb-4 text-xl font-bold">История транзакций</h2>
            <div className="space-y-3">
              <TransactionItem 
                type="buy"
                amount="5 MAXTON"
                date="Сегодня, 12:45"
                price="0.1 TON"
              />
              <TransactionItem 
                type="buy"
                amount="10 MAXTON"
                date="Вчера, 18:30"
                price="0.2 TON"
              />
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <Button size="lg" className="w-full" onClick={connectWallet}>
            Подключить TON Кошелёк
          </Button>
          
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Подключите TON кошелёк, чтобы покупать MAXTON и другие товары в DAO
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

interface TransactionItemProps {
  type: "buy" | "sell";
  amount: string;
  date: string;
  price: string;
}

function TransactionItem({ type, amount, date, price }: TransactionItemProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center">
        {type === "buy" ? (
          <ArrowDownLeft className="mr-3 h-5 w-5 text-green-500" />
        ) : (
          <ArrowUpRight className="mr-3 h-5 w-5 text-red-500" />
        )}
        <div>
          <div className="font-medium">{amount}</div>
          <div className="text-xs text-muted-foreground">{date}</div>
        </div>
      </div>
      <div className="font-mono font-medium">{price}</div>
    </div>
  );
} 