"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ViewTransactionsDialogProps {
  isOpen: boolean;
  handleClose: () => void;
}

const ViewTransactionsDialog: React.FC<ViewTransactionsDialogProps> = ({
  isOpen,
  handleClose,
}) => {
  const transactions = [
    { amount: 100, senderWalletAddress: "0x123...", productId: "prod_001" },
    { amount: 200, senderWalletAddress: "0x456...", productId: "prod_002" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="dark:bg-black/70 dark:text-white border-purple-300 border-2 rounded-2xl shadow-sm shadow-white">
        <DialogHeader>
          <DialogTitle>View Transactions</DialogTitle>
          <DialogDescription>
            Here you can view your transaction history.
          </DialogDescription>
        </DialogHeader>

        {/* Add your transaction history display here */}
        <div className="mt-4">
          {transactions.length > 0 ? (
            transactions.map((transaction, index) => (
              <div
                key={index}
                className="dark:bg-gray-900 shadow-gray-700 p-4 rounded-lg mb-4 shadow-md"
              >
                <p>
                  <strong>Amount:</strong> ${transaction.amount}
                </p>
                <p>
                  <strong>Sender:</strong> {transaction.senderWalletAddress}
                </p>
                <p>
                  <strong>Product ID:</strong> {transaction.productId}
                </p>
              </div>
            ))
          ) : (
            <p>No transactions available.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewTransactionsDialog;
