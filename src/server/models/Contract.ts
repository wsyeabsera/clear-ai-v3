import mongoose, { Document, Schema } from 'mongoose';

export interface IContract extends Document {
  title?: string;
  external_reference_id?: string;
  external_waste_code_id?: string;
  source?: string;
  start_date?: Date;
  end_date?: Date;
  tonnage_min?: number;
  tonnage_max?: number;
  tonnage_actual?: number;
  created_at: Date;
  updated_at?: Date;
  deleted_at?: Date;
  migration_id?: number;
  // References to other entities
  client: mongoose.Types.ObjectId;
  facility: mongoose.Types.ObjectId;
  importer?: mongoose.Types.ObjectId;
  exporter?: mongoose.Types.ObjectId;
  carrier?: mongoose.Types.ObjectId;
  waste_generator?: mongoose.Types.ObjectId;
  waste_code?: mongoose.Types.ObjectId;
  waste_property_customized?: mongoose.Types.ObjectId;
  waste_property_original?: mongoose.Types.ObjectId;
}

const ContractSchema = new Schema<IContract>({
  title: {
    type: String
  },
  external_reference_id: {
    type: String
  },
  external_waste_code_id: {
    type: String
  },
  source: {
    type: String
  },
  start_date: {
    type: Date
  },
  end_date: {
    type: Date
  },
  tonnage_min: {
    type: Number
  },
  tonnage_max: {
    type: Number
  },
  tonnage_actual: {
    type: Number
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
  },
  // References
  client: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Client',
    index: true
  },
  facility: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Facility'
  },
  importer: {
    type: Schema.Types.ObjectId,
    ref: 'Importer'
  },
  exporter: {
    type: Schema.Types.ObjectId,
    ref: 'Exporter'
  },
  carrier: {
    type: Schema.Types.ObjectId,
    ref: 'Carrier'
  },
  waste_generator: {
    type: Schema.Types.ObjectId,
    ref: 'WasteGenerator'
  },
  waste_code: {
    type: Schema.Types.ObjectId,
    ref: 'WasteCode'
  },
  waste_property_customized: {
    type: Schema.Types.ObjectId,
    ref: 'WasteProperty'
  },
  waste_property_original: {
    type: Schema.Types.ObjectId,
    ref: 'WasteProperty'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'contracts'
});

// Indexes for performance
ContractSchema.index({ facility: 1, start_date: -1 });
ContractSchema.index({ waste_generator: 1 });
ContractSchema.index({ waste_code: 1 });

export const Contract = mongoose.model<IContract>('Contract', ContractSchema);
