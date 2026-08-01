import { NextResponse } from "next/server";
import { getWaitlistStats } from "@/lib/waitlist";

export async function GET() {
  try {
    const { displayCount } = await getWaitlistStats();
    return NextResponse.json({ count: displayCount });
  } catch (err) {
    console.error("[waitlist] stats fetch failed:", err);
    return NextResponse.json({ error: "unavailable" }, { status: 500 });
  }
}
