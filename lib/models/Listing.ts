import { Schema, model, models, type Model, type Document } from "mongoose";

export interface ListingDoc extends Document {
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  part: boolean;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ListingSchema = new Schema<ListingDoc>(
  {
    title: { type: String, required: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    price: { type: Number, required: true },
    part: { type: Boolean, default: false },
    images: { type: [String], default: [] },
  },
  { timestamps: true }
);

const ListingModel: Model<ListingDoc> =
  (models.Listing as Model<ListingDoc>) || model<ListingDoc>("Listing", ListingSchema);

export default ListingModel;
export type { ListingDoc };
