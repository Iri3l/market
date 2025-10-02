import { NextResponse } from "next/server";
import { connectMongo } from "../../../lib/db";
import ListingModel, { type ListingDoc } from "../../../lib/models/Listing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function n(v: string | null, d: number) {
  const x = Number(v ?? "");
  return Number.isFinite(x) ? x : d;
}
function b(v: string | null) {
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
}

export async function GET(req: Request) {
  await connectMongo();

  const url = new URL(req.url);
  const sp = url.searchParams;

  const page = Math.max(1, n(sp.get("page"), 1));
  const limit = Math.max(1, Math.min(50, n(sp.get("limit"), 20)));
  const skip = (page - 1) * limit;

  const q = sp.get("q");
  const part = b(sp.get("part"));
  const filter: Record<string, any> = {};

  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { make: { $regex: q, $options: "i" } },
      { model: { $regex: q, $options: "i" } },
    ];
  }
  if (typeof part === "boolean") filter.part = part;

  const [items, total] = await Promise.all([
    ListingModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<ListingDoc[]>(),
    ListingModel.countDocuments(filter),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
}
