import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../../lib/mongoDbConnect";
import User from "../../../../models/User";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    // Parse the JSON body from the request
    const { email, password, walletAddress } = await req.json();

    // Validate required fields
    if (!email || !password || !walletAddress) {
      return NextResponse.json(
        { message: "Email, password, and wallet address are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user by email and wallet address
    const user = await User.findOne({ email, walletAddress });
    if (!user) {
      return NextResponse.json(
        { message: "Invalid email, password, or wallet address" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid email, password, or wallet address" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Sign in successful" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Sign in error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
