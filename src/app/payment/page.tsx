"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TokenSelector } from "@/components/TokenSelector";
import { Connection, PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { swapAndPay } from "@/utils/swapAndPay";
import {
  ItemData,
  PricesResponse,
  Token,
} from "@/types/jupiterApiResponseTypes";
import axios from "axios";
import { toast } from "react-toastify";
import { Loader } from "lucide-react";

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const wallet = useWallet();
  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com"
  );

  const [tokens, setTokens] = useState<Token[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [itemData, setItemData] = useState<ItemData | null>(null);
  const [usdcDecimals, setUsdcDecimals] = useState<number | null>(null);
  const [inputTokenDecimals, setInputTokenDecimals] = useState<number | null>(
    null
  );
  const [prices, setPrices] = useState<PricesResponse | null>(null);
  const [amountToSwap, setAmountToSwap] = useState<number | null>(null);

  const fetchTokenDecimals = async (
    mintAddress: string,
    setDecimals: (decimals: number) => void
  ) => {
    try {
      const response = await axios.get(
        `https://tokens.jup.ag/tokens/v1/token/${mintAddress}`
      );
      setDecimals(response.data.decimals);
    } catch (error) {
      console.error("Error fetching token decimals:", error);
      if (axios.isAxiosError(error)) {
        console.error("Axios error message:", error.message);
      } else {
        console.error("Unexpected error:", error);
      }
    }
  };

  const handlePayment = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!selectedToken || amountToSwap === null || !itemData) {
      toast.error("Missing required information for payment");
      return;
    }

    try {
      setIsProcessing(true);

      const result = await swapAndPay(
        connection,
        new PublicKey(selectedToken.address),
        amountToSwap,
        new PublicKey(itemData.sellerWallet),
        wallet,
        50
      );
      toast.success(`Payment successful! Transaction: ${result.signature}`);
    } catch (error) {
      console.error("Payment failed:", error);
      toast.error(`Payment failed`);
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchPrices = async (inputMint: string) => {
    const outputMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    try {
      const response = await axios.get(`https://api.jup.ag/price/v2`, {
        params: {
          ids: `${inputMint},${outputMint}`,
        },
      });
      setPrices(response.data);
    } catch (error) {
      console.error("Error fetching prices:", error);
      if (axios.isAxiosError(error)) {
        console.error("Axios error message:", error.message);
      } else {
        console.error("Unexpected error:", error);
      }
    }
  };

  useEffect(() => {
    fetchTokenDecimals(
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      setUsdcDecimals
    );
  }, []);

  useEffect(() => {
    if (selectedToken) {
      fetchTokenDecimals(selectedToken.address, setInputTokenDecimals);
      fetchPrices(selectedToken.address);
    }
  }, [selectedToken]);

  useEffect(() => {
    if (prices && itemData && usdcDecimals && inputTokenDecimals) {
      const inputPrice = parseFloat(
        prices?.data[selectedToken?.address || ""]?.price || "0"
      );
      const outputPrice = parseFloat(
        prices?.data["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"]?.price ||
          "0"
      );
      const itemPrice = itemData.price;

      if (inputPrice && outputPrice) {
        const calculatedAmount = (outputPrice / inputPrice) * itemPrice;
        const amountToSwap = calculatedAmount * 10 ** inputTokenDecimals;
        setAmountToSwap(amountToSwap);
      }
    }
  }, [prices, itemData, usdcDecimals, inputTokenDecimals]);

  useEffect(() => {
    setMounted(true);
    const itemParam = searchParams?.get("item");
    if (itemParam) {
      try {
        const decodedItem = JSON.parse(
          decodeURIComponent(itemParam)
        ) as ItemData;
        setItemData(decodedItem);
      } catch (error) {
        console.error("Error parsing item data:", error);
      }
    }

    const fetchTokens = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          "https://tokens.jup.ag/tokens?tags=verified"
        );
        const data = await response.json();
        const filteredData = data.filter(
          (token: Token) => token.symbol !== "USDC"
        );
        setTokens(filteredData);
        setFilteredTokens(filteredData.slice(0, 50));

        if (itemData?.tokenMint) {
          const itemToken = data.find(
            (token: Token) => token.address === itemData.tokenMint
          );
          if (itemToken) {
            setSelectedToken(itemToken);
          } else {
            const defaultToken = data.find(
              (token: Token) => token.symbol === "SOL"
            );
            if (defaultToken) {
              setSelectedToken(defaultToken);
            }
          }
        } else {
          const defaultToken = data.find(
            (token: Token) => token.symbol === "SOL"
          );
          if (defaultToken) {
            setSelectedToken(defaultToken);
          }
        }
      } catch (error) {
        console.error("Error fetching tokens:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
  }, [searchParams, itemData?.tokenMint]);

  if (!mounted) {
    return null;
  }

  const displayItem = itemData;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-600">
      <div className="absolute flex gap-2 items-center top-4 left-4">
        <h2 className="text-2xl font-semibold text-center text-gray-600 dark:text-gray-300">
          Powered by <span className="text-purple-600">Bart</span>
        </h2>
      </div>
      <div className="container mx-auto py-12 px-4 max-w-6xl">
        <div>
          <h1 className="text-3xl font-bold mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-gray-600 dark:from-blue-400 dark:to-purple-400">
            Complete Your Purchase
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Item details */}
          <div>
            <div className="h-fit overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 pb-4">
                <h2 className="text-xl text-blue-800 dark:text-blue-200 p-2">
                  Item Details
                </h2>
              </div>
              <div className="p-4">
                <div className="flex flex-col items-center mb-4">
                  <div className="w-full mb-6 rounded-lg overflow-hidden shadow-md">
                    {displayItem ? (
                      <img
                        src={displayItem?.image}
                        alt={displayItem?.name}
                        className="w-full max-w-xs mx-auto object-cover"
                      />
                    ) : null}
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                    {displayItem?.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mt-3 text-center">
                    {displayItem?.description}
                  </p>
                  <div className="mt-6 text-lg font-medium px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 shadow-sm">
                    Price: {displayItem?.price} {displayItem?.tokenSymbol}
                  </div>
                  <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    Token Mint: {displayItem?.tokenMint.slice(0, 8)}...
                    {displayItem?.tokenMint.slice(-8)}
                  </div>
                  <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    Seller: {displayItem?.sellerWallet}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/*  Payment options */}
          <div>
            <div className="h-fit rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 pb-4">
                <h2 className="text-xl text-blue-800 dark:text-blue-200 p-2">
                  Payment Details
                </h2>
              </div>
              <div className="p-6">
                <TokenSelector
                  tokens={tokens}
                  filteredTokens={filteredTokens}
                  setFilteredTokens={setFilteredTokens}
                  selectedToken={selectedToken}
                  setSelectedToken={setSelectedToken}
                  isLoading={isLoading}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
                <div className="pt-4">
                  <button
                    onClick={handlePayment}
                    className="w-full max-h-6 p-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg text-lg font-medium shadow-lg hover:shadow-xl transition-all grid place-content-center text-white duration-300"
                  >
                    {isProcessing ? (
                      <div className="flex gap-2 items-center">
                        Processing
                        <Loader className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      "Proceed to Payment"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
