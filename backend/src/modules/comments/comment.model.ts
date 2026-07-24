import { Schema, model, Document, Types } from 'mongoose';
import { IAuditFields, ISoftDeleteFields, auditSchemaDefinition, softDeletePlugin } from '@shared/utils/schemaHelpers';

export interface IComment extends Document, IAuditFields, ISoftDeleteFields {
  organization: Types.ObjectId;
  user: Types.ObjectId;
  refType: 'CLIENT' | 'PROJECT' | 'TASK';
  refId: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    refType: { type: String, enum: ['CLIENT', 'PROJECT', 'TASK'], required: true },
    refId: { type: Schema.Types.ObjectId, required: true },
    content: { type: String, required: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// Apply soft delete plugin
CommentSchema.plugin(softDeletePlugin);

// Create compound index for querying comments by entity
CommentSchema.index({ organization: 1, refType: 1, refId: 1, isDeleted: 1 });

export const Comment = model<IComment>('Comment', CommentSchema);
export default Comment;
