// src/app/api/successfulTransaction/route.ts
import { NextRequest, NextResponse } from "next/server";
import { decodeUserKey } from "../../../utils/hashUtils";
import { sendEmail } from "../../../utils/emailService";
import dbConnect from "../../../lib/mongoDbConnect";
import User from "../../../models/User";

export async function POST(req: NextRequest) {
  try {
    const { userKey, price, payer, productId } = await req.json();

    if (!userKey || !price || !payer || !productId) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Decode the user key to get the user's email
    const decodedResult = decodeUserKey(userKey);
    console.log("Decoded User data: ", JSON.stringify(decodedResult, null, 2));

    if (!decodedResult || !decodedResult.email) {
      return NextResponse.json(
        { message: "Invalid user key" },
        { status: 404 }
      );
    }

    const { email } = decodedResult;

    // Send an email to the user
    await sendEmail(email, {
      subject: "Payment Received",
      html: `
        <h1>Payment Received</h1>
        <p>You have received a payment with the following details:</p>
        <ul>
          <li><strong>Amount:</strong> ${price} USDC</li>
          <li><strong>Payer:</strong> ${payer}</li>
          <li><strong>Product ID:</strong> ${productId}</li>
        </ul>
        <p>Thank you for your business!</p>
      `,
    });

    // Connect to the database
    await dbConnect();

    // Query the database to get the webhook URL for the user
    const user = await User.findOne({ email }, { webhookUrl: 1 });
    console.log("User found:", user);

    if (!user || !user.webhookUrl) {
      return NextResponse.json(
        { message: "Webhook URL not found" },
        { status: 404 }
      );
    }

    const webhookUrl = user.webhookUrl;

    // Make a POST request to the webhook URL with the data
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ price, payer, productId }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "Failed to send data to webhook" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Transaction processed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing successful transaction:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
