"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

const ProductPage = () => {
  const router = useRouter();
  const wallet = useWallet();

  // Mock item data
  const mockItem = {
    id: "nft-123",
    name: "Limited Edition NFT",
    description: "Exclusive digital collectible from our premium collection",
    price: 10,
    image: "/item.png",
    tokenMint: "FSxJ85FXVsXSr51SeWf9ciJWTcRnqKFSmBgRDeL3KyWw",
    tokenSymbol: "USDC",
    sellerWallet: `${wallet.publicKey}`,
  };

  const handleBuyClick = () => {
    const itemData = encodeURIComponent(JSON.stringify(mockItem));
    router.push(`/payment?item=${itemData}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="relative">
          <img
            width={24}
            src={mockItem.image}
            alt={mockItem.name}
            className="w-full h-64 object-cover"
          />
          <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            {mockItem.price} {mockItem.tokenSymbol}
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {mockItem.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {mockItem.description}
          </p>

          <button
            onClick={handleBuyClick}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
