import mongoose, { Document, Schema } from 'mongoose';

export interface IFacility extends Document {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  region?: string;
  postal_code?: string;
  zip_code?: string;
  street_address?: string;
  email?: string;
  phone?: string;
  telephone?: string;
  language?: string;
  sort_code?: string;
  door_count?: number;
  number_of_doors?: number;
  grid_width?: number;
  grid_depth?: number;
  disposal_number?: string;
  address_notes?: string;
  notes?: string;
  external_reference_id?: string;
  photo_bunkers_processing_time?: number;
  photo_doors_processing_time?: number;
  photo_loads_processing_time?: number;
  rules_explosive_risk_check?: boolean;
  rules_item_size_limit?: boolean;
  rules_singular_delivery_check?: boolean;
  rules_waste_item_rule_check?: boolean;
  rules_waste_item_size_check?: boolean;
  client: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at?: Date;
  deleted_at?: Date;
  migration_id?: number;
}

const FacilitySchema = new Schema<IFacility>({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String
  },
  city: {
    type: String
  },
  country: {
    type: String
  },
  region: {
    type: String
  },
  postal_code: {
    type: String
  },
  zip_code: {
    type: String
  },
  street_address: {
    type: String
  },
  email: {
    type: String
  },
  phone: {
    type: String
  },
  telephone: {
    type: String
  },
  language: {
    type: String
  },
  sort_code: {
    type: String
  },
  door_count: {
    type: Number
  },
  number_of_doors: {
    type: Number
  },
  grid_width: {
    type: Number
  },
  grid_depth: {
    type: Number
  },
  disposal_number: {
    type: String
  },
  address_notes: {
    type: String
  },
  notes: {
    type: String
  },
  external_reference_id: {
    type: String
  },
  photo_bunkers_processing_time: {
    type: Number
  },
  photo_doors_processing_time: {
    type: Number
  },
  photo_loads_processing_time: {
    type: Number
  },
  rules_explosive_risk_check: {
    type: Boolean,
    default: false
  },
  rules_item_size_limit: {
    type: Boolean,
    default: false
  },
  rules_singular_delivery_check: {
    type: Boolean,
    default: false
  },
  rules_waste_item_rule_check: {
    type: Boolean,
    default: false
  },
  rules_waste_item_size_check: {
    type: Boolean,
    default: false
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
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
  collection: 'facilities'
});

// Indexes for performance
FacilitySchema.index({ client: 1, name: 1 });
FacilitySchema.index({ city: 1, country: 1 });

export const Facility = mongoose.model<IFacility>('Facility', FacilitySchema);
