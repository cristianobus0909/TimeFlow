import { Schema, Types } from 'mongoose';

export interface IAuditFields {
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

export interface ISoftDeleteFields {
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  isDeleted: boolean;
}

export const auditSchemaDefinition = {
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
};

export const softDeleteSchemaDefinition = {
  deletedAt: { type: Date, required: false },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  isDeleted: { type: Boolean, default: false, index: true },
};

export function softDeletePlugin(schema: Schema): void {
  // Add the soft delete fields to the schema
  schema.add(softDeleteSchemaDefinition);

  // Hook to automatically filter out soft-deleted records
  const filterNonDeleted = function (this: any, next: (err?: Error) => void) {
    const filter = this.getFilter();
    if (filter && filter.isDeleted === undefined) {
      this.where({ isDeleted: { $ne: true } });
    }
    next();
  };

  schema.pre('find', filterNonDeleted);
  schema.pre('findOne', filterNonDeleted);
  schema.pre('countDocuments', filterNonDeleted);
  schema.pre('estimatedDocumentCount', filterNonDeleted);
  schema.pre('findOneAndUpdate', filterNonDeleted);
  schema.pre('updateOne', filterNonDeleted);
  schema.pre('updateMany', filterNonDeleted);
}
