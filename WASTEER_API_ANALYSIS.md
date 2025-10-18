# Wasteer API Analysis Summary

## Core Entities Available

Based on the OpenAPI specification analysis, here are the main entities with CRUD operations:

### 1. **Shipments** (Core Entity)
- **Fields**: 
  - `uid`, `client_uid`, `license_plate`, `entry_timestamp`, `entry_weight`, `exit_timestamp`, `exit_weight`
  - `external_reference_id`, `gate_number`, `shipment_datetime`, `notes`, `source`
  - `scale_overwrite`, `is_duplicate_check_applied`, `merged_to_shipment_uid`
  - `facility` (object ref), `contract` (object ref)
  - Standard audit fields: `created_at`, `created_by_uid`, `updated_at`, `updated_by_uid`, `deleted_at`, `deleted_by_uid`, `migration_id`
- **Endpoints**: 
  - `GET/POST /api/v1/facilities/shipments/` (List/Create)
  - `GET/PUT/DELETE /api/v1/facilities/shipments/{shipment_uid}/` (Read/Update/Delete)
- **Relationships**: Links to Facilities, Contracts, Inspections, Contaminants

### 2. **Facilities** (Core Entity)  
- **Fields**:
  - `uid`, `name`, `address`, `city`, `country`, `region`, `postal_code`, `zip_code`, `street_address`
  - `email`, `phone`, `telephone`, `language`, `sort_code`
  - `door_count`, `number_of_doors`, `grid_width`, `grid_depth`
  - `disposal_number`, `address_notes`, `notes`, `external_reference_id`
  - Processing time settings: `photo_bunkers_processing_time`, `photo_doors_processing_time`, `photo_loads_processing_time`
  - Rules: `rules_explosive_risk_check`, `rules_item_size_limit`, `rules_singular_delivery_check`, `rules_waste_item_rule_check`, `rules_waste_item_size_check`
  - `client` (object ref)
  - Standard audit fields
- **Endpoints**: 
  - `GET/PUT/DELETE /api/v1/clients/facilities/{facility_uid}/`
- **Relationships**: Parent of Shipments, Inspections, Contaminants

### 3. **Contaminants** (Core Entity)
- **Fields**:
  - `uid`, `is_verified`, `is_correct`, `reason` (object), `notes`, `local_notes`, `analysis_notes`
  - `gcp_image_path`, `gcp_highlight_path`, `waste_item_uid`
  - `friendly_name`, `local_friendly_name`, `estimated_size`, `material`, `local_material`
  - Risk levels: `hydrochloric_acid_risk_level`, `sulfur_dioxide_risk_level`, `explosive_risk_level`
  - `gate_number`, `entry_timestamp`, `license_plate`, `captured_datetime`
  - Original values: `original_reason`, `original_notes`, `original_waste_item_uid`, etc.
  - `client` (object ref), `facility` (object ref), `shipment` (object ref)
  - `contaminant_user_favorites` (array)
  - Standard audit fields
- **Endpoints**:
  - `GET/POST /api/v1/facilities/contaminants/` (List/Create)
  - `GET/PUT/DELETE /api/v1/facilities/contaminants/{contaminant_uid}/` (Read/Update/Delete)
- **Relationships**: Links to Shipments, Facilities, Waste Items

### 4. **Inspections** (Core Entity)
- **Fields**:
  - `uid`, `client_uid`, `additional_categories`, `akb_reasons`, `calorific_value`
  - `category_values`, `comments`, `consistency`, `custom_datetime`
  - `delivery_accepted`, `delivery_matches_conditions`, `delivery_rejected`
  - `edge_length`, `external_reference_id`, `fecal_smell`, `incorrectly_declared`
  - `license_plate`, `moisture`, `partial_unloading`, `pungent_smell`, `salvage`
  - `sample_incineration`, `solvent_like_smell`
  - `facility` (object ref), `shipment` (object ref)
  - Standard audit fields
- **Endpoints**:
  - `GET/POST /api/v1/shipments/inspections/` (List/Create)
  - `GET/PUT/DELETE /api/v1/shipments/inspections/{inspection_uid}/` (Read/Update/Delete)
- **Relationships**: Links to Shipments, Facilities

### 5. **Waste Compositions** (Extended Entity)
- **Fields**: Detailed waste analysis including moisture_level, dust_load_level, calorific_value, biogenic_content, sulfur_dioxide_risk, hydrochloric_acid_risk, and 50+ waste material percentages (concrete_stones, glass, wood, plastics, metals, etc.)
- **Operations**: Create, Read, Update, Delete, List
- **Relationships**: Links to Shipments, Facilities, Bunkers

### 6. **Bunkers** (Extended Entity)
- **Fields**: bunker_uid, facility_uid, name, capacity, current_load, waste_type, status
- **Operations**: Create, Read, Update, Delete, List
- **Relationships**: Links to Facilities, Waste Compositions

### 7. **Carriers** (Supporting Entity)
- **Fields**: carrier_uid, name, contact_info, license_plate, risky_tags[]
- **Operations**: Create, Read, Update, Delete, List
- **Relationships**: Links to Shipments

### 8. **Waste Generators** (Supporting Entity)
- **Fields**: waste_generator_uid, name, address, contact_info, waste_types[]
- **Operations**: Create, Read, Update, Delete, List
- **Relationships**: Links to Shipments

### 9. **Analytics/Reports** (Derived Data)
- **Types**: Contamination rates, facility performance, waste distribution, risk trends
- **Operations**: Read-only queries with filtering and aggregation

## Recommended Implementation Phases

### Phase 1 (Core CRUD - Start Here)
1. **Shipments** - Central entity, most important for AI operations
2. **Facilities** - Core business entity, needed for shipments
3. **Contaminants** - Key for AI analysis and risk assessment
4. **Inspections** - Important for compliance and quality control

### Phase 2 (Extended Features)
5. **Waste Compositions** - Detailed analysis data
6. **Bunkers** - Facility storage management
7. **Carriers** - Transportation management
8. **Waste Generators** - Source tracking

### Phase 3 (Analytics & Reporting)
9. **Analytics Tools** - Contamination rates, performance metrics, trend analysis

## Field Types & Enums Found

- **Status Enums**: pending, in_transit, delivered, rejected, accepted
- **Risk Levels**: low, medium, high, critical
- **Severity Levels**: low, medium, high
- **Waste Types**: plastic, metal, paper, industrial, organic, etc.
- **Inspection Types**: arrival, processing, departure, random
- **Facility Types**: sorting, processing, disposal

## Next Steps

Please select which entities you'd like to implement in Phase 1. I recommend starting with the Core CRUD entities (Shipments, Facilities, Contaminants, Inspections) as they form the foundation of the waste management system.
