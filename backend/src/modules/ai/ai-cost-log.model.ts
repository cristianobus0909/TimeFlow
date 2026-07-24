import { Schema, model, Document, Types } from 'mongoose';
import { IAuditFields, ISoftDeleteFields, auditSchemaDefinition, softDeletePlugin } from '@shared/utils/schemaHelpers';

export interface IAICostLog extends Document, IAuditFields, ISoftDeleteFields {
  organization: Types.ObjectId;
  provider: string;
  aiModel: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  user: Types.ObjectId;
  action: string;
  createdAt: Date;
}

const AICostLogSchema = new Schema<IAICostLog>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    provider: { type: String, required: true, trim: true },
    aiModel: { type: String, required: true, trim: true },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, trim: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

AICostLogSchema.plugin(softDeletePlugin);

// Compound index for fast cost reports
AICostLogSchema.index({ organization: 1, createdAt: 1, isDeleted: 1 });

export const AICostLog = model<IAICostLog>('AICostLog', AICostLogSchema);
export default AICostLog;
