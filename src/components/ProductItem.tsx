import React from "react";
import { useRouter } from "next/navigation";

interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  tokenMint: string;
  tokenSymbol: string;
}

interface ProductItemProps {
  item: Item;
  walletAddress: string;
  productId: string;
  userKey: string;
}

const ProductItem: React.FC<ProductItemProps> = ({
  item,
  walletAddress,
  productId,
  userKey,
}) => {
  const router = useRouter();

  const handleBuyClick = () => {
    const itemData = encodeURIComponent(JSON.stringify(item));
    router.push(
      `/payment?item=${itemData}&wallet=${walletAddress}&productId=${productId}&userKey=${userKey}`
    );
  };

  return (
    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="relative">
        <img
          width={24}
          src={item.image}
          alt={item.name}
          className="w-full h-64 object-cover"
        />
        <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          {item.price} {item.tokenSymbol}
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          {item.name}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {item.description}
        </p>

        <button
          onClick={handleBuyClick}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};

export default ProductItem;
