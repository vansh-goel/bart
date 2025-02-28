import { NextRequest, NextResponse } from "next/server";
import { decodeUserKey } from "../../../utils/hashUtils";

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json();

    if (!key) {
      return NextResponse.json({ message: "Key is required" }, { status: 400 });
    }

    const result = decodeUserKey(key);
    console.log("Decoded User data: " + result);

    if (result) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json({ message: "Invalid key" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error decoding user key:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
