import { NextResponse } from "next/server"
const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
export const runtime = "nodejs"
export async function GET(req: Request) {
  const url = new URL(req.url)
  const upstream = `${API_BASE.replace(/\/+$/, "")}/api/listings${url.search || ""}`
  const r = await fetch(upstream, { cache: "no-store" })
  const data = await r.json().catch(() => ({}))
  return NextResponse.json(data, { status: r.status })
}
