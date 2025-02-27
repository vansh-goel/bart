"use client";

import * as React from "react";
const NextThemesProvider = dynamic(
  () => import("next-themes").then((e) => e.ThemeProvider),
  {
    ssr: false,
  }
);

import dynamic from "next/dynamic";

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
