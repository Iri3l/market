const mongoose = require('mongoose');
const { Schema } = mongoose;

const listingSchema = new Schema(
  {
    title: { type: String, required: true, index: 'text' },
    description: { type: String, index: 'text' },
    category: { type: String, enum: ['car', 'part', 'other'], default: 'car', index: true },
    price: { type: Number, required: true, index: true },
    currency: { type: String, default: 'GBP' },
    make: { type: String, index: true },
    model: { type: String, index: true },
    year: { type: Number, index: true },
    mileage: { type: Number },
    location: { type: String, index: true },
    images: [{ type: String }],
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

listingSchema.index({ category: 1, price: 1, year: -1 });
listingSchema.index({ make: 1, model: 1, year: -1 });

module.exports = mongoose.model('Listing', listingSchema);
