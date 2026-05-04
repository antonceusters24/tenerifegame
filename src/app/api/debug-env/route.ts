import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_USE_TEST_TABLES: process.env.NEXT_PUBLIC_USE_TEST_TABLES ?? "NOT SET",
    isTrue: process.env.NEXT_PUBLIC_USE_TEST_TABLES === "true",
  });
}
