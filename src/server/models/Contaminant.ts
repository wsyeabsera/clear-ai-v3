import mongoose, { Document, Schema } from 'mongoose';

export interface IContaminant extends Document {
  uid: string;
  is_verified?: boolean;
  is_correct?: boolean;
  reason?: any; // Object type from API
  notes?: string;
  local_notes?: string;
  analysis_notes?: string;
  gcp_image_path?: string;
  gcp_highlight_path?: string;
  waste_item_uid?: string;
  friendly_name?: string;
  local_friendly_name?: string;
  estimated_size?: number;
  material?: string;
  local_material?: string;
  hydrochloric_acid_risk_level?: any; // Object type from API
  sulfur_dioxide_risk_level?: any; // Object type from API
  explosive_risk_level?: any; // Object type from API
  gate_number?: string;
  entry_timestamp?: Date;
  license_plate?: string;
  captured_datetime?: Date;
  merged_from_shipment_uid?: string;
  merged_at?: Date;
  merged_by_uid?: string;
  original_reason?: any;
  original_notes?: string;
  original_local_notes?: string;
  original_waste_item_uid?: string;
  original_friendly_name?: string;
  original_local_friendly_name?: string;
  original_estimated_size?: number;
  original_material?: string;
  original_local_material?: string;
  original_hydrochloric_acid_risk_level?: any;
  original_sulfur_dioxide_risk_level?: any;
  original_explosive_risk_level?: any;
  original_gate_number?: string;
  original_entry_timestamp?: Date;
  original_license_plate?: string;
  client: mongoose.Types.ObjectId;
  facility: mongoose.Types.ObjectId;
  shipment: mongoose.Types.ObjectId;
  created_at: Date;
  created_by_uid?: string;
  updated_at?: Date;
  updated_by_uid?: string;
  deleted_at?: Date;
  deleted_by_uid?: string;
  migration_id?: number;
}

const ContaminantSchema = new Schema<IContaminant>({
  uid: {
    type: String,
    required: true,
    unique: true
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  is_correct: {
    type: Boolean,
    default: false
  },
  reason: {
    type: Schema.Types.Mixed
  },
  notes: {
    type: String
  },
  local_notes: {
    type: String
  },
  analysis_notes: {
    type: String
  },
  gcp_image_path: {
    type: String
  },
  gcp_highlight_path: {
    type: String
  },
  waste_item_uid: {
    type: String
  },
  friendly_name: {
    type: String
  },
  local_friendly_name: {
    type: String
  },
  estimated_size: {
    type: Number
  },
  material: {
    type: String
  },
  local_material: {
    type: String
  },
  hydrochloric_acid_risk_level: {
    type: Schema.Types.Mixed
  },
  sulfur_dioxide_risk_level: {
    type: Schema.Types.Mixed
  },
  explosive_risk_level: {
    type: Schema.Types.Mixed
  },
  gate_number: {
    type: String
  },
  entry_timestamp: {
    type: Date
  },
  license_plate: {
    type: String
  },
  captured_datetime: {
    type: Date
  },
  merged_from_shipment_uid: {
    type: String
  },
  merged_at: {
    type: Date
  },
  merged_by_uid: {
    type: String
  },
  original_reason: {
    type: Schema.Types.Mixed
  },
  original_notes: {
    type: String
  },
  original_local_notes: {
    type: String
  },
  original_waste_item_uid: {
    type: String
  },
  original_friendly_name: {
    type: String
  },
  original_local_friendly_name: {
    type: String
  },
  original_estimated_size: {
    type: Number
  },
  original_material: {
    type: String
  },
  original_local_material: {
    type: String
  },
  original_hydrochloric_acid_risk_level: {
    type: Schema.Types.Mixed
  },
  original_sulfur_dioxide_risk_level: {
    type: Schema.Types.Mixed
  },
  original_explosive_risk_level: {
    type: Schema.Types.Mixed
  },
  original_gate_number: {
    type: String
  },
  original_entry_timestamp: {
    type: Date
  },
  original_license_plate: {
    type: String
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  facility: {
    type: Schema.Types.ObjectId,
    ref: 'Facility',
    required: true
  },
  shipment: {
    type: Schema.Types.ObjectId,
    ref: 'Shipment',
    required: true
  },
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
  collection: 'contaminants'
});

// Indexes for performance
ContaminantSchema.index({ uid: 1 });
ContaminantSchema.index({ client: 1, facility: 1 });
ContaminantSchema.index({ shipment: 1, captured_datetime: -1 });
ContaminantSchema.index({ facility: 1, captured_datetime: -1 });

export const Contaminant = mongoose.model<IContaminant>('Contaminant', ContaminantSchema);
