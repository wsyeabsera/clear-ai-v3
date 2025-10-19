import mongoose, { Document, Schema } from 'mongoose';

export interface IWasteProperty extends Document {
  // Waste details
  waste_description?: string;
  waste_amount?: number;
  waste_designation?: string;
  // Properties (arrays)
  consistency?: string[];
  type_of_waste?: string[];
  processing_steps?: string[];
  // Calorific properties
  min_calorific_value?: number;
  calorific_value?: number;
  biogenic_part?: number;
  plastic_content?: number;
  edge_length?: number;
  // Chemical composition
  water?: number;
  ash?: number;
  fluorine?: number;
  sulfur?: number;
  chlorine?: number;
  flue_gas?: number;
  // Heavy metals
  mercury?: number;
  cadmium?: number;
  lead?: number;
  copper?: number;
  zinc?: number;
  phosphate?: number;
  // Other
  comments?: string;
  // Relationships
  contract: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  // Audit fields
  created_at: Date;
  updated_at?: Date;
  deleted_at?: Date;
  migration_id?: number;
}

const WastePropertySchema = new Schema<IWasteProperty>({
  // Waste details
  waste_description: {
    type: String
  },
  waste_amount: {
    type: Number,
    min: 0
  },
  waste_designation: {
    type: String
  },
  // Properties (arrays)
  consistency: {
    type: [String]
  },
  type_of_waste: {
    type: [String]
  },
  processing_steps: {
    type: [String]
  },
  // Calorific properties
  min_calorific_value: {
    type: Number,
    min: 0
  },
  calorific_value: {
    type: Number,
    min: 0
  },
  biogenic_part: {
    type: Number,
    min: 0,
    max: 100
  },
  plastic_content: {
    type: Number,
    min: 0,
    max: 100
  },
  edge_length: {
    type: Number,
    min: 0
  },
  // Chemical composition (percentages)
  water: {
    type: Number,
    min: 0,
    max: 100
  },
  ash: {
    type: Number,
    min: 0,
    max: 100
  },
  fluorine: {
    type: Number,
    min: 0
  },
  sulfur: {
    type: Number,
    min: 0
  },
  chlorine: {
    type: Number,
    min: 0
  },
  flue_gas: {
    type: Number,
    min: 0
  },
  // Heavy metals (ppm or mg/kg)
  mercury: {
    type: Number,
    min: 0
  },
  cadmium: {
    type: Number,
    min: 0
  },
  lead: {
    type: Number,
    min: 0
  },
  copper: {
    type: Number,
    min: 0
  },
  zinc: {
    type: Number,
    min: 0
  },
  phosphate: {
    type: Number,
    min: 0
  },
  // Other
  comments: {
    type: String
  },
  // Relationships
  contract: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Contract'
  },
  client: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Client',
    index: true
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
  collection: 'waste_properties'
});

// Indexes for performance
export const WasteProperty = mongoose.model<IWasteProperty>('WasteProperty', WastePropertySchema);

