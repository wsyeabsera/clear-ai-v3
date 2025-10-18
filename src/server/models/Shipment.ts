import mongoose, { Document, Schema } from 'mongoose';

export interface IShipment extends Document {
  uid: string;
  client_uid: string;
  license_plate: string;
  entry_timestamp?: Date;
  entry_weight?: number;
  exit_timestamp?: Date;
  exit_weight?: number;
  external_reference_id?: string;
  gate_number?: number;
  shipment_datetime?: Date;
  notes?: string;
  source?: string;
  scale_overwrite?: boolean;
  is_duplicate_check_applied?: boolean;
  merged_to_shipment_uid?: string;
  merged_from_shipment_uid?: string;
  merged_at?: Date;
  merged_by_uid?: string;
  facility?: mongoose.Types.ObjectId;
  contract?: mongoose.Types.ObjectId;
  created_at: Date;
  created_by_uid?: string;
  updated_at?: Date;
  updated_by_uid?: string;
  deleted_at?: Date;
  deleted_by_uid?: string;
  migration_id?: number;
}

const ShipmentSchema = new Schema<IShipment>({
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
  license_plate: {
    type: String,
    required: true
  },
  entry_timestamp: {
    type: Date
  },
  entry_weight: {
    type: Number
  },
  exit_timestamp: {
    type: Date
  },
  exit_weight: {
    type: Number
  },
  external_reference_id: {
    type: String
  },
  gate_number: {
    type: Number
  },
  shipment_datetime: {
    type: Date
  },
  notes: {
    type: String
  },
  source: {
    type: String
  },
  scale_overwrite: {
    type: Boolean,
    default: false
  },
  is_duplicate_check_applied: {
    type: Boolean,
    default: false
  },
  merged_to_shipment_uid: {
    type: String
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
  facility: {
    type: Schema.Types.ObjectId,
    ref: 'Facility'
  },
  contract: {
    type: Schema.Types.ObjectId,
    ref: 'Contract'
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
  collection: 'shipments'
});

// Indexes for performance
ShipmentSchema.index({ facility: 1, shipment_datetime: -1 });
ShipmentSchema.index({ license_plate: 1 });
ShipmentSchema.index({ entry_timestamp: -1 });

export const Shipment = mongoose.model<IShipment>('Shipment', ShipmentSchema);
