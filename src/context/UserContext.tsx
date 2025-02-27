import React, { createContext, useContext, useState, ReactNode } from "react";

interface UserContextType {
  email: string;
  walletAddress: string | null;
  setEmail: (email: string) => void;
  setWalletAddress: (address: string | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [email, setEmail] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  return (
    <UserContext.Provider
      value={{ email, walletAddress, setEmail, setWalletAddress }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
