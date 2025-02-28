// src/app/api/updateUser/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoDbConnect";
import User, { UserType } from "@/models/User";
import bcrypt from "bcrypt";

export async function PUT(req: NextRequest) {
  try {
    const { email, currentPassword, newEmail, newPassword } = await req.json();
    console.log("Request Payload:", {
      email,
      currentPassword,
      newEmail,
      newPassword,
    });

    // Validate required fields
    if (!email || !currentPassword) {
      console.log("Validation Error: Email and current password are required."); // Log validation error
      return NextResponse.json(
        { message: "Email and current password are required." },
        { status: 400 }
      );
    }

    await dbConnect();
    console.log("Database connected successfully.");

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found with email:", email);
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }
    console.log("User found:", user);

    // Validate the current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      console.log("Validation Error: Current password is incorrect."); // Log if password is incorrect
      return NextResponse.json(
        { message: "Current password is incorrect." },
        { status: 403 }
      );
    }

    // Prepare update object
    const updateData: Partial<UserType> = {};
    if (newEmail) {
      updateData.email = newEmail;
    }
    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      console.log("Update failed: No user was updated."); // Log if update fails
      return NextResponse.json({ message: "Update failed." }, { status: 500 });
    }

    console.log("Updated User:", updatedUser); // Log the updated user

    return NextResponse.json(
      { message: "User information updated successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user:", error); // Log the error
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
