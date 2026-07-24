import { Schema, model, Document, Types } from 'mongoose';
import { IAuditFields, ISoftDeleteFields, auditSchemaDefinition, softDeletePlugin } from '@shared/utils/schemaHelpers';

export interface IAISettings extends Document, IAuditFields, ISoftDeleteFields {
  organization: Types.ObjectId;
  provider: 'GEMINI' | 'OPENAI' | 'CLAUDE' | 'LOCAL';
  model: string;
  creativity: number;
  language: string;
  privacy: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AISettingsSchema = new Schema<IAISettings>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true },
    provider: {
      type: String,
      enum: ['GEMINI', 'OPENAI', 'CLAUDE', 'LOCAL'],
      default: 'GEMINI',
      required: true,
    },
    model: { type: String, default: 'gemini-1.5-pro', required: true },
    creativity: { type: Number, default: 0.7, min: 0, max: 1 },
    language: { type: String, default: 'es' },
    privacy: { type: Boolean, default: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

AISettingsSchema.plugin(softDeletePlugin);

export const AISettings = model<IAISettings>('AISettings', AISettingsSchema);
export default AISettings;
