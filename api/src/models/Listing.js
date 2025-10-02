import mongoose from 'mongoose'

const ListingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    make: { type: String, index: true },
    model: { type: String, index: true },
    year: { type: Number, index: true },
    price: { type: Number, index: true },
    part: { type: Boolean, default: false, index: true },
    images: [{ type: String }]
  },
  { timestamps: true }
)

ListingSchema.index({ title: 'text', description: 'text', make: 'text', model: 'text' })

export default mongoose.model('Listing', ListingSchema)
