import { Schema, model, Document, Types } from 'mongoose';
import { IAuditFields, ISoftDeleteFields, auditSchemaDefinition, softDeletePlugin } from '@shared/utils/schemaHelpers';

export interface ITimelineEvent extends Document, IAuditFields, ISoftDeleteFields {
  organization: Types.ObjectId;
  user: Types.ObjectId;
  action: string;
  detail?: string;
  refType: 'CLIENT' | 'PROJECT' | 'TASK' | 'SESSION';
  refId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TimelineEventSchema = new Schema<ITimelineEvent>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, trim: true },
    detail: { type: String },
    refType: { type: String, enum: ['CLIENT', 'PROJECT', 'TASK', 'SESSION'], required: true },
    refId: { type: Schema.Types.ObjectId, required: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// Apply soft delete plugin
TimelineEventSchema.plugin(softDeletePlugin);

// Create compound index for querying timeline events
TimelineEventSchema.index({ organization: 1, refType: 1, refId: 1, isDeleted: 1 });

export const TimelineEvent = model<ITimelineEvent>('TimelineEvent', TimelineEventSchema);
export default TimelineEvent;
