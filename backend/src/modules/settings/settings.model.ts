import { Schema, model, Document, Types } from 'mongoose';

export interface ISettings extends Document {
  userId: Types.ObjectId;
  language: 'es' | 'en';
  theme: 'dark' | 'light';
  timezone: string;
  timeFormat: '12h' | '24h';
  soundAlerts: boolean;
  defaultBreakDuration: number; // in seconds
  keyboardShortcuts: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    language: { type: String, enum: ['es', 'en'], default: 'es' },
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    timezone: { type: String, default: 'UTC' },
    timeFormat: { type: String, enum: ['12h', '24h'], default: '24h' },
    soundAlerts: { type: Boolean, default: true },
    defaultBreakDuration: { type: Number, default: 300 }, // 5 minutes
    keyboardShortcuts: {
      type: Schema.Types.Map,
      of: String,
      default: {
        toggleTimer: 'Space',
        cancelTimer: 'Escape',
        saveTimer: 'KeyS',
      },
    },
  },
  { timestamps: true }
);

export const Settings = model<ISettings>('Settings', SettingsSchema);
export default Settings;
