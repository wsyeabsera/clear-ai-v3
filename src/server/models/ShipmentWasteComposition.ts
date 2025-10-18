import mongoose, { Document, Schema } from 'mongoose';

export enum SEVERITY_ENUM {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  NONE = 'NONE'
}

export interface IShipmentWasteComposition extends Document {
  uid: string;
  client_uid: string;
  shipment: mongoose.Types.ObjectId;
  facility: mongoose.Types.ObjectId;
  bunker: mongoose.Types.ObjectId;
  
  // Basic composition fields
  moisture_level?: SEVERITY_ENUM;
  moisture_comment?: string;
  dust_load_level?: SEVERITY_ENUM;
  dust_load_comment?: string;
  calorific_value_min?: number;
  calorific_value_max?: number;
  calorific_value_comment?: string;
  biogenic_content_percentage?: number;
  biogenic_content_comment?: string;
  sulfur_dioxide_risk?: SEVERITY_ENUM;
  sulfur_dioxide_comment?: string;
  hydrochloric_acid_risk?: SEVERITY_ENUM;
  hydrochloric_acid_comment?: string;
  mono_charge_detected?: boolean;
  mono_charge_comment?: string;
  likely_ewc_code?: string;
  likely_ewc_description?: string;
  likely_ewc_comment?: string;
  
  // Material composition fields (32 fields)
  concrete_stones?: number;
  concrete_stones_comment?: string;
  glass?: number;
  glass_comment?: string;
  gypsum_board?: number;
  gypsum_board_comment?: string;
  mineral_fibres?: number;
  mineral_fibres_comment?: string;
  bitumen_roofing_felt?: number;
  bitumen_roofing_felt_comment?: string;
  insulation_foams?: number;
  insulation_foams_comment?: string;
  hbcd_materials?: number;
  hbcd_materials_comment?: string;
  paper_moist?: number;
  paper_moist_comment?: string;
  msw_wet?: number;
  msw_wet_comment?: string;
  msw_mixed?: number;
  msw_mixed_comment?: string;
  garden_household_furniture?: number;
  garden_household_furniture_comment?: string;
  mattresses?: number;
  mattresses_comment?: string;
  carpets?: number;
  carpets_comment?: string;
  wallpaper?: number;
  wallpaper_comment?: string;
  wood_ai_aii?: number;
  wood_ai_aii_comment?: string;
  wood_aiii?: number;
  wood_aiii_comment?: string;
  wood_aiv?: number;
  wood_aiv_comment?: string;
  hard_plastics?: number;
  hard_plastics_comment?: string;
  vehicle_parts_pipes?: number;
  vehicle_parts_pipes_comment?: string;
  films_dirty_pe_pp?: number;
  films_dirty_pe_pp_comment?: string;
  big_bags_pp_fabric?: number;
  big_bags_pp_fabric_comment?: string;
  canisters_barrels?: number;
  canisters_barrels_comment?: string;
  lightweight_packaging_lwp?: number;
  lightweight_packaging_lwp_comment?: string;
  composite_packaging?: number;
  composite_packaging_comment?: string;
  pvc_items?: number;
  pvc_items_comment?: string;
  textiles_clothing?: number;
  textiles_clothing_comment?: string;
  aluminium_shavings_comb?: number;
  aluminium_shavings_comb_comment?: string;
  iron_fe?: number;
  iron_fe_comment?: string;
  copper_cu?: number;
  copper_cu_comment?: string;
  gfrp_cfrp?: number;
  gfrp_cfrp_comment?: string;
  rubber_mixed?: number;
  rubber_mixed_comment?: string;
  sludges_fines?: number;
  sludges_fines_comment?: string;
  
  // Original tracking fields (42 fields)
  original_moisture_level?: SEVERITY_ENUM;
  original_dust_load_level?: SEVERITY_ENUM;
  original_calorific_value_min?: number;
  original_calorific_value_max?: number;
  original_biogenic_content_percentage?: number;
  original_sulfur_dioxide_risk?: SEVERITY_ENUM;
  original_hydrochloric_acid_risk?: SEVERITY_ENUM;
  original_mono_charge_detected?: boolean;
  original_likely_ewc_code?: string;
  original_likely_ewc_description?: string;
  original_concrete_stones?: number;
  original_glass?: number;
  original_gypsum_board?: number;
  original_mineral_fibres?: number;
  original_bitumen_roofing_felt?: number;
  original_insulation_foams?: number;
  original_hbcd_materials?: number;
  original_paper_moist?: number;
  original_msw_wet?: number;
  original_msw_mixed?: number;
  original_garden_household_furniture?: number;
  original_mattresses?: number;
  original_carpets?: number;
  original_wallpaper?: number;
  original_wood_ai_aii?: number;
  original_wood_aiii?: number;
  original_wood_aiv?: number;
  original_hard_plastics?: number;
  original_vehicle_parts_pipes?: number;
  original_films_dirty_pe_pp?: number;
  original_big_bags_pp_fabric?: number;
  original_canisters_barrels?: number;
  original_lightweight_packaging_lwp?: number;
  original_composite_packaging?: number;
  original_pvc_items?: number;
  original_textiles_clothing?: number;
  original_aluminium_shavings_comb?: number;
  original_iron_fe?: number;
  original_copper_cu?: number;
  original_gfrp_cfrp?: number;
  original_rubber_mixed?: number;
  original_sludges_fines?: number;
  
  // Additional fields
  gcp_image_path?: string;
  merged_at?: Date;
  merged_by_uid?: string;
  merged_from_shipment_uid?: string;
  
  // Audit fields
  created_at: Date;
  created_by_uid?: string;
  updated_at?: Date;
  updated_by_uid?: string;
  deleted_at?: Date;
  deleted_by_uid?: string;
  migration_id?: number;
}

const ShipmentWasteCompositionSchema = new Schema<IShipmentWasteComposition>({
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
  shipment: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Shipment'
  },
  facility: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Facility'
  },
  bunker: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Bunker'
  },
  
  // Basic composition fields
  moisture_level: {
    type: String,
    enum: Object.values(SEVERITY_ENUM)
  },
  moisture_comment: {
    type: String
  },
  dust_load_level: {
    type: String,
    enum: Object.values(SEVERITY_ENUM)
  },
  dust_load_comment: {
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
  biogenic_content_percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  biogenic_content_comment: {
    type: String
  },
  sulfur_dioxide_risk: {
    type: String,
    enum: Object.values(SEVERITY_ENUM)
  },
  sulfur_dioxide_comment: {
    type: String
  },
  hydrochloric_acid_risk: {
    type: String,
    enum: Object.values(SEVERITY_ENUM)
  },
  hydrochloric_acid_comment: {
    type: String
  },
  mono_charge_detected: {
    type: Boolean
  },
  mono_charge_comment: {
    type: String
  },
  likely_ewc_code: {
    type: String
  },
  likely_ewc_description: {
    type: String
  },
  likely_ewc_comment: {
    type: String
  },
  
  // Material composition fields (32 fields)
  concrete_stones: {
    type: Number,
    min: 0,
    max: 100
  },
  concrete_stones_comment: {
    type: String
  },
  glass: {
    type: Number,
    min: 0,
    max: 100
  },
  glass_comment: {
    type: String
  },
  gypsum_board: {
    type: Number,
    min: 0,
    max: 100
  },
  gypsum_board_comment: {
    type: String
  },
  mineral_fibres: {
    type: Number,
    min: 0,
    max: 100
  },
  mineral_fibres_comment: {
    type: String
  },
  bitumen_roofing_felt: {
    type: Number,
    min: 0,
    max: 100
  },
  bitumen_roofing_felt_comment: {
    type: String
  },
  insulation_foams: {
    type: Number,
    min: 0,
    max: 100
  },
  insulation_foams_comment: {
    type: String
  },
  hbcd_materials: {
    type: Number,
    min: 0,
    max: 100
  },
  hbcd_materials_comment: {
    type: String
  },
  paper_moist: {
    type: Number,
    min: 0,
    max: 100
  },
  paper_moist_comment: {
    type: String
  },
  msw_wet: {
    type: Number,
    min: 0,
    max: 100
  },
  msw_wet_comment: {
    type: String
  },
  msw_mixed: {
    type: Number,
    min: 0,
    max: 100
  },
  msw_mixed_comment: {
    type: String
  },
  garden_household_furniture: {
    type: Number,
    min: 0,
    max: 100
  },
  garden_household_furniture_comment: {
    type: String
  },
  mattresses: {
    type: Number,
    min: 0,
    max: 100
  },
  mattresses_comment: {
    type: String
  },
  carpets: {
    type: Number,
    min: 0,
    max: 100
  },
  carpets_comment: {
    type: String
  },
  wallpaper: {
    type: Number,
    min: 0,
    max: 100
  },
  wallpaper_comment: {
    type: String
  },
  wood_ai_aii: {
    type: Number,
    min: 0,
    max: 100
  },
  wood_ai_aii_comment: {
    type: String
  },
  wood_aiii: {
    type: Number,
    min: 0,
    max: 100
  },
  wood_aiii_comment: {
    type: String
  },
  wood_aiv: {
    type: Number,
    min: 0,
    max: 100
  },
  wood_aiv_comment: {
    type: String
  },
  hard_plastics: {
    type: Number,
    min: 0,
    max: 100
  },
  hard_plastics_comment: {
    type: String
  },
  vehicle_parts_pipes: {
    type: Number,
    min: 0,
    max: 100
  },
  vehicle_parts_pipes_comment: {
    type: String
  },
  films_dirty_pe_pp: {
    type: Number,
    min: 0,
    max: 100
  },
  films_dirty_pe_pp_comment: {
    type: String
  },
  big_bags_pp_fabric: {
    type: Number,
    min: 0,
    max: 100
  },
  big_bags_pp_fabric_comment: {
    type: String
  },
  canisters_barrels: {
    type: Number,
    min: 0,
    max: 100
  },
  canisters_barrels_comment: {
    type: String
  },
  lightweight_packaging_lwp: {
    type: Number,
    min: 0,
    max: 100
  },
  lightweight_packaging_lwp_comment: {
    type: String
  },
  composite_packaging: {
    type: Number,
    min: 0,
    max: 100
  },
  composite_packaging_comment: {
    type: String
  },
  pvc_items: {
    type: Number,
    min: 0,
    max: 100
  },
  pvc_items_comment: {
    type: String
  },
  textiles_clothing: {
    type: Number,
    min: 0,
    max: 100
  },
  textiles_clothing_comment: {
    type: String
  },
  aluminium_shavings_comb: {
    type: Number,
    min: 0,
    max: 100
  },
  aluminium_shavings_comb_comment: {
    type: String
  },
  iron_fe: {
    type: Number,
    min: 0,
    max: 100
  },
  iron_fe_comment: {
    type: String
  },
  copper_cu: {
    type: Number,
    min: 0,
    max: 100
  },
  copper_cu_comment: {
    type: String
  },
  gfrp_cfrp: {
    type: Number,
    min: 0,
    max: 100
  },
  gfrp_cfrp_comment: {
    type: String
  },
  rubber_mixed: {
    type: Number,
    min: 0,
    max: 100
  },
  rubber_mixed_comment: {
    type: String
  },
  sludges_fines: {
    type: Number,
    min: 0,
    max: 100
  },
  sludges_fines_comment: {
    type: String
  },
  
  // Original tracking fields (42 fields)
  original_moisture_level: {
    type: String,
    enum: Object.values(SEVERITY_ENUM)
  },
  original_dust_load_level: {
    type: String,
    enum: Object.values(SEVERITY_ENUM)
  },
  original_calorific_value_min: {
    type: Number
  },
  original_calorific_value_max: {
    type: Number
  },
  original_biogenic_content_percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  original_sulfur_dioxide_risk: {
    type: String,
    enum: Object.values(SEVERITY_ENUM)
  },
  original_hydrochloric_acid_risk: {
    type: String,
    enum: Object.values(SEVERITY_ENUM)
  },
  original_mono_charge_detected: {
    type: Boolean
  },
  original_likely_ewc_code: {
    type: String
  },
  original_likely_ewc_description: {
    type: String
  },
  original_concrete_stones: {
    type: Number,
    min: 0,
    max: 100
  },
  original_glass: {
    type: Number,
    min: 0,
    max: 100
  },
  original_gypsum_board: {
    type: Number,
    min: 0,
    max: 100
  },
  original_mineral_fibres: {
    type: Number,
    min: 0,
    max: 100
  },
  original_bitumen_roofing_felt: {
    type: Number,
    min: 0,
    max: 100
  },
  original_insulation_foams: {
    type: Number,
    min: 0,
    max: 100
  },
  original_hbcd_materials: {
    type: Number,
    min: 0,
    max: 100
  },
  original_paper_moist: {
    type: Number,
    min: 0,
    max: 100
  },
  original_msw_wet: {
    type: Number,
    min: 0,
    max: 100
  },
  original_msw_mixed: {
    type: Number,
    min: 0,
    max: 100
  },
  original_garden_household_furniture: {
    type: Number,
    min: 0,
    max: 100
  },
  original_mattresses: {
    type: Number,
    min: 0,
    max: 100
  },
  original_carpets: {
    type: Number,
    min: 0,
    max: 100
  },
  original_wallpaper: {
    type: Number,
    min: 0,
    max: 100
  },
  original_wood_ai_aii: {
    type: Number,
    min: 0,
    max: 100
  },
  original_wood_aiii: {
    type: Number,
    min: 0,
    max: 100
  },
  original_wood_aiv: {
    type: Number,
    min: 0,
    max: 100
  },
  original_hard_plastics: {
    type: Number,
    min: 0,
    max: 100
  },
  original_vehicle_parts_pipes: {
    type: Number,
    min: 0,
    max: 100
  },
  original_films_dirty_pe_pp: {
    type: Number,
    min: 0,
    max: 100
  },
  original_big_bags_pp_fabric: {
    type: Number,
    min: 0,
    max: 100
  },
  original_canisters_barrels: {
    type: Number,
    min: 0,
    max: 100
  },
  original_lightweight_packaging_lwp: {
    type: Number,
    min: 0,
    max: 100
  },
  original_composite_packaging: {
    type: Number,
    min: 0,
    max: 100
  },
  original_pvc_items: {
    type: Number,
    min: 0,
    max: 100
  },
  original_textiles_clothing: {
    type: Number,
    min: 0,
    max: 100
  },
  original_aluminium_shavings_comb: {
    type: Number,
    min: 0,
    max: 100
  },
  original_iron_fe: {
    type: Number,
    min: 0,
    max: 100
  },
  original_copper_cu: {
    type: Number,
    min: 0,
    max: 100
  },
  original_gfrp_cfrp: {
    type: Number,
    min: 0,
    max: 100
  },
  original_rubber_mixed: {
    type: Number,
    min: 0,
    max: 100
  },
  original_sludges_fines: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Additional fields
  gcp_image_path: {
    type: String
  },
  merged_at: {
    type: Date
  },
  merged_by_uid: {
    type: String
  },
  merged_from_shipment_uid: {
    type: String
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
  collection: 'shipment_waste_compositions'
});

// Indexes for performance
ShipmentWasteCompositionSchema.index({ shipment: 1, facility: 1 });
ShipmentWasteCompositionSchema.index({ facility: 1, created_at: -1 });

export const ShipmentWasteComposition = mongoose.model<IShipmentWasteComposition>('ShipmentWasteComposition', ShipmentWasteCompositionSchema);
