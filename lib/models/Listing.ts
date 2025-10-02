import { Schema, models, model } from "mongoose"

const ListingSchema = new Schema(
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

ListingSchema.index({ title: "text", description: "text", make: "text", model: "text" })

export type Listing = {
  _id: string
  title: string
  description?: string
  make?: string
  model?: string
  year?: number
  price?: number
  part?: boolean
  images?: string[]
}

export default models.Listing || model("Listing", ListingSchema)
