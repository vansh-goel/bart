"use client";
import React from "react";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";

const Dashboard = () => {
  const wallet = useWallet();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center"
      >
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
          Welcome to Your Dashboard
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          You are signed in with your wallet address:
        </p>
        <p className="text-xl font-semibold text-purple-600 dark:text-purple-400">
          {wallet.publicKey?.toString()}
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          className="mt-6 px-4 py-2 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transition-colors duration-300"
        >
          Go to Payments
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Dashboard;
