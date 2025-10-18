import { ICommand } from '../ICommand';
import { ShipmentWasteComposition, SEVERITY_ENUM } from '../../models/ShipmentWasteComposition';
import { Shipment } from '../../models/Shipment';
import { Facility } from '../../models/Facility';
import { Bunker } from '../../models/Bunker';

export class CreateShipmentWasteCompositionCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const {
        uid,
        client_uid,
        shipment_uid,
        facility_uid,
        bunker_uid,
        // Basic composition fields
        moisture_level,
        moisture_comment,
        dust_load_level,
        dust_load_comment,
        calorific_value_min,
        calorific_value_max,
        calorific_value_comment,
        biogenic_content_percentage,
        biogenic_content_comment,
        sulfur_dioxide_risk,
        sulfur_dioxide_comment,
        hydrochloric_acid_risk,
        hydrochloric_acid_comment,
        mono_charge_detected,
        mono_charge_comment,
        likely_ewc_code,
        likely_ewc_description,
        likely_ewc_comment,
        // Material composition fields
        concrete_stones,
        concrete_stones_comment,
        glass,
        glass_comment,
        gypsum_board,
        gypsum_board_comment,
        mineral_fibres,
        mineral_fibres_comment,
        bitumen_roofing_felt,
        bitumen_roofing_felt_comment,
        insulation_foams,
        insulation_foams_comment,
        hbcd_materials,
        hbcd_materials_comment,
        paper_moist,
        paper_moist_comment,
        msw_wet,
        msw_wet_comment,
        msw_mixed,
        msw_mixed_comment,
        garden_household_furniture,
        garden_household_furniture_comment,
        mattresses,
        mattresses_comment,
        carpets,
        carpets_comment,
        wallpaper,
        wallpaper_comment,
        wood_ai_aii,
        wood_ai_aii_comment,
        wood_aiii,
        wood_aiii_comment,
        wood_aiv,
        wood_aiv_comment,
        hard_plastics,
        hard_plastics_comment,
        vehicle_parts_pipes,
        vehicle_parts_pipes_comment,
        films_dirty_pe_pp,
        films_dirty_pe_pp_comment,
        big_bags_pp_fabric,
        big_bags_pp_fabric_comment,
        canisters_barrels,
        canisters_barrels_comment,
        lightweight_packaging_lwp,
        lightweight_packaging_lwp_comment,
        composite_packaging,
        composite_packaging_comment,
        pvc_items,
        pvc_items_comment,
        textiles_clothing,
        textiles_clothing_comment,
        aluminium_shavings_comb,
        aluminium_shavings_comb_comment,
        iron_fe,
        iron_fe_comment,
        copper_cu,
        copper_cu_comment,
        gfrp_cfrp,
        gfrp_cfrp_comment,
        rubber_mixed,
        rubber_mixed_comment,
        sludges_fines,
        sludges_fines_comment,
        // Additional fields
        gcp_image_path
      } = params;

      // Validate required fields
      if (!uid || !client_uid || !shipment_uid || !facility_uid || !bunker_uid) {
        throw new Error('Missing required fields: uid, client_uid, shipment_uid, facility_uid, bunker_uid');
      }

      // Check if waste composition already exists
      const existingComposition = await ShipmentWasteComposition.findOne({ uid });
      if (existingComposition) {
        throw new Error(`Shipment waste composition with UID ${uid} already exists`);
      }

      // Find related entities to get ObjectIds
      const [shipment, facility, bunker] = await Promise.all([
        Shipment.findOne({ uid: shipment_uid }),
        Facility.findOne({ uid: facility_uid }),
        Bunker.findOne({ uid: bunker_uid })
      ]);

      if (!shipment) {
        throw new Error(`Shipment with UID ${shipment_uid} not found`);
      }
      if (!facility) {
        throw new Error(`Facility with UID ${facility_uid} not found`);
      }
      if (!bunker) {
        throw new Error(`Bunker with UID ${bunker_uid} not found`);
      }

      // Create new waste composition
      const compositionData: any = {
        uid,
        client_uid,
        shipment: shipment._id,
        facility: facility._id,
        bunker: bunker._id,
        created_at: new Date(),
        created_by_uid: client_uid
      };

      // Add basic composition fields if provided
      if (moisture_level && Object.values(SEVERITY_ENUM).includes(moisture_level)) {
        compositionData.moisture_level = moisture_level;
      }
      if (moisture_comment) compositionData.moisture_comment = moisture_comment;
      if (dust_load_level && Object.values(SEVERITY_ENUM).includes(dust_load_level)) {
        compositionData.dust_load_level = dust_load_level;
      }
      if (dust_load_comment) compositionData.dust_load_comment = dust_load_comment;
      if (calorific_value_min !== undefined) compositionData.calorific_value_min = calorific_value_min;
      if (calorific_value_max !== undefined) compositionData.calorific_value_max = calorific_value_max;
      if (calorific_value_comment) compositionData.calorific_value_comment = calorific_value_comment;
      if (biogenic_content_percentage !== undefined) compositionData.biogenic_content_percentage = biogenic_content_percentage;
      if (biogenic_content_comment) compositionData.biogenic_content_comment = biogenic_content_comment;
      if (sulfur_dioxide_risk && Object.values(SEVERITY_ENUM).includes(sulfur_dioxide_risk)) {
        compositionData.sulfur_dioxide_risk = sulfur_dioxide_risk;
      }
      if (sulfur_dioxide_comment) compositionData.sulfur_dioxide_comment = sulfur_dioxide_comment;
      if (hydrochloric_acid_risk && Object.values(SEVERITY_ENUM).includes(hydrochloric_acid_risk)) {
        compositionData.hydrochloric_acid_risk = hydrochloric_acid_risk;
      }
      if (hydrochloric_acid_comment) compositionData.hydrochloric_acid_comment = hydrochloric_acid_comment;
      if (mono_charge_detected !== undefined) compositionData.mono_charge_detected = mono_charge_detected;
      if (mono_charge_comment) compositionData.mono_charge_comment = mono_charge_comment;
      if (likely_ewc_code) compositionData.likely_ewc_code = likely_ewc_code;
      if (likely_ewc_description) compositionData.likely_ewc_description = likely_ewc_description;
      if (likely_ewc_comment) compositionData.likely_ewc_comment = likely_ewc_comment;

      // Add material composition fields if provided
      const materialFields = [
        'concrete_stones', 'glass', 'gypsum_board', 'mineral_fibres', 'bitumen_roofing_felt',
        'insulation_foams', 'hbcd_materials', 'paper_moist', 'msw_wet', 'msw_mixed',
        'garden_household_furniture', 'mattresses', 'carpets', 'wallpaper',
        'wood_ai_aii', 'wood_aiii', 'wood_aiv', 'hard_plastics', 'vehicle_parts_pipes',
        'films_dirty_pe_pp', 'big_bags_pp_fabric', 'canisters_barrels', 'lightweight_packaging_lwp',
        'composite_packaging', 'pvc_items', 'textiles_clothing', 'aluminium_shavings_comb',
        'iron_fe', 'copper_cu', 'gfrp_cfrp', 'rubber_mixed', 'sludges_fines'
      ];

      materialFields.forEach(field => {
        const value = params[field];
        const commentField = `${field}_comment`;
        const commentValue = params[commentField];
        
        if (value !== undefined && value !== null) {
          compositionData[field] = value;
        }
        if (commentValue !== undefined && commentValue !== null) {
          compositionData[commentField] = commentValue;
        }
      });

      // Add additional fields if provided
      if (gcp_image_path) compositionData.gcp_image_path = gcp_image_path;

      const composition = new ShipmentWasteComposition(compositionData);
      const savedComposition = await composition.save();

      return {
        success: true,
        data: {
          uid: savedComposition.uid,
          client_uid: savedComposition.client_uid,
          shipment_uid: shipment_uid,
          facility_uid: facility_uid,
          bunker_uid: bunker_uid,
          // Basic composition fields
          moisture_level: savedComposition.moisture_level,
          moisture_comment: savedComposition.moisture_comment,
          dust_load_level: savedComposition.dust_load_level,
          dust_load_comment: savedComposition.dust_load_comment,
          calorific_value_min: savedComposition.calorific_value_min,
          calorific_value_max: savedComposition.calorific_value_max,
          calorific_value_comment: savedComposition.calorific_value_comment,
          biogenic_content_percentage: savedComposition.biogenic_content_percentage,
          biogenic_content_comment: savedComposition.biogenic_content_comment,
          sulfur_dioxide_risk: savedComposition.sulfur_dioxide_risk,
          sulfur_dioxide_comment: savedComposition.sulfur_dioxide_comment,
          hydrochloric_acid_risk: savedComposition.hydrochloric_acid_risk,
          hydrochloric_acid_comment: savedComposition.hydrochloric_acid_comment,
          mono_charge_detected: savedComposition.mono_charge_detected,
          mono_charge_comment: savedComposition.mono_charge_comment,
          likely_ewc_code: savedComposition.likely_ewc_code,
          likely_ewc_description: savedComposition.likely_ewc_description,
          likely_ewc_comment: savedComposition.likely_ewc_comment,
          // Material composition fields
          concrete_stones: savedComposition.concrete_stones,
          concrete_stones_comment: savedComposition.concrete_stones_comment,
          glass: savedComposition.glass,
          glass_comment: savedComposition.glass_comment,
          gypsum_board: savedComposition.gypsum_board,
          gypsum_board_comment: savedComposition.gypsum_board_comment,
          mineral_fibres: savedComposition.mineral_fibres,
          mineral_fibres_comment: savedComposition.mineral_fibres_comment,
          bitumen_roofing_felt: savedComposition.bitumen_roofing_felt,
          bitumen_roofing_felt_comment: savedComposition.bitumen_roofing_felt_comment,
          insulation_foams: savedComposition.insulation_foams,
          insulation_foams_comment: savedComposition.insulation_foams_comment,
          hbcd_materials: savedComposition.hbcd_materials,
          hbcd_materials_comment: savedComposition.hbcd_materials_comment,
          paper_moist: savedComposition.paper_moist,
          paper_moist_comment: savedComposition.paper_moist_comment,
          msw_wet: savedComposition.msw_wet,
          msw_wet_comment: savedComposition.msw_wet_comment,
          msw_mixed: savedComposition.msw_mixed,
          msw_mixed_comment: savedComposition.msw_mixed_comment,
          garden_household_furniture: savedComposition.garden_household_furniture,
          garden_household_furniture_comment: savedComposition.garden_household_furniture_comment,
          mattresses: savedComposition.mattresses,
          mattresses_comment: savedComposition.mattresses_comment,
          carpets: savedComposition.carpets,
          carpets_comment: savedComposition.carpets_comment,
          wallpaper: savedComposition.wallpaper,
          wallpaper_comment: savedComposition.wallpaper_comment,
          wood_ai_aii: savedComposition.wood_ai_aii,
          wood_ai_aii_comment: savedComposition.wood_ai_aii_comment,
          wood_aiii: savedComposition.wood_aiii,
          wood_aiii_comment: savedComposition.wood_aiii_comment,
          wood_aiv: savedComposition.wood_aiv,
          wood_aiv_comment: savedComposition.wood_aiv_comment,
          hard_plastics: savedComposition.hard_plastics,
          hard_plastics_comment: savedComposition.hard_plastics_comment,
          vehicle_parts_pipes: savedComposition.vehicle_parts_pipes,
          vehicle_parts_pipes_comment: savedComposition.vehicle_parts_pipes_comment,
          films_dirty_pe_pp: savedComposition.films_dirty_pe_pp,
          films_dirty_pe_pp_comment: savedComposition.films_dirty_pe_pp_comment,
          big_bags_pp_fabric: savedComposition.big_bags_pp_fabric,
          big_bags_pp_fabric_comment: savedComposition.big_bags_pp_fabric_comment,
          canisters_barrels: savedComposition.canisters_barrels,
          canisters_barrels_comment: savedComposition.canisters_barrels_comment,
          lightweight_packaging_lwp: savedComposition.lightweight_packaging_lwp,
          lightweight_packaging_lwp_comment: savedComposition.lightweight_packaging_lwp_comment,
          composite_packaging: savedComposition.composite_packaging,
          composite_packaging_comment: savedComposition.composite_packaging_comment,
          pvc_items: savedComposition.pvc_items,
          pvc_items_comment: savedComposition.pvc_items_comment,
          textiles_clothing: savedComposition.textiles_clothing,
          textiles_clothing_comment: savedComposition.textiles_clothing_comment,
          aluminium_shavings_comb: savedComposition.aluminium_shavings_comb,
          aluminium_shavings_comb_comment: savedComposition.aluminium_shavings_comb_comment,
          iron_fe: savedComposition.iron_fe,
          iron_fe_comment: savedComposition.iron_fe_comment,
          copper_cu: savedComposition.copper_cu,
          copper_cu_comment: savedComposition.copper_cu_comment,
          gfrp_cfrp: savedComposition.gfrp_cfrp,
          gfrp_cfrp_comment: savedComposition.gfrp_cfrp_comment,
          rubber_mixed: savedComposition.rubber_mixed,
          rubber_mixed_comment: savedComposition.rubber_mixed_comment,
          sludges_fines: savedComposition.sludges_fines,
          sludges_fines_comment: savedComposition.sludges_fines_comment,
          // Additional fields
          gcp_image_path: savedComposition.gcp_image_path,
          created_at: savedComposition.created_at,
          created_by_uid: savedComposition.created_by_uid
        },
        message: 'Shipment waste composition created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to create shipment waste composition'
      };
    }
  }
}
