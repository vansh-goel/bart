// src/app/api/(auth)/signUp/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../../lib/mongoDbConnect";
import User from "../../../../models/User";
import bcrypt from "bcryptjs";

const cors = () => {
  return NextResponse.next().headers.set("Access-Control-Allow-Origin", "*");
};

export async function POST(req: NextRequest) {
  cors();

  try {
    const { email, walletAddress, password } = await req.json();

    if (!email || !walletAddress || !password) {
      return NextResponse.json(
        { message: "All fields are required, including walletAddress." },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the new user
    const user = new User({ email, walletAddress, password: hashedPassword });
    await user.save();

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
