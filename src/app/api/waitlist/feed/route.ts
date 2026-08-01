import { NextResponse } from "next/server";
import { getRecentFeed } from "@/lib/waitlist";

export async function GET() {
  try {
    const feed = await getRecentFeed(2);
    return NextResponse.json({ feed });
  } catch (err) {
    console.error("[waitlist] feed fetch failed:", err);
    return NextResponse.json({ feed: [] }, { status: 500 });
  }
}
