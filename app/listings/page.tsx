// app/listings/page.tsx

type Listing = {
  _id: string
  title: string
  make?: string
  model?: string
  year?: number
  price?: number
  part?: boolean
  images?: { url?: string }[] | string[]
}

async function fetchListings(search: string) {
  const res = await fetch(
    `http://localhost:4000/api/listings${search ? `?${search}` : ""}`,
    { cache: "no-store" }
  )
  if (!res.ok) throw new Error(`Failed to load listings: ${res.status}`)
  return res.json() as Promise<{
    items: Listing[]
    total: number
    page: number
    pages: number
  }>
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[]>
}) {
  // Build query string safely from searchParams
  const sp = new URLSearchParams()
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      if (Array.isArray(v)) v.forEach((x) => sp.append(k, String(x)))
      else if (v != null) sp.set(k, String(v))
    }
  }

  let data: { items: Listing[]; total: number; page: number; pages: number }
  try {
    data = await fetchListings(sp.toString())
  } catch {
    data = { items: [], total: 0, page: 1, pages: 1 }
  }

  const { items, total } = data

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Listings</h1>

      {items.length === 0 ? (
        <div className="text-gray-600">No listings yet.</div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it) => {
            const firstImg =
              Array.isArray(it.images) && it.images.length
                ? (typeof it.images[0] === "string"
                    ? (it.images[0] as string)
                    : (it.images[0] as { url?: string }).url) || ""
                : ""

            return (
              <li
                key={it._id}
                className="rounded-xl border p-4 hover:shadow-sm transition"
              >
                {firstImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={firstImg}
                    alt={it.title}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-100 rounded-lg mb-3 grid place-items-center text-sm text-gray-400">
                    No image
                  </div>
                )}

                <div className="text-sm text-gray-500 mb-1">
                  {it.make ?? "—"} {it.model ?? ""} {it.year ? `· ${it.year}` : ""}
                </div>
                <div className="font-medium">{it.title}</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-lg font-semibold">
                    {typeof it.price === "number" ? `£${it.price.toLocaleString()}` : "—"}
                  </span>
                  {it.part ? (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800">
                      Part
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800">
                      Car
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-6 text-sm text-gray-500">Total: {total}</div>
    </main>
  )
}
