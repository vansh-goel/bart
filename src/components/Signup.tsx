import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const wallet = useWallet();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet.connected) {
      alert("Please connect your wallet.");
      return;
    }

    const walletAddress = wallet.publicKey?.toString();

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, walletAddress, password }),
    });

    const data = await response.json();
    if (response.ok) {
      alert("Signup successful!");
    } else {
      alert(data.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Sign Up</button>
    </form>
  );
};

export default Signup;
