"use client";

import { useState, useEffect } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import LandingPage from "@/components/LandingPage";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <WalletProvider wallets={[]}>
        <WalletModalProvider>
          <LandingPage />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
