import mongoose, { Document, Schema } from 'mongoose';

export interface IInspection extends Document {
  additional_categories?: any[];
  akb_reasons?: any[];
  calorific_value?: number;
  category_values?: any[];
  comments?: string;
  consistency?: string;
  custom_datetime?: Date;
  delivery_accepted?: boolean;
  delivery_matches_conditions?: boolean;
  delivery_rejected?: boolean;
  edge_length?: number;
  external_reference_id?: string;
  fecal_smell?: boolean;
  incorrectly_declared?: boolean;
  license_plate?: string;
  moisture?: number;
  partial_unloading?: boolean;
  pungent_smell?: boolean;
  salvage?: boolean;
  sample_incineration?: boolean;
  solvent_like_smell?: boolean;
  merged_from_shipment?: mongoose.Types.ObjectId;
  merged_at?: Date;
  facility: mongoose.Types.ObjectId;
  shipment: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at?: Date;
  deleted_at?: Date;
  migration_id?: number;
}

const InspectionSchema = new Schema<IInspection>({
  additional_categories: [{
    type: Schema.Types.Mixed
  }],
  akb_reasons: [{
    type: Schema.Types.Mixed
  }],
  calorific_value: {
    type: Number
  },
  category_values: [{
    type: Schema.Types.Mixed
  }],
  comments: {
    type: String
  },
  consistency: {
    type: String
  },
  custom_datetime: {
    type: Date
  },
  delivery_accepted: {
    type: Boolean,
    default: false
  },
  delivery_matches_conditions: {
    type: Boolean,
    default: false
  },
  delivery_rejected: {
    type: Boolean,
    default: false
  },
  edge_length: {
    type: Number
  },
  external_reference_id: {
    type: String
  },
  fecal_smell: {
    type: Boolean,
    default: false
  },
  incorrectly_declared: {
    type: Boolean,
    default: false
  },
  license_plate: {
    type: String
  },
  moisture: {
    type: Number
  },
  partial_unloading: {
    type: Boolean,
    default: false
  },
  pungent_smell: {
    type: Boolean,
    default: false
  },
  salvage: {
    type: Boolean,
    default: false
  },
  sample_incineration: {
    type: Boolean,
    default: false
  },
  solvent_like_smell: {
    type: Boolean,
    default: false
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
    ref: 'Facility',
    required: true
  },
  shipment: {
    type: Schema.Types.ObjectId,
    ref: 'Shipment',
    required: true
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
  collection: 'inspections'
});

// Indexes for performance
InspectionSchema.index({ shipment: 1, custom_datetime: -1 });
InspectionSchema.index({ facility: 1, custom_datetime: -1 });

export const Inspection = mongoose.model<IInspection>('Inspection', InspectionSchema);
