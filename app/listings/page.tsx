// app/listings/page.tsx
import Link from "next/link"

type Listing = {
  _id: string
  title: string
  make?: string
  model?: string
  year?: number
  price?: number
  part?: boolean
  images?: { url?: string }[]
}

async function fetchListings(search: string) {
  type Listing = {
  _id: string
  title: string
  make?: string
  model?: string
  year?: number
  price?: number
  part?: boolean
  images?: { url?: string }[]
}

async function fetchListings(search: string) {
  try {
    const res = await fetch(
      `/api/proxy/listings${search ? `?${search}` : ""}`,
      { cache: "no-store" }
    )
    if (!res.ok) throw new Error(`Failed to load listings: ${res.status}`)
    return res.json() as Promise<{
      items: Listing[]
      total: number
      page: number
      pages: number
    }>
  } catch {
    // don’t crash the page if API is down; show empty state
    return { items: [], total: 0, page: 1, pages: 1 }
  }
}

}

export default async function ListingsPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const sp = new URLSearchParams(searchParams as any)
  const { items, total, page, pages } = await fetchListings(sp.toString())

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Browse Listings</h1>

      {/* Filters */}
      <form action="/listings" className="flex flex-wrap gap-3">
        <input name="q" defaultValue={sp.get("q") || ""} placeholder="Search (e.g., BMW E46)" className="border rounded px-3 py-2" />
        <input name="make" defaultValue={sp.get("make") || ""} placeholder="Make" className="border rounded px-3 py-2" />
        <input name="model" defaultValue={sp.get("model") || ""} placeholder="Model" className="border rounded px-3 py-2" />
        <input name="priceMin" defaultValue={sp.get("priceMin") || ""} placeholder="£ min" className="border rounded px-3 py-2 w-28" />
        <input name="priceMax" defaultValue={sp.get("priceMax") || ""} placeholder="£ max" className="border rounded px-3 py-2 w-28" />
        <select name="part" defaultValue={sp.get("part") || ""} className="border rounded px-3 py-2">
          <option value="">All</option>
          <option value="false">Cars</option>
          <option value="true">Parts</option>
        </select>
        <button type="submit" className="rounded border px-4 py-2">Filter</button>
        <Link href="/listings" className="rounded border px-3 py-2">Reset</Link>
      </form>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => {
          const thumb = it.images?.[0]?.url
          const subtitle = [it.year, it.make, it.model].filter(Boolean).join(" · ")
          return (
            <article key={it._id} className="border rounded-xl overflow-hidden">
              <div className="bg-gray-100 aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumb || "https://via.placeholder.com/600x400?text=No+Image"} alt={it.title}
                     style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}/>
              </div>
              <div className="p-3">
                <h3 className="font-medium truncate">{it.title}</h3>
                <p className="text-sm text-gray-600 truncate">{subtitle}</p>
                {typeof it.price === "number" && <p className="mt-1 font-semibold">£{it.price.toLocaleString()}</p>}
              </div>
            </article>
          )
        })}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Total: {total} · Page {page} of {pages}</span>
        <div className="flex gap-2">
          {page > 1 && (
            <Link href={`/listings?${new URLSearchParams({ ...Object.fromEntries(sp), page: String(page - 1) }).toString()}`}
                  className="border rounded px-3 py-2">Prev</Link>
          )}
          {page < pages && (
            <Link href={`/listings?${new URLSearchParams({ ...Object.fromEntries(sp), page: String(page + 1) }).toString()}`}
                  className="border rounded px-3 py-2">Next</Link>
          )}
        </div>
      </div>
    </div>
  )
}

