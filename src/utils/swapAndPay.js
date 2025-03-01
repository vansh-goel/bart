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

/**
 * Get a working RPC connection with fallbacks
 * @returns {Promise<Connection>} A working Solana connection
 */

async function getWorkingConnection() {
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const connection = new Connection(endpoint, "confirmed");
      // Test the connection with a simple request
      await connection.getSlot();
      console.log(`Using RPC endpoint: ${endpoint}`);
      return connection;
    } catch {
      console.warn(`RPC endpoint ${endpoint} failed`);
      continue;
    }
  }

  throw new Error("All RPC endpoints failed. Please try again later.");
}

/**
 * Swap tokens and pay to a recipient
 * @param {Object} params - The parameters
 * @param {Connection} params.connection - Optional Solana connection (will create one if not provided)
 * @param {PublicKey} params.inputMint - Input token mint address
 * @param {number} params.amount - Amount to swap (in input token decimals)
 * @param {PublicKey} params.recipientWallet - Recipient wallet public key
 * @param {Object} params.wallet - Wallet interface with publicKey and signTransaction/sendTransaction methods
 * @param {number} params.slippageBps - Slippage tolerance in basis points (e.g. 50 = 0.5%)
 * @returns {Promise<{signature: string, status: string}>} Transaction result
 */
export async function swapAndPay(
  connection,
  inputMint,
  amount,
  recipientWallet,
  wallet,
  slippageBps = 50)
   {
  try {
    // Get a working connection if not provided or if the provided one fails
    let workingConnection = connection;
    try {
      if (workingConnection) {
        // Test the provided connection
        await workingConnection.getSlot();
      } else {
        workingConnection = await getWorkingConnection();
      }
    } catch {
      console.warn("Provided connection failed, trying fallbacks");
      workingConnection = await getWorkingConnection();
    }

    console.log("Starting swap and pay process...");
    console.log(`Input Mint: ${inputMint.toBase58()}`);
    console.log(`Recipient: ${recipientWallet.toBase58()}`);
    console.log(`Amount: ${amount}`);

    // Get recipient's USDC token account
    const recipientTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      recipientWallet,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    console.log(`Recipient token account: ${recipientTokenAccount.toBase58()}`);

    // Step 1: Fetch quote from Jupiter API
    const quoteResponse = await fetchQuote({
      inputMint: inputMint.toBase58(),
      outputMint: USDC_MINT.toBase58(),
      amount: Math.ceil(amount).toString(),
      slippageBps,
      swapMode: "ExactIn",
    });

    if (!quoteResponse) {
      throw new Error("Failed to get quote");
    }

    console.log("Quote received:", quoteResponse.outAmount);

    // Step 2: Get the swap transaction
    const { swapTransaction } = await fetchSwapTransaction({
      quoteResponse,
      userPublicKey: wallet.publicKey.toBase58(),
      destinationTokenAccount: recipientTokenAccount.toBase58(),
    });

    if (!swapTransaction) {
      throw new Error("Failed to get swap transaction");
    }

    console.log("Swap transaction received");

    // Step 3: Deserialize the versioned transaction
    const transactionBuffer = Buffer.from(swapTransaction, "base64");
    const transaction = VersionedTransaction.deserialize(transactionBuffer);

    // Step 4: Get the latest blockhash - with retry logic
    let blockhashInfo;
    try {
      blockhashInfo = await workingConnection.getLatestBlockhash("confirmed");
    } catch {
      console.warn(
        "Failed to get blockhash from primary connection, trying fallbacks"
      );
      workingConnection = await getWorkingConnection();
      blockhashInfo = await workingConnection.getLatestBlockhash("confirmed");
    }

    const { blockhash, lastValidBlockHeight } = blockhashInfo;

    // Step 5: Sign and send the transaction
    try {
      let signature;
      if (!wallet.payer) {
        // Use wallet adapter signing
        signature = await wallet.sendTransaction(
          transaction,
          workingConnection
        );
      } else {
        signature = await workingConnection.sendRawTransaction(
          transaction.serialize(),
          { skipPreflight: false, preflightCommitment: "confirmed" }
        );
      }

      console.log("Transaction sent:", signature);

      // Confirm transaction
      const confirmation = await workingConnection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed"
      );

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        );
      }

      console.log("Transaction confirmed:", signature);

      return {
        signature,
        status: "success",
      };
    } catch (error) {
      console.error("Error signing and sending transaction:", error);
      throw new Error(`Transaction signing failed`);
    }
  } catch (error) {
    console.error("Swap and pay failed:", error);
    throw error;
  }
}

/**
 * Fetch quote from Jupiter API
 * @param {Object} params - Quote parameters
 * @returns {Promise<Object>} - Quote response
 */
async function fetchQuote({
  inputMint,
  outputMint,
  amount,
  slippageBps,
  swapMode,
}) {
  try {
    const response = await axios.get(`https://quote-api.jup.ag/v6/quote`, {
      params: {
        inputMint,
        outputMint,
        amount,
        slippageBps,
        swapMode,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching quote:", error);
    throw new Error(`Failed to fetch quote`);
  }
}

/**
 * Fetch swap transaction from Jupiter API
 * @param {Object} params - Transaction parameters
 * @returns {Promise<Object>} - Transaction data
 */
async function fetchSwapTransaction({
  quoteResponse,
  userPublicKey,
  destinationTokenAccount,
}) {
  try {
    const requestBody = {
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: true,
      useSharedAccounts: true,
      prioritizationFeeLamports: 0,
      asLegacyTransaction: false,
      useTokenLedger: false,
      destinationTokenAccount,
      dynamicComputeUnitLimit: true,
      skipUserAccountsRpcCalls: true,
    };

    const response = await axios.post(
      "https://quote-api.jup.ag/v6/swap",
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching swap transaction:", error);
    throw new Error(`Failed to fetch swap transaction`);
  }
}
