import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
  name: string;
  // Audit fields
  created_at: Date;
  updated_at?: Date;
  deleted_at?: Date;
  migration_id?: number;
}

const ClientSchema = new Schema<IClient>({
  name: {
    type: String,
    required: true
  },
  // Audit fields
  created_at: {
    type: Date,
    default: Date.now,
    required: true
  },
  updated_at: {
    type: Date
  },
  deleted_at: {
    type: Date
  },
  migration_id: {
    type: Number
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'clients'
});

// Indexes for performance
ClientSchema.index({ name: 1 });

export const Client = mongoose.model<IClient>('Client', ClientSchema);
