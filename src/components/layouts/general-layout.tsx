"use client";

import { type PropsWithChildren } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BottomNav } from "./bottom-nav";

const GeneralLayout = ({ children }: PropsWithChildren) => {
  const router = useRouter();
  const pathname = usePathname();
  const isMobileDevice = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <>
      {/* Добавляем отступ для мобильных устройств */}
      {isMobileDevice && <div className="h-16" />}

      <div className="flex">
        <main className="w-full pb-20">
          <div className="h-full max-w-full px-4 py-4 md:max-w-screen-lg lg:px-8">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </>
  );
};

export default GeneralLayout;
