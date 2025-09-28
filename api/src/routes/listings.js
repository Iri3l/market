const router = require('express').Router();
const Listing = require('../models/Listing');
const auth = require('../middleware/auth');

// GET /api/listings
router.get('/', async (req, res) => {
  const {
    q, category, make, model, minPrice, maxPrice, year, location,
    page = 1, limit = 20, sort = 'createdAt', order = 'desc',
  } = req.query;

  const filter = { active: true };
  if (category) filter.category = category;
  if (make) filter.make = make;
  if (model) filter.model = model;
  if (year) filter.year = Number(year);
  if (location) filter.location = location;
  if (minPrice || maxPrice) filter.price = {};
  if (minPrice) filter.price.$gte = Number(minPrice);
  if (maxPrice) filter.price.$lte = Number(maxPrice);
  if (q) filter.$text = { $search: q };

  const skip = (Number(page) - 1) * Number(limit);
  const sortSpec = { [sort]: order === 'asc' ? 1 : -1 };

  const [items, count] = await Promise.all([
    Listing.find(filter).sort(sortSpec).skip(skip).limit(Number(limit)).lean(),
    Listing.countDocuments(filter),
  ]);

  res.json({ items, count, page: Number(page), pages: Math.ceil(count / Number(limit)) });
});

// GET /api/listings/:id
router.get('/:id', async (req, res) => {
  const item = await Listing.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ error: 'not found' });
  res.json(item);
});

// POST /api/listings (auth)
router.post('/', auth, async (req, res) => {
  const data = req.body;
  data.seller = req.user.id;
  const created = await Listing.create(data);
  res.status(201).json(created);
});

// PUT /api/listings/:id (auth + owner)
router.put('/:id', auth, async (req, res) => {
  const updated = await Listing.findOneAndUpdate(
    { _id: req.params.id, seller: req.user.id },
    req.body,
    { new: true },
  );
  if (!updated) return res.status(404).json({ error: 'not found or not owner' });
  res.json(updated);
});

// DELETE /api/listings/:id (auth + owner)
router.delete('/:id', auth, async (req, res) => {
  const deleted = await Listing.findOneAndDelete({ _id: req.params.id, seller: req.user.id });
  if (!deleted) return res.status(404).json({ error: 'not found or not owner' });
  res.json({ ok: true });
});

module.exports = router;
