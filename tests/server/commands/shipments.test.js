"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Facility_1 = require("../../../src/server/models/Facility");
const Shipment_1 = require("../../../src/server/models/Shipment");
const CreateShipmentCommand_1 = require("../../../src/server/commands/shipments/CreateShipmentCommand");
const GetShipmentCommand_1 = require("../../../src/server/commands/shipments/GetShipmentCommand");
const UpdateShipmentCommand_1 = require("../../../src/server/commands/shipments/UpdateShipmentCommand");
const DeleteShipmentCommand_1 = require("../../../src/server/commands/shipments/DeleteShipmentCommand");
const ListShipmentsCommand_1 = require("../../../src/server/commands/shipments/ListShipmentsCommand");
describe('Shipment Commands', () => {
    let facility;
    beforeEach(async () => {
        // Create a test facility first
        facility = new Facility_1.Facility({
            uid: 'facility-001',
            name: 'Test Facility',
            address: '123 Test St',
            city: 'Test City',
            country: 'Test Country',
            client: new mongoose_1.default.Types.ObjectId(),
        });
        await facility.save();
    });
    describe('CreateShipmentCommand', () => {
        it('should create a shipment with valid data', async () => {
            const command = new CreateShipmentCommand_1.CreateShipmentCommand();
            const params = {
                uid: 'shipment-001',
                client_uid: 'client-001',
                license_plate: 'ABC-123',
                entry_weight: 1500.5,
                exit_weight: 1500.5,
                facility_uid: facility.uid,
                notes: 'Test shipment',
            };
            const result = await command.execute(params);
            expect(result.success).toBe(true);
            expect(result.data.uid).toBe('shipment-001');
            expect(result.data.license_plate).toBe('ABC-123');
            expect(result.data.entry_weight).toBe(1500.5);
        });
        it('should fail with missing required fields', async () => {
            const command = new CreateShipmentCommand_1.CreateShipmentCommand();
            const params = {
                uid: 'shipment-001',
                // Missing client_uid and license_plate
            };
            const result = await command.execute(params);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });
    describe('GetShipmentCommand', () => {
        let shipment;
        beforeEach(async () => {
            shipment = new Shipment_1.Shipment({
                uid: 'shipment-001',
                client_uid: 'client-001',
                license_plate: 'ABC-123',
                facility: facility._id,
            });
            await shipment.save();
        });
        it('should get a shipment by uid', async () => {
            const command = new GetShipmentCommand_1.GetShipmentCommand();
            const params = { uid: 'shipment-001' };
            const result = await command.execute(params);
            expect(result.success).toBe(true);
            expect(result.data.uid).toBe('shipment-001');
            expect(result.data.license_plate).toBe('ABC-123');
        });
        it('should return error for non-existent shipment', async () => {
            const command = new GetShipmentCommand_1.GetShipmentCommand();
            const params = { uid: 'non-existent' };
            const result = await command.execute(params);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });
    describe('UpdateShipmentCommand', () => {
        let shipment;
        beforeEach(async () => {
            shipment = new Shipment_1.Shipment({
                uid: 'shipment-001',
                client_uid: 'client-001',
                license_plate: 'ABC-123',
                facility: facility._id,
            });
            await shipment.save();
        });
        it('should update a shipment', async () => {
            const command = new UpdateShipmentCommand_1.UpdateShipmentCommand();
            const params = {
                uid: 'shipment-001',
                notes: 'Updated notes',
                entry_weight: 2000,
            };
            const result = await command.execute(params);
            expect(result.success).toBe(true);
            expect(result.data.notes).toBe('Updated notes');
            expect(result.data.entry_weight).toBe(2000);
        });
    });
    describe('DeleteShipmentCommand', () => {
        let shipment;
        beforeEach(async () => {
            shipment = new Shipment_1.Shipment({
                uid: 'shipment-001',
                client_uid: 'client-001',
                license_plate: 'ABC-123',
                facility: facility._id,
            });
            await shipment.save();
        });
        it('should delete a shipment', async () => {
            const command = new DeleteShipmentCommand_1.DeleteShipmentCommand();
            const params = { uid: 'shipment-001' };
            const result = await command.execute(params);
            expect(result.success).toBe(true);
            expect(result.message).toContain('deleted');
            // Verify it's deleted
            const deletedShipment = await Shipment_1.Shipment.findOne({ uid: 'shipment-001' });
            expect(deletedShipment).toBeNull();
        });
    });
    describe('ListShipmentsCommand', () => {
        beforeEach(async () => {
            // Create multiple shipments
            const shipments = [
                {
                    uid: 'shipment-001',
                    client_uid: 'client-001',
                    license_plate: 'ABC-123',
                    facility: facility._id,
                },
                {
                    uid: 'shipment-002',
                    client_uid: 'client-001',
                    license_plate: 'DEF-456',
                    facility: facility._id,
                },
            ];
            for (const shipmentData of shipments) {
                const shipment = new Shipment_1.Shipment(shipmentData);
                await shipment.save();
            }
        });
        it('should list all shipments', async () => {
            const command = new ListShipmentsCommand_1.ListShipmentsCommand();
            const params = {};
            const result = await command.execute(params);
            expect(result.success).toBe(true);
            expect(result.data.length).toBe(2);
            expect(result.data[0].uid).toBeDefined();
            expect(result.data[1].uid).toBeDefined();
        });
        it('should filter shipments by client_uid', async () => {
            const command = new ListShipmentsCommand_1.ListShipmentsCommand();
            const params = { client_uid: 'client-001' };
            const result = await command.execute(params);
            expect(result.success).toBe(true);
            expect(result.data.length).toBe(2);
        });
    });
});
//# sourceMappingURL=shipments.test.js.map