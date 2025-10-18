# MCP Server Integration with Cursor

This project includes a Model Context Protocol (MCP) server that provides waste management tools accessible through Cursor IDE.

## Quick Setup

### 1. Prerequisites
- Node.js and npm installed
- MongoDB running locally (or update MONGODB_URI in config)
- TypeScript and ts-node installed globally or locally

### 2. Install Dependencies
```bash
npm install
```

### 3. Build the Project (Optional)
```bash
npm run build
```

### 4. Configure Cursor

Copy the appropriate configuration file to your Cursor settings:

**For Development:**
```bash
cp mcp.json ~/.cursor/mcp.json
```

**For Production:**
```bash
cp mcp-production.json ~/.cursor/mcp.json
```

### 5. Start MongoDB
Make sure MongoDB is running on `mongodb://localhost:27017/waste-management`

### 6. Restart Cursor
Restart Cursor IDE to load the MCP server configuration.

## Available Tools

The MCP server exposes the following tool categories:

### Shipments
- `shipments_create` - Create a new shipment record
- `shipments_get` - Get a shipment by UID
- `shipments_update` - Update a shipment record
- `shipments_delete` - Delete a shipment record
- `shipments_list` - List all shipments

### Facilities
- `facilities_create` - Create a new facility record
- `facilities_get` - Get a facility by UID
- `facilities_update` - Update a facility record
- `facilities_delete` - Delete a facility record
- `facilities_list` - List all facilities

### Contaminants
- `contaminants_create` - Create a new contaminant record
- `contaminants_get` - Get a contaminant by UID
- `contaminants_update` - Update a contaminant record
- `contaminants_delete` - Delete a contaminant record
- `contaminants_list` - List all contaminants

### Inspections
- `inspections_create` - Create a new inspection record
- `inspections_get` - Get an inspection by UID
- `inspections_update` - Update an inspection record
- `inspections_delete` - Delete an inspection record
- `inspections_list` - List all inspections

### Contracts
- `contracts_create` - Create a new contract record
- `contracts_get` - Get a contract by UID
- `contracts_update` - Update a contract record
- `contracts_delete` - Delete a contract record
- `contracts_list` - List all contracts

### Waste Codes
- `waste_codes_create` - Create a new waste code record
- `waste_codes_get` - Get a waste code by UID
- `waste_codes_update` - Update a waste code record
- `waste_codes_delete` - Delete a waste code record
- `waste_codes_list` - List all waste codes

### Waste Generators
- `waste_generators_create` - Create a new waste generator record
- `waste_generators_get` - Get a waste generator by UID
- `waste_generators_update` - Update a waste generator record
- `waste_generators_delete` - Delete a waste generator record
- `waste_generators_list` - List all waste generators

### Shipment Waste Compositions
- `shipment_waste_compositions_create` - Create a new composition record
- `shipment_waste_compositions_get` - Get a composition by UID
- `shipment_waste_compositions_update` - Update a composition record
- `shipment_waste_compositions_delete` - Delete a composition record
- `shipment_waste_compositions_list` - List all compositions

### Waste Properties
- `waste_properties_create` - Create a new waste property record
- `waste_properties_get` - Get a waste property by UID
- `waste_properties_update` - Update a waste property record
- `waste_properties_delete` - Delete a waste property record
- `waste_properties_list` - List all waste properties

## Usage in Cursor

Once configured, you can use these tools directly in Cursor by:

1. Opening a chat with Cursor
2. Asking it to use any of the available tools
3. The AI will automatically call the appropriate MCP tool

Example: "Create a new shipment with UID 'SHIP-001' for client 'CLIENT-123' with license plate 'ABC-123'"

## Troubleshooting

### Server Not Starting
- Check that MongoDB is running
- Verify the MONGODB_URI in the configuration
- Ensure all dependencies are installed

### Tools Not Available
- Restart Cursor after configuration changes
- Check the MCP server logs in Cursor's developer console
- Verify the server is running without errors

### Development
- Use `npm run dev:server` to run the server in development mode
- Use `npm run build` to build the production version
- Check `src/server/index.ts` for server entry point
