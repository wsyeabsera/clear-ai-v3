import mongoose, { Document, Schema } from 'mongoose';

export interface IWasteCode extends Document {
  code: string;
  name: string;
  description?: string;
  color_code?: string;
  code_with_spaces?: string;
  calorific_value_min?: number;
  calorific_value_max?: number;
  calorific_value_comment?: string;
  source?: string;
  created_at: Date;
  updated_at?: Date;
  deleted_at?: Date;
  migration_id?: number;
}

const WasteCodeSchema = new Schema<IWasteCode>({
  code: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  color_code: {
    type: String,
    default: '#0000FF'
  },
  code_with_spaces: {
    type: String
  },
  calorific_value_min: {
    type: Number
  },
  calorific_value_max: {
    type: Number
  },
  calorific_value_comment: {
    type: String
  },
  source: {
    type: String
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
  collection: 'waste_codes'
});

// Indexes for performance
WasteCodeSchema.index({ name: 1 });

export const WasteCode = mongoose.model<IWasteCode>('WasteCode', WasteCodeSchema);
