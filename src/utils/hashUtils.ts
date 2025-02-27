export function generateUserKey(email: string, walletAddress: string): string {
  return Buffer.from(`${email}#${walletAddress}`).toString("base64");
}

export function decodeUserKey(
  encodedKey: string
): { email: string; walletAddress: string } | null {
  const decodedString = Buffer.from(encodedKey, "base64").toString("utf-8");
  const [email, walletAddress] = decodedString.split("#");

  if (email && walletAddress) {
    return { email, walletAddress };
  }
  return null;
}
