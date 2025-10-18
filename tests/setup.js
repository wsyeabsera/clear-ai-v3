"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongoose_1 = __importDefault(require("mongoose"));
let mongoServer;
beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    // Connect to the in-memory database
    await mongoose_1.default.connect(mongoUri);
});
afterAll(async () => {
    // Close database connection
    await mongoose_1.default.connection.close();
    // Stop the in-memory MongoDB instance
    await mongoServer.stop();
});
beforeEach(async () => {
    // Clear all collections before each test
    const collections = mongoose_1.default.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});
//# sourceMappingURL=setup.js.map