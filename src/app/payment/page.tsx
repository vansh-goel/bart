"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TokenSelector } from "@/components/TokenSelector";
import {
  ItemData,
  PricesResponse,
  QuoteResponse,
  Token,
} from "@/types/jupiterApiResponseTypes";
import axios from "axios";
import { toast } from "react-toastify";

export default function PaymentPage() {
  const searchParams = useSearchParams();

  const [tokens, setTokens] = useState<Token[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [itemData, setItemData] = useState<ItemData | null>(null);
  const [usdcDecimals, setUsdcDecimals] = useState<number | null>(null);
  const [inputTokenDecimals, setInputTokenDecimals] = useState<number | null>(
    null
  );
  const [prices, setPrices] = useState<PricesResponse | null>(null);
  const [amountToSwap, setAmountToSwap] = useState<number | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);

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

  const fetchQuote = async (inputMint: string, amount: number) => {
    const outputMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const slippageBps = 50;
    const swapMode = "ExactIn";

    if (inputMint === outputMint) {
      toast.error(
        "Input and output tokens cannot be the same. Please select a different token."
      );
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount greater than zero.");
      return;
    }

    console.log("Amount:" + amount);
    const amountToSend = Math.ceil(amount);
    console.log("Amount To Send: " + amountToSend);

    try {
      const response = await axios.get(`https://api.jup.ag/swap/v1/quote`, {
        params: {
          inputMint,
          outputMint,
          amount: amountToSend.toString(), // Ensure amount is sent as a string
          slippageBps,
          swapMode,
        },
        headers: {
          Accept: "application/json",
        },
      });
      setQuote(response.data);
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching quote:", error);
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
    if (selectedToken && amountToSwap !== null) {
      fetchQuote(selectedToken.address, amountToSwap);
    }
  }, [selectedToken, amountToSwap]);

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
        setTokens(data);
        setFilteredTokens(data.slice(0, 50));

        if (itemData?.tokenMint) {
          const itemToken = data.find(
            (token: Token) => token.address === itemData.tokenMint
          );
          if (itemToken) {
            setSelectedToken(itemToken);
          } else {
            const defaultToken = data.find(
              (token: Token) => token.symbol === "USDC"
            );
            if (defaultToken) {
              setSelectedToken(defaultToken);
            }
          }
        } else {
          const defaultToken = data.find(
            (token: Token) => token.symbol === "USDC"
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
                  <button className="w-full max-h-6 p-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg text-lg font-medium shadow-lg hover:shadow-xl transition-all grid place-content-center text-white duration-300">
                    Proceed to Payment
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
