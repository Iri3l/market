import { Router } from 'express'
import Listing from '../models/Listing.js'

const router = Router()

// GET /api/listings?q=&make=&model=&priceMin=&priceMax=&part=&page=&limit=
router.get('/', async (req, res) => {
  try {
    const { q, make, model, priceMin, priceMax, part, page = 1, limit = 20 } = req.query
    const filter = {}
    if (q) filter.$text = { $search: String(q) }
    if (make) filter.make = String(make)
    if (model) filter.model = String(model)
    if (priceMin) filter.price = { ...(filter.price || {}), $gte: Number(priceMin) }
    if (priceMax) filter.price = { ...(filter.price || {}), $lte: Number(priceMax) }
    if (typeof part !== 'undefined') filter.part = part === 'true'

    const pageNum = Math.max(1, Number(page))
    const limitNum = Math.min(100, Math.max(1, Number(limit)))
    const skip = (pageNum - 1) * limitNum

    const [items, total] = await Promise.all([
      Listing.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Listing.countDocuments(filter)
    ])
    res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
