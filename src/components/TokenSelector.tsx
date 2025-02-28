"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, ChevronDown, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface Token {
  address: string;
  chainId: number;
  decimals: number;
  logoURI: string;
  name: string;
  symbol: string;
  tags: string[];
}

interface TokenSelectorProps {
  tokens: Token[];
  filteredTokens: Token[];
  setFilteredTokens: React.Dispatch<React.SetStateAction<Token[]>>;
  selectedToken: Token | null;
  setSelectedToken: React.Dispatch<React.SetStateAction<Token | null>>;
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  tokens,
  filteredTokens,
  setFilteredTokens,
  selectedToken,
  setSelectedToken,
  isLoading,
  searchQuery,
  setSearchQuery,
}) => {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTokens(
        tokens.slice(0, 50).filter((token) => token.symbol !== "USDC")
      );
    } else {
      const filtered = tokens.filter(
        (token) =>
          (token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            token.symbol.toLowerCase().includes(searchQuery.toLowerCase())) &&
          token.symbol !== "USDC"
      );
      setFilteredTokens(filtered.slice(0, 50));
    }
  }, [searchQuery, tokens]);

  return (
    <div>
      <label className="block text-sm font-medium mb-3 text-gray-700">
        Select Payment Token
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 py-6 bg-white"
            disabled={isLoading}
          >
            {selectedToken ? (
              <div className="flex items-center">
                <div className="w-8 h-8 mr-3 rounded-full overflow-hidden shadow-md">
                  <img
                    src={selectedToken.logoURI}
                    alt={selectedToken.symbol}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/api/placeholder/24/24";
                    }}
                  />
                </div>
                <span className="text-base font-medium">
                  {selectedToken.symbol}
                </span>
              </div>
            ) : (
              <span className="text-gray-500">
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading tokens...
                  </div>
                ) : (
                  "Select a token"
                )}
              </span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0 rounded-xl shadow-lg border-0 overflow-hidden">
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center border rounded-lg px-3 py-2 bg-white shadow-sm">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tokens..."
                className="border-0 focus-visible:ring-0 pl-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <AnimatePresence>
              {filteredTokens.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {filteredTokens.map((token, index) => (
                    <motion.div
                      key={token.address}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { delay: index * 0.02 },
                      }}
                      className="flex items-center p-3 hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                      onClick={() => {
                        setSelectedToken(token);
                        setSearchQuery("");
                        setOpen(false); // Close popover after selection
                      }}
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm mr-3">
                        <img
                          src={token.logoURI}
                          alt={token.symbol}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/api/placeholder/24/24";
                          }}
                        />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">
                          {token.symbol}
                        </div>
                        <div className="text-xs text-gray-500">
                          {token.name}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 text-center text-gray-500"
                >
                  No tokens found
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
