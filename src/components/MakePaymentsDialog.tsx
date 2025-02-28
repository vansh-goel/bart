"use client"; // Ensure this is kept at the top
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  Connection,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";

interface SendDialogProps {
  isOpen: boolean;
  handleClose: () => void;
}

const MakePaymentDialog: React.FC<SendDialogProps> = ({
  isOpen,
  handleClose,
}) => {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const { publicKey, sendTransaction } = useWallet();

  const handleSend = async () => {
    if (!amount || !walletAddress || !publicKey) return;

    const connection = new Connection("https://api.devnet.solana.com");
    const from = publicKey;
    const to = new PublicKey(walletAddress);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports: Number(amount) * LAMPORTS_PER_SOL,
      })
    );

    try {
      const signature = await sendTransaction(transaction, connection);
      console.log("SIGNATURE", signature);
    } catch (error) {
      console.error("Error sending transaction:", error);
    }

    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] dark:bg-black/70 dark:text-white border-purple-300 border-2 rounded-2xl shadow-sm shadow-white">
        <DialogHeader>
          <DialogTitle>Send SOL</DialogTitle>
          <DialogDescription>
            Please enter the wallet address, and amount of SOL to send.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 pb-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="wallet-address" className="text-right">
              Wallet Address
            </Label>
            <div className="col-span-3">
              <Input
                id="wallet-address"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className=""
                placeholder="Enter Wallet Address"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
              placeholder="Enter Amount"
              min="0"
              step="0.000000001"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            className="bg-purple-300 text-black hover:text-white"
            disabled={!walletAddress || !amount}
          >
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MakePaymentDialog;
