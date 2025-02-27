"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ArrowRight,
  Wallet,
  CreditCard,
  User,
  LogOut,
  Copy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useUserContext } from "@/context/UserContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Dashboard = () => {
  const wallet = useWallet();
  const router = useRouter();
  const { walletAddress, setWalletAddress, email, setEmail } = useUserContext();
  const [userKey, setUserKey] = useState<string | null>(null);

  useEffect(() => {
    if (!Cookies.get("userSession")) {
      router.push("/");
    }
    if (wallet.publicKey) {
      setWalletAddress(wallet.publicKey?.toString());
    }
    const storedEmail = localStorage.getItem("email");
    const storedWalletAddress = localStorage.getItem("walletAddress");

    if (storedEmail) {
      setEmail(storedEmail);
    }
    if (storedWalletAddress) {
      setWalletAddress(storedWalletAddress);
    }
  }, []);

  useEffect(() => {
    if (email && walletAddress) {
      localStorage.setItem("email", email);
      localStorage.setItem("walletAddress", walletAddress);
    }
    const fetchUserKey = async () => {
      if (email && walletAddress) {
        const response = await fetch("/api/createUserKey", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, walletAddress }),
        });

        if (response.ok) {
          const data = await response.json();
          setUserKey(data.userKey);
        } else {
          console.error("Failed to fetch user key");
        }
      }
    };

    fetchUserKey();
  }, [email, walletAddress]);

  function handleDisconnect() {
    wallet.disconnect();
    Cookies.remove("userSession");
    router.push("/");
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Connected
            </span>
          </div>
        </motion.div>

        {/* Wallet info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6"
        >
          <h1 className="text-lg font-bold mb-2">Hi {email}</h1>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex gap-2 flex-col">
                <div className="mt-1 flex items-center gap-2">
                  <h2 className="text-sm pb-1 font-medium dark:text-gray-400">
                    Your Wallet Address:
                  </h2>
                  <p className="text-lg font-mono font-medium text-gray-800 dark:text-gray-200">
                    {walletAddress
                      ? `${walletAddress
                          .toString()
                          .slice(0, 8)}...${walletAddress.toString().slice(-8)}`
                      : "Not connected"}
                  </p>
                  {walletAddress && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="ml-2 text-purple-500 hover:text-purple-600"
                      onClick={() => {
                        if (wallet.publicKey) {
                          navigator.clipboard.writeText(
                            wallet.publicKey.toString()
                          );
                          toast.success("Wallet Address copied to clipboard!");
                        }
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>

                {userKey && (
                  <div className="mt-2 flex items-center">
                    <h3 className="text-md font-medium pb-1">
                      Encoded User Key:
                    </h3>
                    <p className="text-gray-700 font-mono font-medium dark:text-gray-300 ml-2">
                      {userKey
                        ? `${userKey.toString().slice(0, 8)}...${userKey
                            .toString()
                            .slice(-8)}`
                        : null}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="ml-2 text-purple-500 hover:text-purple-600"
                      onClick={() => {
                        navigator.clipboard.writeText(userKey);
                        toast.success("User key copied to clipboard!");
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </motion.button>
                  </div>
                )}
                <ToastContainer />
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center"
            >
              <Wallet className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </motion.div>
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {[
            {
              title: "Make Payment",
              icon: <CreditCard className="w-5 h-5" />,
              color: "bg-blue-500",
            },
            {
              title: "View Transactions",
              icon: <ArrowRight className="w-5 h-5" />,
              color: "bg-green-500",
            },
            {
              title: "Account Settings",
              icon: <User className="w-5 h-5" />,
              color: "bg-amber-500",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`${item.color} w-10 h-10 rounded-lg flex items-center justify-center text-white`}
                >
                  {item.icon}
                </div>
                <p className="font-medium text-gray-700 dark:text-gray-200">
                  {item.title}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Logout button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center rounded-xl shadow-md transition-colors duration-300"
          >
            <div onClick={handleDisconnect}>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md transition-colors duration-300"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect Wallet</span>
              </motion.div>
            </div>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
