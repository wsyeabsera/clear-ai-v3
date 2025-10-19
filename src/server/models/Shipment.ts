import mongoose, { Document, Schema } from 'mongoose';

export interface IShipment extends Document {
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
  merged_to_shipment?: mongoose.Types.ObjectId;
  merged_from_shipment?: mongoose.Types.ObjectId;
  merged_at?: Date;
  facility?: mongoose.Types.ObjectId;
  contract?: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at?: Date;
  deleted_at?: Date;
  migration_id?: number;
}

const ShipmentSchema = new Schema<IShipment>({
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
  merged_to_shipment: {
    type: Schema.Types.ObjectId,
    ref: 'Shipment'
  },
  merged_from_shipment: {
    type: Schema.Types.ObjectId,
    ref: 'Shipment'
  },
  merged_at: {
    type: Date
  },
  facility: {
    type: Schema.Types.ObjectId,
    ref: 'Facility'
  },
  contract: {
    type: Schema.Types.ObjectId,
    ref: 'Contract'
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
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
  collection: 'shipments'
});

// Indexes for performance
ShipmentSchema.index({ facility: 1, shipment_datetime: -1 });
ShipmentSchema.index({ license_plate: 1 });
ShipmentSchema.index({ entry_timestamp: -1 });

export const Shipment = mongoose.model<IShipment>('Shipment', ShipmentSchema);
