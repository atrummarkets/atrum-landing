import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isValidAccessCode } from "@/lib/waitlist";

// Not a browser-facing route (see the "internal" path segment) — only
// atrum-markets' server calls this, authenticated by a shared secret.
// Response is a bare boolean, never email/id/invite_code: the caller side
// (and its own request logs) must never be able to reconstruct who a code
// belongs to from this endpoint alone.

// Hash both sides to a fixed-length digest before comparing: timingSafeEqual
// throws on mismatched buffer lengths, and comparing raw variable-length
// strings would otherwise leak the secret's length through the exception.
function safeEqual(a: string, b: string): boolean {
  const ah = createHash("sha256").update(a).digest();
  const bh = createHash("sha256").update(b).digest();
  return timingSafeEqual(ah, bh);
}

export async function POST(req: NextRequest) {
  const expected = process.env.GATE_VALIDATION_SHARED_SECRET;
  if (!expected) {
    console.error("[access-code/validate] GATE_VALIDATION_SHARED_SECRET not set");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const provided = req.headers.get("x-atrum-internal-secret") ?? "";
  if (!safeEqual(provided, expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const { code } = (body ?? {}) as { code?: unknown };
  if (typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  try {
    const valid = await isValidAccessCode(code);
    return NextResponse.json({ valid });
  } catch (err) {
    console.error("[access-code/validate] lookup failed:", err);
    return NextResponse.json({ error: "lookup failed" }, { status: 500 });
  }
}
