// app/api/proxy/listings/route.ts
import { NextResponse } from "next/server"

const API_BASE =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const qs = url.search ? url.search : ""
  const upstream = `${API_BASE.replace(/\/+$/, "")}/api/listings${qs}`

  try {
    const res = await fetch(upstream, { cache: "no-store" })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "proxy failed" }, { status: 500 })
  }
}
