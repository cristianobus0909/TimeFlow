import { Schema, model, Document, Types } from 'mongoose';

export interface IBreak extends Document {
  sessionId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  type: 'break' | 'dead_time';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BreakSchema = new Schema<IBreak>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'TimeSession', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    duration: { type: Number, required: true }, // in seconds
    type: { type: String, enum: ['break', 'dead_time'], default: 'break' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Break = model<IBreak>('Break', BreakSchema);
