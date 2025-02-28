import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../../lib/mongoDbConnect";
import User from "../../../../models/User";
import bcrypt from "bcryptjs";

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { email, walletAddress, password } = await req.json();

    if (!email || !walletAddress || !password) {
      return NextResponse.json(
        { message: "All fields are required, including walletAddress." },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        {
          status: 409,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the new user
    const user = new User({ email, walletAddress, password: hashedPassword });
    await user.save();

    return NextResponse.json(
      { message: "User created successfully" },
      {
        status: 201,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
