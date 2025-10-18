import mongoose, { Document, Schema } from 'mongoose';

export interface IBunker extends Document {
  uid: string;
  name: string;
  facility: mongoose.Types.ObjectId;
  capacity?: number;
  current_load?: number;
  waste_type?: string;
  status?: string;
  // Technical fields
  has_crane_arm?: boolean;
  crane_arm_model_version?: string;
  gate_number?: number;
  image_type?: string;
  // GCP/Image fields
  gcp_image_path?: string;
  photo?: mongoose.Types.ObjectId;
  // Similarity fields
  similarity_structure_score?: number;
  similarity_color_score?: number;
  // Duplication fields
  is_duplicate?: boolean;
  is_retention_applied?: boolean;
  // Merge tracking fields
  merged_at?: Date;
  merged_by_uid?: string;
  merged_from_shipment_uid?: string;
  // Relationship fields
  client?: mongoose.Types.ObjectId;
  shipment?: mongoose.Types.ObjectId;
  has_child?: boolean;
  // Audit fields
  created_at: Date;
  created_by_uid?: string;
  updated_at?: Date;
  updated_by_uid?: string;
  deleted_at?: Date;
  deleted_by_uid?: string;
  migration_id?: number;
}

const BunkerSchema = new Schema<IBunker>({
  uid: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  facility: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Facility'
  },
  capacity: {
    type: Number
  },
  current_load: {
    type: Number,
    default: 0
  },
  waste_type: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  // Technical fields
  has_crane_arm: {
    type: Boolean
  },
  crane_arm_model_version: {
    type: String
  },
  gate_number: {
    type: Number
  },
  image_type: {
    type: String
  },
  // GCP/Image fields
  gcp_image_path: {
    type: String
  },
  photo: {
    type: Schema.Types.ObjectId,
    ref: 'Photo'
  },
  // Similarity fields
  similarity_structure_score: {
    type: Number,
    min: 0,
    max: 1
  },
  similarity_color_score: {
    type: Number,
    min: 0,
    max: 1
  },
  // Duplication fields
  is_duplicate: {
    type: Boolean,
    default: false
  },
  is_retention_applied: {
    type: Boolean,
    default: false
  },
  // Merge tracking fields
  merged_at: {
    type: Date
  },
  merged_by_uid: {
    type: String
  },
  merged_from_shipment_uid: {
    type: String
  },
  // Relationship fields
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client'
  },
  shipment: {
    type: Schema.Types.ObjectId,
    ref: 'Shipment'
  },
  has_child: {
    type: Boolean,
    default: false
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
  collection: 'bunkers'
});

// Indexes for performance
BunkerSchema.index({ name: 1 });

export const Bunker = mongoose.model<IBunker>('Bunker', BunkerSchema);
