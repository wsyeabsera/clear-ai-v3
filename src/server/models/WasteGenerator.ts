import mongoose, { Document, Schema } from 'mongoose';

export interface IWasteGenerator extends Document {
  uid: string;
  client_uid: string;
  name: string;
  external_reference_id?: string;
  region?: string;
  // Contact information
  phone?: string;
  telephone?: string;
  email?: string;
  // Address information
  address?: string;
  street_address?: string;
  city?: string;
  postal_code?: string;
  zip_code?: string;
  country?: string;
  address_notes?: string;
  // Other fields
  source?: string;
  notes?: string;
  // Relationships
  client: mongoose.Types.ObjectId;
  // Audit fields
  created_at: Date;
  created_by_uid?: string;
  updated_at?: Date;
  updated_by_uid?: string;
  deleted_at?: Date;
  deleted_by_uid?: string;
  migration_id?: number;
}

const WasteGeneratorSchema = new Schema<IWasteGenerator>({
  uid: {
    type: String,
    required: true,
    unique: true
  },
  client_uid: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  external_reference_id: {
    type: String
  },
  region: {
    type: String
  },
  // Contact information
  phone: {
    type: String
  },
  telephone: {
    type: String
  },
  email: {
    type: String
  },
  // Address information
  address: {
    type: String
  },
  street_address: {
    type: String
  },
  city: {
    type: String
  },
  postal_code: {
    type: String
  },
  zip_code: {
    type: String
  },
  country: {
    type: String
  },
  address_notes: {
    type: String
  },
  // Other fields
  source: {
    type: String
  },
  notes: {
    type: String
  },
  // Relationships
  client: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Client'
  },
  // Audit fields
  created_at: {
    type: Date,
    default: Date.now,
    required: true
  },
  created_by_uid: {
    type: String
  },
  updated_at: {
    type: Date
  },
  updated_by_uid: {
    type: String
  },
  deleted_at: {
    type: Date
  },
  deleted_by_uid: {
    type: String
  },
  migration_id: {
    type: Number
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'waste_generators'
});

// Indexes for performance
WasteGeneratorSchema.index({ client: 1, uid: 1 });
WasteGeneratorSchema.index({ name: 1 });

export const WasteGenerator = mongoose.model<IWasteGenerator>('WasteGenerator', WasteGeneratorSchema);
