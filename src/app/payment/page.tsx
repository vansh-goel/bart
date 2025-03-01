"use client";

import React, { useState, useEffect, Suspense } from "react";
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
import {
  Loader,
  Shield,
  CreditCard,
  Check,
  ChevronLeft,
  ArrowLeft,
} from "lucide-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

// Create a client component that uses search params
function PaymentContent() {
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
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>("");
  const [paymentStep, setPaymentStep] = useState<
    "select" | "confirm" | "success"
  >("select");
  const [redirectCountdown, setRedirectCountdown] = useState<number>(5);
  const [transactionSignature, setTransactionSignature] = useState<string>("");
  const [referrer, setReferrer] = useState<string>("");

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

    if (!walletAddress) {
      toast.error("Wallet address is required");
      return;
    }

    try {
      setIsProcessing(true);

      const result = await swapAndPay(
        connection,
        new PublicKey(selectedToken.address),
        amountToSwap,
        new PublicKey(walletAddress),
        wallet,
        50
      );

      // Store transaction signature
      setTransactionSignature(result.signature);

      // Set success state
      setPaymentStep("success");
      toast.success(`Payment successful! Transaction: ${result.signature}`);

      const payer = wallet.publicKey;
      const userKey = searchParams?.get("userKey");
      if (userKey) {
        await fetch("/api/successfulTransaction", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userKey,
            price: itemData?.price,
            payer,
            productId,
          }),
        });
      }

      // Initialize countdown for redirect
      let countdownValue = 5;
      setRedirectCountdown(countdownValue);

      // Start countdown and redirect
      const countdownInterval = setInterval(() => {
        countdownValue -= 1;
        setRedirectCountdown(countdownValue);

        if (countdownValue <= 0) {
          clearInterval(countdownInterval);
          // Redirect back to referring page
          if (referrer) {
            window.location.href = referrer;
          } else {
            // Fallback if no referrer
            window.history.back();
          }
        }
      }, 1000);

      // Cleanup interval on component unmount or when payment step changes
      return () => clearInterval(countdownInterval);
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

    // Store referrer for later redirect
    if (document.referrer) {
      setReferrer(document.referrer);
    }

    // Read parameters safely
    try {
      const itemParam = searchParams?.get("item");
      const product = searchParams?.get("productId");
      const walletParam = searchParams?.get("wallet");
      const userKey = searchParams?.get("userKey");
      const referrerParam = searchParams?.get("referrer");

      // Priority: 1. referrer param, 2. document.referrer
      if (referrerParam) {
        setReferrer(referrerParam);
      }

      setWalletAddress(walletParam);
      setProductId(product);

      if (userKey) {
        const sendUserKey = async () => {
          const response = await fetch("/api/decodeUserKey", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ key: userKey }),
          });
          const data = await response.json();
          setWalletAddress(data.walletAddress);
          console.log(data);
        };
        sendUserKey();
      }

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
    } catch (error) {
      console.error("Error in search params processing:", error);
    }
  }, [searchParams, itemData?.tokenMint]);

  if (!mounted) {
    return null;
  }

  const displayItem = itemData;

  const formatAddress = (address: string | null) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const renderSuccessScreen = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 mb-6 rounded-full bg-green-100 flex items-center justify-center">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        Payment Successful!
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Your transaction has been completed successfully.
      </p>
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg w-full max-w-md mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-gray-500 dark:text-gray-400">Item:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {displayItem?.name}
          </span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-500 dark:text-gray-400">Amount:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {displayItem?.price} {displayItem?.tokenSymbol}
          </span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-500 dark:text-gray-400">Paid with:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {selectedToken?.symbol}
          </span>
        </div>
        {transactionSignature && (
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">
              Transaction:
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatAddress(transactionSignature)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3 text-purple-600 dark:text-purple-300 font-semibold">
          {redirectCountdown}
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Redirecting in {redirectCountdown} second
          {redirectCountdown !== 1 ? "s" : ""}...
        </p>
      </div>

      <button
        onClick={() => {
          if (referrer) {
            window.location.href = referrer;
          } else {
            window.history.back();
          }
        }}
        className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Return Now
      </button>
    </div>
  );

  const renderConfirmScreen = () => (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => setPaymentStep("select")}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white ml-2">
          Confirm Payment
        </h3>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
        <div className="flex justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-400">Item:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {displayItem?.name}
          </span>
        </div>
        <div className="flex justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-400">Price:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {displayItem?.price} {displayItem?.tokenSymbol}
          </span>
        </div>
        <div className="flex justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-400">Pay with:</span>
          <div className="flex items-center">
            <img
              src={selectedToken?.logoURI}
              alt={selectedToken?.symbol}
              className="w-5 h-5 mr-2"
            />
            <span className="font-medium text-gray-900 dark:text-white">
              {selectedToken?.symbol}
            </span>
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Recipient:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatAddress(walletAddress)}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              Secure Payment
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your transaction is protected by blockchain technology
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg text-lg font-medium shadow-lg hover:shadow-xl transition-all text-white duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isProcessing ? (
          <div className="flex items-center">
            <Loader className="h-5 w-5 animate-spin mr-2" />
            Processing Payment...
          </div>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            Confirm Payment
          </>
        )}
      </button>
    </div>
  );

  const renderSelectScreen = () => (
    <div className="p-6">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Select Payment Method
      </h3>
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
      <div className="mt-6 mb-4">
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3">
            <Shield className="h-4 w-4 text-green-600 dark:text-green-300" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Your transaction is secure and encrypted
          </p>
        </div>
      </div>
      <button
        onClick={() => setPaymentStep("confirm")}
        disabled={!selectedToken || isLoading}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg text-lg font-medium shadow-lg hover:shadow-xl transition-all text-white duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        Continue to Review
      </button>
    </div>
  );

  const renderPaymentStep = () => {
    switch (paymentStep) {
      case "success":
        return renderSuccessScreen();
      case "confirm":
        return renderConfirmScreen();
      case "select":
      default:
        return renderSelectScreen();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-x-hidden">
      {/* Header with progress indicator */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              <span className="text-purple-600 font-bold">Bart</span> Payment
            </h2>
          </div>
          {paymentStep !== "success" && <WalletMultiButton />}
        </div>

        {/* Progress steps - hide on success */}
        {paymentStep !== "success" && (
          <div className="container mx-auto px-4 pb-4">
            <div className="flex items-center">
              {/* Step 1 */}
              <div
                className={`w-8 h-8 rounded-full ${
                  paymentStep === "select" || paymentStep === "confirm"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-600 dark:bg-gray-700"
                } flex items-center justify-center text-sm font-medium`}
              >
                1
              </div>

              {/* Line between steps 1 and 2 */}
              <div
                className={`flex-1 h-1 mx-2 ${
                  paymentStep === "select" || paymentStep === "confirm"
                    ? "bg-purple-600"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              ></div>

              {/* Step 2 */}
              <div
                className={`w-8 h-8 rounded-full ${
                  paymentStep === "confirm"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-600 dark:bg-gray-700"
                } flex items-center justify-center text-sm font-medium`}
              >
                2
              </div>

              {/* Line between steps 2 and 3 */}
              <div className="flex-1 h-1 mx-2 bg-gray-200 dark:bg-gray-700"></div>

              {/* Step 3 */}
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 dark:bg-gray-700 flex items-center justify-center text-sm font-medium">
                3
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="container mx-auto py-8 px-4 max-w-6xl flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Item details card */}
          <div className="md:col-span-2">
            <div className="h-fit overflow-hidden rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 py-4 px-6">
                <h2 className="text-xl font-semibold text-white">
                  Order Summary
                </h2>
              </div>
              <div className="p-6">
                {displayItem ? (
                  <div className="flex flex-col items-center">
                    <div className="w-full mb-6 rounded-xl overflow-hidden shadow-md bg-gray-50 dark:bg-gray-700 p-2">
                      <img
                        src={displayItem?.image}
                        alt={displayItem?.name}
                        className="w-full object-cover rounded-lg"
                      />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                      {displayItem?.name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                      {displayItem?.description}
                    </p>
                    <div className="w-full">
                      <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-500 dark:text-gray-400">
                          Price:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {displayItem?.price} {displayItem?.tokenSymbol}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-500 dark:text-gray-400">
                          Token:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatAddress(displayItem?.tokenMint)}
                        </span>
                      </div>
                      <div className="flex justify-between py-3">
                        <span className="text-gray-500 dark:text-gray-400">
                          Seller:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatAddress(walletAddress)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <Loader className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment panel */}
          <div className="md:col-span-3">
            <div className="h-fit rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
              {renderPaymentStep()}
            </div>

            {/* Trust indicators - hide on success */}
            {paymentStep !== "success" && (
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
                  <Shield className="h-6 w-6 text-green-600 mb-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Secure Payments
                  </span>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-600 mb-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Transaction Protection
                  </span>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-purple-600 mb-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Verified Seller
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="container mx-auto">
          <p>
            © {new Date().getFullYear()} Bart Payment Gateway. Secured by Solana
            Blockchain.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Fallback component for Suspense
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
        <div className="w-16 h-16 relative mb-6">
          <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-purple-200 dark:border-purple-900"></div>
          <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-transparent border-t-purple-600 animate-spin"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Loading Payment Gateway
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Please wait while we prepare your checkout experience...
        </p>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function PaymentPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentContent />
    </Suspense>
  );
}
