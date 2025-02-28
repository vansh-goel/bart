"use client";

import React from "react";
import ProductItem from "@/components/ProductItem";

const ProductPage = () => {
  const walletAddress = "zeusLrvFFpcPMKCe4BLrnmMMdxSUkJV4pNd8kNxgqVW";

  const mockItems = [
    {
      id: "nft-123",
      name: "Limited Edition NFT",
      description: "Exclusive digital collectible from our premium collection",
      price: 10,
      image: "/item.png",
      tokenMint: "FSxJ85FXVsXSr51SeWf9ciJWTcRnqKFSmBgRDeL3KyWw",
      tokenSymbol: "USDC",
    },
    {
      id: "nft-125",
      name: " NFT",
      description: "Exclusive digital collectible from our premium collection",
      price: 100,
      image: "/window.svg",
      tokenMint: "FSxJ85FXVsXSr51SeWf9ciJWTcRnqKFSmBgRDeL3KyWw",
      tokenSymbol: "USDC",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="flex flex-wrap gap-4 justify-center">
        {mockItems.map((item) => (
          <ProductItem
            key={item.id}
            item={item}
            walletAddress={walletAddress}
            productId={item.id}
            userKey="Z29lbHZhbnNoODJAZ21haWwuY29tIzJ3QU55dnZFa1AxQ3ZxTWFCY1ZIWWFEYzlFbXJrVkIzc0ttVUYzWFJ1TkpX"
          />
        ))}
      </div>
    </div>
  );
};

export default ProductPage;
