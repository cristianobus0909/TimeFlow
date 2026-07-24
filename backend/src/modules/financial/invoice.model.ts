import { Schema, model, Document, Types } from 'mongoose';
import { IAuditFields, ISoftDeleteFields, auditSchemaDefinition, softDeletePlugin } from '@shared/utils/schemaHelpers';

export interface IInvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface IInvoice extends Document, IAuditFields, ISoftDeleteFields {
  organization: Types.ObjectId;
  number: string;
  client: Types.ObjectId;
  project?: Types.ObjectId;
  issueDate: Date;
  dueDate: Date;
  subtotal: number;
  taxes: number;
  discount: number;
  total: number;
  currency: string;
  status: 'DRAFT' | 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes?: string;
  items: IInvoiceItem[];
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  rate: { type: Number, required: true, default: 0 },
  amount: { type: Number, required: true, default: 0 },
});

const InvoiceSchema = new Schema<IInvoice>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    number: { type: String, required: true, trim: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: false },
    issueDate: { type: Date, default: Date.now, required: true },
    dueDate: { type: Date, required: true },
    subtotal: { type: Number, required: true, default: 0 },
    taxes: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'USD', required: true, trim: true },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'],
      default: 'DRAFT',
      required: true,
    },
    notes: { type: String },
    items: { type: [InvoiceItemSchema], default: [], required: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

InvoiceSchema.plugin(softDeletePlugin);

// Unique invoice number scoped to the tenant organization
InvoiceSchema.index({ organization: 1, number: 1 }, { unique: true });
InvoiceSchema.index({ organization: 1, client: 1, status: 1, isDeleted: 1 });

export const Invoice = model<IInvoice>('Invoice', InvoiceSchema);
export default Invoice;
