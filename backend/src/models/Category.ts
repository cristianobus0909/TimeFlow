import { Schema, model, Document, Types } from 'mongoose';

export interface ICategory extends Document {
  userId: Types.ObjectId;
  name: string;
  color: string; // Hex
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '#7C3AED' },
  },
  { timestamps: true }
);

CategorySchema.index({ userId: 1, name: 1 }, { unique: true });

export const Category = model<ICategory>('Category', CategorySchema);
