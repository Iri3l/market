# Listings Specification (v0)

Goal: deliver listings competitive (cars & parts); start lean, be extensible.

## Data Model (Mongo)
- title (string, required)
- description (string)
- kind: 'car' | 'part'
- make, model, year?, mileage?, fuelType?, transmission?, bodyType?, colour?
- partCategory? (if kind='part'), compatibility?: string[]
- price (number, >0), currency 'GBP'
- location: country, region?, city?, postcode?
- images: [{ key, url, caption?, order }]
- status: 'draft'|'active'|'paused'|'sold'|'removed'
- createdAt, updatedAt
Indexes: { status, kind, make, model, year, price }, text index on title/description.

## API (v0)
GET /api/listings?q,make,model,priceMin,priceMax,part,page,limit,sort
→ { items, total, page, pages }

v1 (later): GET /api/listings/:slug, POST/PATCH listing, presign images, moderation.
