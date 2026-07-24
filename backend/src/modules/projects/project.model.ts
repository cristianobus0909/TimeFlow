import { Schema, model, Document, Types } from 'mongoose';
import { IAuditFields, ISoftDeleteFields, auditSchemaDefinition, softDeletePlugin } from '@shared/utils/schemaHelpers';

export interface IProject extends Document, IAuditFields, ISoftDeleteFields {
  organization: Types.ObjectId;
  client?: Types.ObjectId;
  name: string;
  description?: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  budgetHours?: number;
  budgetAmount?: number;
  hourlyRate?: number;
  startDate?: Date;
  endDate?: Date;
  estimatedCompletion?: Date;
  tags?: string[];
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: false },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    status: {
      type: String,
      enum: ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
      default: 'PLANNING',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    budgetHours: { type: Number, min: 0 },
    budgetAmount: { type: Number, min: 0 },
    hourlyRate: { type: Number, min: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    estimatedCompletion: { type: Date },
    tags: [{ type: String, trim: true }],
    color: { type: String, trim: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// Apply soft delete plugin
ProjectSchema.plugin(softDeletePlugin);

// Create indexes
ProjectSchema.index({ organization: 1, client: 1, status: 1, isDeleted: 1 });

export const Project = model<IProject>('Project', ProjectSchema);
export default Project;
