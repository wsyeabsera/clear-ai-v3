# Waste Management MCP Server & Client

A complete implementation of Anthropic's Model Context Protocol (MCP) for waste management operations, built with TypeScript, MongoDB, and Apollo GraphQL.

## 🏗️ Architecture

- **MCP Server**: JSON-RPC stdio transport exposing 20 CRUD tools for waste management entities
- **Apollo GraphQL Client**: Dynamic tool executor that can call any MCP tool by name
- **MongoDB**: Persistent storage with Mongoose schemas for Shipments, Facilities, Contaminants, and Inspections
- **Command Pattern**: Clean separation of concerns with command objects for each operation
- **Test-Driven Development**: Comprehensive test coverage with Jest and Supertest

## 📦 Installation

```bash
npm install
```

## 🚀 Quick Start

### 1. Build the Project

```bash
npm run build
```

### 2. Seed the Database

```bash
npm run seed
```

### 3. Start the MCP Server

```bash
npm run start:server
```

### 4. Start the Apollo GraphQL Client (in another terminal)

```bash
npm run start:client
```

The GraphQL Playground will be available at `http://localhost:4000`

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Integration Tests

```bash
npm run test:integration
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

## 🛠️ Available MCP Tools

### Shipments (5 tools)
- `shipments_create` - Create a new shipment
- `shipments_get` - Get shipment by UID
- `shipments_update` - Update shipment details
- `shipments_delete` - Delete a shipment
- `shipments_list` - List shipments with filters

### Facilities (5 tools)
- `facilities_create` - Create a new facility
- `facilities_get` - Get facility by UID
- `facilities_update` - Update facility details
- `facilities_delete` - Delete a facility
- `facilities_list` - List facilities with filters

### Contaminants (5 tools)
- `contaminants_create` - Create a contaminant record
- `contaminants_get` - Get contaminant by UID
- `contaminants_update` - Update contaminant details
- `contaminants_delete` - Delete a contaminant
- `contaminants_list` - List contaminants with filters

### Inspections (5 tools)
- `inspections_create` - Create an inspection record
- `inspections_get` - Get inspection by UID
- `inspections_update` - Update inspection details
- `inspections_delete` - Delete an inspection
- `inspections_list` - List inspections with filters

## 📝 GraphQL Usage Example

### Query Available Tools

```graphql
query {
  listTools {
    name
    description
    inputSchema
  }
}
```

### Execute a Tool

```graphql
mutation {
  executeTool(
    name: "shipments_create"
    params: {
      uid: "ship-001"
      client_uid: "client-001"
      license_plate: "ABC-123"
      entry_weight: 1500
      facility_uid: "facility-001"
      notes: "Test shipment"
    }
  ) {
    success
    data
    error
    message
  }
}
```

### List Shipments

```graphql
mutation {
  executeTool(
    name: "shipments_list"
    params: {
      client_uid: "client-001"
      page: 1
      limit: 10
    }
  ) {
    success
    data
    meta
  }
}
```

## 🗄️ Database Schema

### Shipment
- Entry/exit weights and timestamps
- License plate, gate number
- Facility reference
- Scale overwrite, duplicate check flags

### Facility
- Name, address, location details
- Door count, grid dimensions
- Processing time settings
- Safety rule configurations

### Contaminant
- Material type, estimated size
- Risk levels (HCl, SO2, explosive)
- AI/ML integration (GCP image paths)
- Verification status

### Inspection
- Delivery acceptance/rejection status
- Smell detection (fecal, pungent, solvent)
- Calorific value, moisture levels
- Category values and comments

## 🏗️ Project Structure

```
src/
├── server/
│   ├── index.ts                 # MCP server entry point
│   ├── transport/
│   │   └── StdioTransport.ts    # JSON-RPC stdio transport
│   ├── models/                  # Mongoose schemas
│   ├── commands/                # Command pattern implementation
│   ├── tools/
│   │   └── ToolRegistry.ts      # MCP tool definitions
│   └── database/
│       ├── connection.ts
│       └── seed.ts
├── client/
│   ├── index.ts                 # Apollo GraphQL server
│   ├── MCPClient.ts             # MCP client wrapper
│   ├── DynamicToolExecutor.ts   # Tool execution handler
│   └── schema.graphql           # GraphQL schema
└── types/
    └── mcp.ts                   # MCP protocol types

tests/
├── setup.ts                     # Test configuration
├── server/
│   ├── models/                  # Model tests
│   ├── commands/                # Command tests
│   └── integration/             # Integration tests
```

## 🔧 Development

### Development Mode (with hot reload)

```bash
# Server
npm run dev:server

# Client
npm run dev:client
```

## 📊 Test Coverage

- ✅ 4 MongoDB schemas with relationships
- ✅ 20 CRUD command implementations
- ✅ Command Factory pattern
- ✅ MCP server with JSON-RPC transport
- ✅ Apollo GraphQL client
- ✅ Dynamic tool executor
- ✅ Integration tests
- ✅ Database seeding

## 🤝 Contributing

This project follows Test-Driven Development (TDD) principles. All new features should:
1. Have tests written first
2. Follow the Command Pattern for operations
3. Be properly typed with TypeScript
4. Include integration tests

## 📄 License

ISC
# clear-ai-v3
