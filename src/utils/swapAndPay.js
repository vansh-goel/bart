import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import axios from "axios";

const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

const RPC_ENDPOINTS = [
  "https://api.devnet.solana.com",
  "https://solana-devnet.rpc.extrnode.com",
  "https://rpc.ankr.com/solana",
  "https://solana-api.projectserum.com",
];

async function getWorkingConnection() {
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const connection = new Connection(endpoint, "confirmed");
      await connection.getSlot(); 
      console.log(`Using RPC endpoint: ${endpoint}`);
      return connection;
    } catch {
      console.warn(`RPC endpoint ${endpoint} failed`);
    }
  }
  throw new Error("All RPC endpoints failed. Please try again later.");
}

export async function swapAndPay(
  connection,
  inputMint,
  amount,
  recipientWallet,
  wallet,
  slippageBps = 50
) {
  try {
    let workingConnection = connection || (await getWorkingConnection());

    console.log("Starting swap and pay process...");
    console.log(`Input Mint: ${inputMint.toBase58()}`);
    console.log(`Recipient: ${recipientWallet.toBase58()}`);
    console.log(`Desired output amount (in smallest units): ${amount}`);

    const recipientTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      recipientWallet,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    console.log(`Recipient token account: ${recipientTokenAccount.toBase58()}`);

    const quoteResponse = await fetchQuote({
      inputMint: inputMint.toBase58(),
      outputMint: USDC_MINT.toBase58(),
      amount: Math.ceil(amount).toString(),
      slippageBps,
      swapMode: "ExactOut",
    });

    if (!quoteResponse) throw new Error("Failed to get quote");

    console.log("Quote received:", quoteResponse);

    const { swapTransaction } = await fetchSwapTransaction({
      quoteResponse,
      userPublicKey: wallet.publicKey.toBase58(),
      destinationTokenAccount: recipientTokenAccount.toBase58(),
    });

    if (!swapTransaction) throw new Error("Failed to get swap transaction");

    console.log("Swap transaction received");

    const transactionBuffer = Buffer.from(swapTransaction, "base64");
    const transaction = VersionedTransaction.deserialize(transactionBuffer);

    transaction.feePayer = wallet.publicKey;

    const { blockhash, lastValidBlockHeight } = await workingConnection.getLatestBlockhash(
      "confirmed"
    );
    transaction.recentBlockhash = blockhash;

    let signature;
    if (wallet.signTransaction) {
      const signedTx = await wallet.signTransaction(transaction);
      signature = await workingConnection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });
    } else if (wallet.sendTransaction) {
      signature = await wallet.sendTransaction(transaction, workingConnection);
    } else {
      throw new Error("Wallet does not support signing transactions");
    }

    console.log("Transaction sent:", signature);

    const confirmation = await workingConnection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed"
    );

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    console.log("Transaction confirmed:", signature);
    return { signature, status: "success" };
  } catch (error) {
    console.error("Swap and pay failed:", error);
    throw error;
  }
}

async function fetchQuote(params) {
  try {
    const response = await axios.get(`https://api.jup.ag/swap/v1/quote`, {
      params: {
        ...params,
        restrictIntermediateTokens: true,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching quote:", error);
    throw new Error("Failed to fetch quote");
  }
}

async function fetchSwapTransaction({ quoteResponse, userPublicKey, destinationTokenAccount }) {
  try {
    const requestBody = {
      quoteResponse,
      userPublicKey,
      destinationTokenAccount,
      dynamicComputeUnitLimit: true,
      dynamicSlippage: true,
      prioritizationFeeLamports: {
        priorityLevelWithMaxLamports: {
          maxLamports: 1000000,
          priorityLevel: "veryHigh",
        },
      },
    };

    const response = await axios.post(`https://api.jup.ag/swap/v1/swap`, requestBody, {
      headers: { "Content-Type": "application/json" },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching swap transaction:", error);
    throw new Error("Failed to fetch swap transaction");
  }
}
