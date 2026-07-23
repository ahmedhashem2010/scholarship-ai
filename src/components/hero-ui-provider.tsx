"use client";

import { HeroUIProvider as NextUIProvider } from "@heroui/react";
import { useRouter } from "next/navigation";
import { type ReactNode } from "react";

export function HeroUIProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <NextUIProvider navigate={router.push}>
      {children}
    </NextUIProvider>
  );
}
