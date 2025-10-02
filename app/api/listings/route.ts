import { NextResponse } from "next/server"
import { connectMongo } from "../../../lib/db"
import Listing from "../../../lib/models/Listing"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q        = url.searchParams.get("q")
    const make     = url.searchParams.get("make")
    const model    = url.searchParams.get("model")
    const priceMin = url.searchParams.get("priceMin")
    const priceMax = url.searchParams.get("priceMax")
    const partStr  = url.searchParams.get("part")
    const page     = Number(url.searchParams.get("page") ?? 1)
    const limit    = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20)))

    await connectMongo()

    const filter: any = {}
    if (q) filter.$text = { $search: String(q) }
    if (make) filter.make = String(make)
    if (model) filter.model = String(model)
    if (priceMin) filter.price = { ...(filter.price || {}), $gte: Number(priceMin) }
    if (priceMax) filter.price = { ...(filter.price || {}), $lte: Number(priceMax) }
    if (partStr !== null) filter.part = partStr === "true"

    const skip = (Math.max(1, page) - 1) * limit
    const [items, total] = await Promise.all([
      ListingModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ListingModel.countDocuments(filter),
    ])

    return NextResponse.json({
      items,
      total,
      page: Math.max(1, page),
      pages: Math.ceil(total / limit),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "listings failed" }, { status: 500 })
  }
}
