import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../lib/mongoDbConnect";
import User from "../../../models/User";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    console.log("Received email:", email); // Log the received email

    if (!email) {
      return NextResponse.json(
        { message: "Email is required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email }, { webhookUrl: 1 });

    console.log("User found:", user);

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ webhookUrl: user.webhookUrl }, { status: 200 });
  } catch (error) {
    console.error("Error fetching webhook URL:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
