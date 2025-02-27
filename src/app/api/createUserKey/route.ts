import { NextRequest, NextResponse } from "next/server";
import { generateUserKey } from "../../../utils/hashUtils";

export async function POST(req: NextRequest) {
  try {
    const { email, walletAddress } = await req.json();

    if (!email || !walletAddress) {
      return NextResponse.json(
        { message: "Email and wallet address are required" },
        { status: 400 }
      );
    }

    const userKey = generateUserKey(email, walletAddress);

    return NextResponse.json({ userKey }, { status: 200 });
  } catch (error) {
    console.error("Error creating user key:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
