"use client";

import { ThemeToggle } from "~/components/utils/theme-toggle";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Настройки</h3>
        <p className="text-sm text-muted-foreground">
          Управляйте настройками приложения
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Тема</p>
            <p className="text-sm text-muted-foreground">
              Выберите светлую или тёмную тему
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
} 