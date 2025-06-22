import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  
  return NextResponse.json({ 
    userId,
    message: "This is your Clerk User ID",
    webhookExample: `Use this ID in webhook URLs: ${userId}`
  });
} 