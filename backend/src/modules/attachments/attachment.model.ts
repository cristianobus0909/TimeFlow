import { Schema, model, Document, Types } from 'mongoose';
import { IAuditFields, ISoftDeleteFields, auditSchemaDefinition, softDeletePlugin } from '@shared/utils/schemaHelpers';

export interface IAttachment extends Document, IAuditFields, ISoftDeleteFields {
  organization: Types.ObjectId;
  user: Types.ObjectId;
  refType: 'CLIENT' | 'PROJECT' | 'TASK';
  refId: Types.ObjectId;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    refType: { type: String, enum: ['CLIENT', 'PROJECT', 'TASK'], required: true },
    refId: { type: Schema.Types.ObjectId, required: true },
    filename: { type: String, required: true, trim: true },
    mimetype: { type: String },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// Apply soft delete plugin
AttachmentSchema.plugin(softDeletePlugin);

// Create compound index for querying attachments by entity
AttachmentSchema.index({ organization: 1, refType: 1, refId: 1, isDeleted: 1 });

export const Attachment = model<IAttachment>('Attachment', AttachmentSchema);
export default Attachment;
