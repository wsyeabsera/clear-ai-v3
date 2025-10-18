# MCP Server Testing Guide

This document explains how to test the MCP (Model Context Protocol) server using the Apollo GraphQL client and curl requests.

## Overview

The MCP server is wrapped by an Apollo GraphQL server that exposes all 55 MCP tools via a GraphQL API. This allows you to test the MCP server functionality using standard HTTP requests with curl.

## Prerequisites

1. **MongoDB running**: The MCP server requires a MongoDB connection
2. **Node.js dependencies installed**: Run `npm install`
3. **Server built**: Run `npm run build` (optional, but recommended)

## Quick Start

### 1. Start the Apollo GraphQL Server

```bash
npm run dev:client
```

This will:
- Start the MCP server via stdio transport
- Start the Apollo GraphQL server on port 4000
- Expose the GraphQL endpoint at `http://localhost:4000`

### 2. Run Tests

#### Basic Test Suite
```bash
./test-mcp-curl.sh
```

#### Interactive Test Suite (with ID tracking)
```bash
./test-mcp-interactive.sh
```

## Available MCP Tools

The server exposes 55 tools across 11 entity types:

### Core Entities
- **Clients** (5 tools): create, get, update, delete, list
- **Facilities** (5 tools): create, get, update, delete, list
- **Bunkers** (5 tools): create, get, update, delete, list
- **Shipments** (5 tools): create, get, update, delete, list

### Waste Management Entities
- **Contaminants** (5 tools): create, get, update, delete, list
- **Inspections** (5 tools): create, get, update, delete, list
- **Contracts** (5 tools): create, get, update, delete, list
- **Waste Codes** (5 tools): create, get, update, delete, list
- **Waste Generators** (5 tools): create, get, update, delete, list
- **Shipment Waste Compositions** (5 tools): create, get, update, delete, list
- **Waste Properties** (5 tools): create, get, update, delete, list

## Manual Testing with Curl

### List All Available Tools

```bash
curl -X POST http://localhost:4000 \
  -H "Content-Type: application/json" \
  -d '{"query":"query { listTools { name description } }"}' | jq .
```

### Create a Client

```bash
curl -X POST http://localhost:4000 \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { executeTool(name: \"clients_create\", params: {name: \"Test Client\"}) }"}' | jq .
```

### Get a Client by ID

```bash
# Replace CLIENT_ID with actual ID from create response
curl -X POST http://localhost:4000 \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { executeTool(name: \"clients_get\", params: {id: \"CLIENT_ID\"}) }"}' | jq .
```

### Update a Client

```bash
curl -X POST http://localhost:4000 \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { executeTool(name: \"clients_update\", params: {id: \"CLIENT_ID\", name: \"Updated Name\"}) }"}' | jq .
```

### List Clients

```bash
curl -X POST http://localhost:4000 \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { executeTool(name: \"clients_list\", params: {page: 1, limit: 10}) }"}' | jq .
```

### Delete a Client

```bash
curl -X POST http://localhost:4000 \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { executeTool(name: \"clients_delete\", params: {id: \"CLIENT_ID\"}) }"}' | jq .
```

## Complex Workflow Example

Here's a complete workflow that creates related entities:

```bash
# 1. Create a client
CLIENT_RESPONSE=$(curl -s -X POST http://localhost:4000 \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { executeTool(name: \"clients_create\", params: {name: \"Workflow Client\"}) }"}')

CLIENT_ID=$(echo "$CLIENT_RESPONSE" | jq -r '.data.executeTool.data._id')

# 2. Create a facility for the client
curl -X POST http://localhost:4000 \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"mutation { executeTool(name: \\\"facilities_create\\\", params: {name: \\\"Workflow Facility\\\", client_id: \\\"$CLIENT_ID\\\"}) }\"}" | jq .

# 3. Create a shipment for the client
curl -X POST http://localhost:4000 \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"mutation { executeTool(name: \\\"shipments_create\\\", params: {client_id: \\\"$CLIENT_ID\\\", license_plate: \\\"WORK-001\\\"}) }\"}" | jq .

# 4. Clean up
curl -X POST http://localhost:4000 \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"mutation { executeTool(name: \\\"clients_delete\\\", params: {id: \\\"$CLIENT_ID\\\"}) }\"}" | jq .
```

## Test Scripts

### test-mcp-curl.sh

A comprehensive test script that:
- Tests all major CRUD operations
- Tests error handling
- Tests relationships between entities
- Provides colored output and test summaries
- Cleans up test data

**Usage:**
```bash
./test-mcp-curl.sh
```

### test-mcp-interactive.sh

An interactive test script that:
- Tracks IDs across operations
- Tests complete workflows
- Shows stored IDs after each operation
- Provides detailed formatted output
- Tests complex multi-entity workflows

**Usage:**
```bash
./test-mcp-interactive.sh
```

## Error Handling

The GraphQL API returns errors in the following format:

```json
{
  "data": null,
  "errors": [
    {
      "message": "Error description",
      "locations": [{"line": 1, "column": 1}],
      "path": ["executeTool"]
    }
  ]
}
```

Common errors:
- **Invalid ID**: When trying to get/update/delete with non-existent ID
- **Missing required fields**: When creating entities without required parameters
- **Invalid relationships**: When referencing non-existent related entities
- **Tool not found**: When calling non-existent MCP tools

## Troubleshooting

### Server Not Starting

1. Check if MongoDB is running
2. Verify all dependencies are installed: `npm install`
3. Check for port conflicts (default port 4000)
4. Look at server logs for specific error messages

### Tests Failing

1. Ensure the Apollo server is running before running tests
2. Check that MongoDB is accessible
3. Verify the GraphQL endpoint is responding: `curl http://localhost:4000`
4. Check test script permissions: `chmod +x test-*.sh`

### Database Issues

1. Clear test data: Connect to MongoDB and drop the test database
2. Check MongoDB connection string in environment variables
3. Verify MongoDB indexes are properly set up

## GraphQL Playground

Once the server is running, you can access the GraphQL Playground at:
http://localhost:4000

This provides an interactive interface to test queries and mutations.

## Environment Variables

- `MONGODB_URI`: MongoDB connection string (default: `mongodb://localhost:27017/waste-management`)
- `NODE_ENV`: Environment mode (`development` or `production`)

## Performance Testing

For load testing, you can use tools like `ab` (Apache Bench) or `wrk`:

```bash
# Test tool listing performance
ab -n 100 -c 10 -p - -T application/json http://localhost:4000 < <(echo '{"query":"query { listTools { name } }"}')

# Test client creation performance
ab -n 50 -c 5 -p - -T application/json http://localhost:4000 < <(echo '{"query":"mutation { executeTool(name: \"clients_create\", params: {name: \"Load Test\"}) }"}')
```

## Monitoring

Monitor the server logs for:
- Connection issues
- Performance bottlenecks
- Error patterns
- Memory usage

The Apollo server provides built-in metrics and health checks that can be accessed via the GraphQL endpoint.
