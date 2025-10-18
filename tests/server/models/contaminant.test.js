"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Contaminant_1 = require("../../../src/server/models/Contaminant");
const Facility_1 = require("../../../src/server/models/Facility");
const Shipment_1 = require("../../../src/server/models/Shipment");
describe('Contaminant Model', () => {
    let facility;
    let shipment;
    beforeEach(async () => {
        // Create test facility
        facility = new Facility_1.Facility({
            uid: 'facility-001',
            name: 'Test Facility',
            client: new mongoose_1.default.Types.ObjectId(),
        });
        await facility.save();
        // Create test shipment
        shipment = new Shipment_1.Shipment({
            uid: 'shipment-001',
            client_uid: 'client-001',
            license_plate: 'ABC-123',
            facility: facility._id,
        });
        await shipment.save();
    });
    it('should create a contaminant with valid data', async () => {
        const contaminantData = {
            uid: 'contaminant-001',
            is_verified: true,
            is_correct: true,
            notes: 'Plastic contamination detected',
            local_notes: 'Local notes about contamination',
            analysis_notes: 'Detailed analysis results',
            gcp_image_path: '/images/contaminant-001.jpg',
            gcp_highlight_path: '/images/contaminant-001-highlight.jpg',
            waste_item_uid: 'waste-item-001',
            friendly_name: 'Plastic Bottle',
            local_friendly_name: 'Local Plastic Bottle',
            estimated_size: 50,
            material: 'Plastic',
            local_material: 'Local Plastic',
            gate_number: '1',
            entry_timestamp: new Date('2025-01-18T10:00:00Z'),
            license_plate: 'ABC-123',
            captured_datetime: new Date('2025-01-18T10:05:00Z'),
            client: new mongoose_1.default.Types.ObjectId(),
            facility: facility._id,
            shipment: shipment._id,
        };
        const contaminant = new Contaminant_1.Contaminant(contaminantData);
        const savedContaminant = await contaminant.save();
        expect(savedContaminant.uid).toBe('contaminant-001');
        expect(savedContaminant.is_verified).toBe(true);
        expect(savedContaminant.is_correct).toBe(true);
        expect(savedContaminant.notes).toBe('Plastic contamination detected');
        expect(savedContaminant.facility.toString()).toBe(facility._id.toString());
        expect(savedContaminant.shipment.toString()).toBe(shipment._id.toString());
    });
    it('should require uid field', async () => {
        const contaminantData = {
            client: new mongoose_1.default.Types.ObjectId(),
            facility: facility._id,
            shipment: shipment._id,
        };
        const contaminant = new Contaminant_1.Contaminant(contaminantData);
        await expect(contaminant.save()).rejects.toThrow();
    });
    it('should require client field', async () => {
        const contaminantData = {
            uid: 'contaminant-001',
            facility: facility._id,
            shipment: shipment._id,
        };
        const contaminant = new Contaminant_1.Contaminant(contaminantData);
        await expect(contaminant.save()).rejects.toThrow();
    });
    it('should require facility field', async () => {
        const contaminantData = {
            uid: 'contaminant-001',
            client: new mongoose_1.default.Types.ObjectId(),
            shipment: shipment._id,
        };
        const contaminant = new Contaminant_1.Contaminant(contaminantData);
        await expect(contaminant.save()).rejects.toThrow();
    });
    it('should require shipment field', async () => {
        const contaminantData = {
            uid: 'contaminant-001',
            client: new mongoose_1.default.Types.ObjectId(),
            facility: facility._id,
        };
        const contaminant = new Contaminant_1.Contaminant(contaminantData);
        await expect(contaminant.save()).rejects.toThrow();
    });
    it('should populate facility and shipment references', async () => {
        const contaminantData = {
            uid: 'contaminant-001',
            client: new mongoose_1.default.Types.ObjectId(),
            facility: facility._id,
            shipment: shipment._id,
        };
        const contaminant = new Contaminant_1.Contaminant(contaminantData);
        await contaminant.save();
        const populatedContaminant = await Contaminant_1.Contaminant.findById(contaminant._id)
            .populate('facility')
            .populate('shipment');
        expect(populatedContaminant?.facility).toBeDefined();
        expect((populatedContaminant?.facility).name).toBe('Test Facility');
        expect(populatedContaminant?.shipment).toBeDefined();
        expect((populatedContaminant?.shipment).uid).toBe('shipment-001');
    });
});
//# sourceMappingURL=contaminant.test.js.map