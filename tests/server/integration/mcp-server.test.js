"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MCPClient_1 = require("../../../src/client/MCPClient");
const DynamicToolExecutor_1 = require("../../../src/client/DynamicToolExecutor");
const connection_1 = require("../../../src/server/database/connection");
const Facility_1 = require("../../../src/server/models/Facility");
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
describe('MCP Server Integration Tests', () => {
    let mcpClient;
    let executor;
    let facility;
    beforeAll(async () => {
        // Connect to test database
        await (0, connection_1.connectToDatabase)();
        // Create a test facility
        facility = new Facility_1.Facility({
            uid: 'test-facility-001',
            name: 'Test Integration Facility',
            client: new mongoose_1.default.Types.ObjectId(),
        });
        await facility.save();
        // Build the server first
        const { execSync } = require('child_process');
        execSync('npm run build', { stdio: 'inherit' });
        // Connect MCP client to server
        mcpClient = new MCPClient_1.MCPClient();
        const serverPath = path_1.default.join(__dirname, '../../../dist/src/server/index.js');
        await mcpClient.connect(serverPath);
        executor = new DynamicToolExecutor_1.DynamicToolExecutor(mcpClient);
    });
    afterAll(async () => {
        await mcpClient.disconnect();
        await (0, connection_1.disconnectFromDatabase)();
    });
    describe('Tool Listing', () => {
        it('should list all available tools', async () => {
            const tools = await executor.listAvailableTools();
            expect(Array.isArray(tools)).toBe(true);
            expect(tools.length).toBeGreaterThan(0);
            // Check for expected tools
            const toolNames = tools.map((t) => t.name);
            expect(toolNames).toContain('shipments_create');
            expect(toolNames).toContain('facilities_list');
            expect(toolNames).toContain('contaminants_get');
            expect(toolNames).toContain('inspections_update');
        });
    });
    describe('Shipment Operations', () => {
        it('should create a shipment via MCP', async () => {
            const result = await executor.executeTool('shipments_create', {
                uid: 'integration-shipment-001',
                client_uid: 'client-001',
                license_plate: 'TEST-123',
                entry_weight: 1500,
                facility_uid: facility.uid,
                notes: 'Integration test shipment',
            });
            expect(result.success).toBe(true);
            expect(result.data.uid).toBe('integration-shipment-001');
            expect(result.data.license_plate).toBe('TEST-123');
        });
        it('should get a shipment via MCP', async () => {
            const result = await executor.executeTool('shipments_get', {
                uid: 'integration-shipment-001',
            });
            expect(result.success).toBe(true);
            expect(result.data.uid).toBe('integration-shipment-001');
        });
        it('should list shipments via MCP', async () => {
            const result = await executor.executeTool('shipments_list', {
                client_uid: 'client-001',
            });
            expect(result.success).toBe(true);
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data.length).toBeGreaterThan(0);
        });
    });
    describe('Facility Operations', () => {
        it('should create a facility via MCP', async () => {
            const result = await executor.executeTool('facilities_create', {
                uid: 'integration-facility-001',
                name: 'Integration Test Facility',
                client_uid: new mongoose_1.default.Types.ObjectId().toString(),
                city: 'Test City',
                country: 'Test Country',
            });
            expect(result.success).toBe(true);
            expect(result.data.uid).toBe('integration-facility-001');
            expect(result.data.name).toBe('Integration Test Facility');
        });
        it('should list facilities via MCP', async () => {
            const result = await executor.executeTool('facilities_list', {
                city: 'Test City',
            });
            expect(result.success).toBe(true);
            expect(Array.isArray(result.data)).toBe(true);
        });
    });
    describe('Error Handling', () => {
        it('should handle missing required fields', async () => {
            const result = await executor.executeTool('shipments_create', {
                uid: 'incomplete-shipment',
                // Missing client_uid and license_plate
            });
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
        it('should handle non-existent tool', async () => {
            const result = await executor.executeTool('non_existent_tool', {});
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });
}, 60000); // 60 second timeout for integration tests
//# sourceMappingURL=mcp-server.test.js.map