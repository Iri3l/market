import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ ok: true, name: "market-web-api", ts: Date.now() })
}
