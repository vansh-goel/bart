import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoDbConnect";
import User from "@/models/User";

export async function PUT(req: NextRequest) {
  try {
    const { email, webhookUrl } = await req.json();
    console.log("Request Payload:", { email, webhookUrl }); // Log the request payload

    if (!email || !webhookUrl) {
      console.log("Validation Error: Email and webhook URL are required."); // Log validation error
      return NextResponse.json(
        { message: "Email and webhook URL are required." },
        { status: 400 }
      );
    }

    await dbConnect();
    console.log("Database connected successfully."); // Log successful connection

    // Check if the user exists before updating
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found with email:", email); // Log if user is not found
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }
    console.log("User found:", user); // Log the found user

    // Proceed to update the webhook URL
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: { webhookUrl: webhookUrl } },
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      console.log("Update failed: No user was updated."); // Log if update fails
      return NextResponse.json({ message: "Update failed." }, { status: 500 });
    }

    console.log("Updated User:", updatedUser); // Log the updated user

    return NextResponse.json(
      { message: "Webhook URL updated successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating webhook URL:", error); // Log the error
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
