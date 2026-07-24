import { Schema, model, Document, Types } from 'mongoose';
import { IAuditFields, ISoftDeleteFields, auditSchemaDefinition, softDeletePlugin } from '@shared/utils/schemaHelpers';

export interface ICategory extends Document, IAuditFields, ISoftDeleteFields {
  organization: Types.ObjectId;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true, trim: true },
    icon: { type: String, trim: true },
    color: { type: String, trim: true },
    description: { type: String },
    active: { type: Boolean, default: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// Apply soft delete plugin
CategorySchema.plugin(softDeletePlugin);

// Create indexes
CategorySchema.index({ organization: 1, isDeleted: 1 });

export const Category = model<ICategory>('Category', CategorySchema);
export default Category;
