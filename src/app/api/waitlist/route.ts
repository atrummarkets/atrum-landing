import { NextRequest, NextResponse } from "next/server";
import { isValidEmail, joinWaitlist } from "@/lib/waitlist";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, ref } = (body ?? {}) as { email?: unknown; ref?: unknown };

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a real email." }, { status: 400 });
  }
  const refCode = typeof ref === "string" && ref.trim() ? ref.trim() : null;

  try {
    const entry = await joinWaitlist(email, refCode);
    return NextResponse.json({
      position: entry.position,
      inviteCode: entry.inviteCode,
      accessCode: entry.accessCode,
      invitesUsed: entry.invitesUsed,
    });
  } catch (err) {
    console.error("[waitlist] join failed:", err);
    return NextResponse.json(
      { error: "That did not go through. Try again." },
      { status: 500 }
    );
  }
}
