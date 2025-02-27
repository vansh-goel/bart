export interface PriceData {
  id: string;
  type: string;
  price: string;
}

export interface PricesResponse {
  data: {
    [key: string]: PriceData;
  };
  timeTaken: number;
}

export interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: any;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
  scoreReport: any;
  contextSlot: number;
  timeTaken: number;
  swapUsdValue: string;
  simplerRouteUsed: boolean;
}

export interface Token {
  address: string;
  chainId: number;
  decimals: number;
  logoURI: string;
  name: string;
  symbol: string;
  tags: string[];
}

export interface ItemData {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  tokenMint: string;
  tokenSymbol: string;
  sellerWallet: string;
}
