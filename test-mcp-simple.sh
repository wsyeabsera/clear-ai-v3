#!/bin/bash

# Simple MCP Server Test Script via GraphQL
# Tests MCP tools using curl requests with proper JSON escaping

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GRAPHQL_URL="http://localhost:4000"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to make GraphQL requests
make_request() {
    local query="$1"
    local test_name="$2"
    local expected_success="${3:-true}"
    
    echo -e "${BLUE}Testing: $test_name${NC}"
    
    local response
    local http_code
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$GRAPHQL_URL" \
        -H "Content-Type: application/json" \
        -d "$query")
    
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | sed '$d')
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$http_code" = "200" ]; then
        # Check if response contains errors
        if echo "$response_body" | jq -e '.errors' > /dev/null 2>&1; then
            if [ "$expected_success" = "false" ]; then
                echo -e "${GREEN}✓ PASS${NC} - Expected error occurred"
                echo -e "${YELLOW}   Error: $(echo "$response_body" | jq -r '.errors[0].message')${NC}"
                PASSED_TESTS=$((PASSED_TESTS + 1))
            else
                echo -e "${RED}✗ FAIL${NC} - Unexpected error:"
                echo "$response_body" | jq '.errors'
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
        else
            if [ "$expected_success" = "true" ]; then
                echo -e "${GREEN}✓ PASS${NC}"
                local data=$(echo "$response_body" | jq '.data' 2>/dev/null)
                if [ "$data" != "null" ] && [ -n "$data" ]; then
                    echo -e "${YELLOW}   Response:${NC}"
                    echo "$data" | jq . 2>/dev/null || echo "$data"
                fi
                PASSED_TESTS=$((PASSED_TESTS + 1))
            else
                echo -e "${RED}✗ FAIL${NC} - Expected error but got success"
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
        fi
    else
        echo -e "${RED}✗ FAIL${NC} - HTTP $http_code"
        echo "$response_body"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo ""
}

# Check if server is running
echo -e "${YELLOW}Checking if Apollo GraphQL server is running...${NC}"
if ! curl -s "$GRAPHQL_URL" > /dev/null; then
    echo -e "${RED}Error: Apollo GraphQL server is not running at $GRAPHQL_URL${NC}"
    echo "Please start it with: npm run dev:client"
    exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}\n"

echo -e "${YELLOW}🚀 Starting MCP Server Tests via GraphQL${NC}\n"

# Test 1: List all tools
make_request '{"query":"query { listTools { name description } }"}' "List all MCP tools"

# Test 2: Client CRUD Operations
echo -e "${YELLOW}=== CLIENT OPERATIONS ===${NC}"

# Create client
CLIENT_RESPONSE=$(curl -s -X POST "$GRAPHQL_URL" \
    -H "Content-Type: application/json" \
    -d '{"query":"mutation { executeTool(name: \"clients_create\", params: {name: \"Test Client for Curl\"}) { success data error message } }"}')
CLIENT_ID=$(echo "$CLIENT_RESPONSE" | jq -r '.data.executeTool.data._id' 2>/dev/null)

make_request '{"query":"mutation { executeTool(name: \"clients_create\", params: {name: \"Test Client for Curl\"}) { success data error message } }"}' "Create client"

if [ -n "$CLIENT_ID" ] && [ "$CLIENT_ID" != "null" ]; then
    make_request "{\"query\":\"mutation { executeTool(name: \\\"clients_get\\\", params: {id: \\\"$CLIENT_ID\\\"}) { success data error message } }\"}" "Get client by ID"
    make_request "{\"query\":\"mutation { executeTool(name: \\\"clients_update\\\", params: {id: \\\"$CLIENT_ID\\\", name: \\\"Updated Test Client\\\"}) { success data error message } }\"}" "Update client"
    make_request '{"query":"mutation { executeTool(name: \"clients_list\", params: {page: 1, limit: 10}) { success data error message } }"}' "List clients"
    make_request "{\"query\":\"mutation { executeTool(name: \\\"clients_delete\\\", params: {id: \\\"$CLIENT_ID\\\"}) { success data error message } }\"}" "Delete client"
else
    echo -e "${RED}Warning: Could not extract client ID, skipping dependent tests${NC}\n"
fi

# Test 3: Facility CRUD Operations
echo -e "${YELLOW}=== FACILITY OPERATIONS ===${NC}"

# Create a client first for facility
CLIENT_RESPONSE=$(curl -s -X POST "$GRAPHQL_URL" \
    -H "Content-Type: application/json" \
    -d '{"query":"mutation { executeTool(name: \"clients_create\", params: {name: \"Facility Test Client\"}) { success data error message } }"}')
CLIENT_ID=$(echo "$CLIENT_RESPONSE" | jq -r '.data.executeTool.data._id' 2>/dev/null)

if [ -n "$CLIENT_ID" ] && [ "$CLIENT_ID" != "null" ]; then
    make_request "{\"query\":\"mutation { executeTool(name: \\\"facilities_create\\\", params: {name: \\\"Test Facility\\\", client_id: \\\"$CLIENT_ID\\\"}) { success data error message } }\"}" "Create facility"
    
    # Get facility ID for further tests
    FACILITY_RESPONSE=$(curl -s -X POST "$GRAPHQL_URL" \
        -H "Content-Type: application/json" \
        -d "{\"query\":\"mutation { executeTool(name: \\\"facilities_create\\\", params: {name: \\\"Test Facility 2\\\", client_id: \\\"$CLIENT_ID\\\"}) { success data error message } }\"}")
    FACILITY_ID=$(echo "$FACILITY_RESPONSE" | jq -r '.data.executeTool.data._id' 2>/dev/null)
    
    if [ -n "$FACILITY_ID" ] && [ "$FACILITY_ID" != "null" ]; then
        make_request "{\"query\":\"mutation { executeTool(name: \\\"facilities_get\\\", params: {id: \\\"$FACILITY_ID\\\"}) { success data error message } }\"}" "Get facility by ID"
        make_request "{\"query\":\"mutation { executeTool(name: \\\"facilities_update\\\", params: {id: \\\"$FACILITY_ID\\\", name: \\\"Updated Test Facility\\\"}) { success data error message } }\"}" "Update facility"
        make_request '{"query":"mutation { executeTool(name: \"facilities_list\", params: {page: 1, limit: 10}) { success data error message } }"}' "List facilities"
        make_request "{\"query\":\"mutation { executeTool(name: \\\"facilities_delete\\\", params: {id: \\\"$FACILITY_ID\\\"}) { success data error message } }\"}" "Delete facility"
    fi
else
    echo -e "${RED}Warning: Could not create client for facility tests${NC}\n"
fi

# Test 4: Shipment CRUD Operations
echo -e "${YELLOW}=== SHIPMENT OPERATIONS ===${NC}"

if [ -n "$CLIENT_ID" ] && [ "$CLIENT_ID" != "null" ]; then
    make_request "{\"query\":\"mutation { executeTool(name: \\\"shipments_create\\\", params: {client_id: \\\"$CLIENT_ID\\\", license_plate: \\\"CURL-123\\\"}) { success data error message } }\"}" "Create shipment"
    
    # Get shipment ID for further tests
    SHIPMENT_RESPONSE=$(curl -s -X POST "$GRAPHQL_URL" \
        -H "Content-Type: application/json" \
        -d "{\"query\":\"mutation { executeTool(name: \\\"shipments_create\\\", params: {client_id: \\\"$CLIENT_ID\\\", license_plate: \\\"CURL-456\\\"}) { success data error message } }\"}")
    SHIPMENT_ID=$(echo "$SHIPMENT_RESPONSE" | jq -r '.data.executeTool.data._id' 2>/dev/null)
    
    if [ -n "$SHIPMENT_ID" ] && [ "$SHIPMENT_ID" != "null" ]; then
        make_request "{\"query\":\"mutation { executeTool(name: \\\"shipments_get\\\", params: {id: \\\"$SHIPMENT_ID\\\"}) { success data error message } }\"}" "Get shipment by ID"
        make_request "{\"query\":\"mutation { executeTool(name: \\\"shipments_update\\\", params: {id: \\\"$SHIPMENT_ID\\\", license_plate: \\\"CURL-789\\\"}) { success data error message } }\"}" "Update shipment"
        make_request '{"query":"mutation { executeTool(name: \"shipments_list\", params: {page: 1, limit: 10}) { success data error message } }"}' "List shipments"
        make_request "{\"query\":\"mutation { executeTool(name: \\\"shipments_delete\\\", params: {id: \\\"$SHIPMENT_ID\\\"}) { success data error message } }\"}" "Delete shipment"
    fi
fi

# Test 5: Bunker CRUD Operations
echo -e "${YELLOW}=== BUNKER OPERATIONS ===${NC}"

if [ -n "$FACILITY_ID" ] && [ "$FACILITY_ID" != "null" ]; then
    make_request "{\"query\":\"mutation { executeTool(name: \\\"bunkers_create\\\", params: {name: \\\"Test Bunker\\\", facility_id: \\\"$FACILITY_ID\\\"}) { success data error message } }\"}" "Create bunker"
    
    # Get bunker ID for further tests
    BUNKER_RESPONSE=$(curl -s -X POST "$GRAPHQL_URL" \
        -H "Content-Type: application/json" \
        -d "{\"query\":\"mutation { executeTool(name: \\\"bunkers_create\\\", params: {name: \\\"Test Bunker 2\\\", facility_id: \\\"$FACILITY_ID\\\"}) { success data error message } }\"}")
    BUNKER_ID=$(echo "$BUNKER_RESPONSE" | jq -r '.data.executeTool.data._id' 2>/dev/null)
    
    if [ -n "$BUNKER_ID" ] && [ "$BUNKER_ID" != "null" ]; then
        make_request "{\"query\":\"mutation { executeTool(name: \\\"bunkers_get\\\", params: {id: \\\"$BUNKER_ID\\\"}) { success data error message } }\"}" "Get bunker by ID"
        make_request "{\"query\":\"mutation { executeTool(name: \\\"bunkers_update\\\", params: {id: \\\"$BUNKER_ID\\\", name: \\\"Updated Test Bunker\\\"}) { success data error message } }\"}" "Update bunker"
        make_request '{"query":"mutation { executeTool(name: \"bunkers_list\", params: {page: 1, limit: 10}) { success data error message } }"}' "List bunkers"
        make_request "{\"query\":\"mutation { executeTool(name: \\\"bunkers_delete\\\", params: {id: \\\"$BUNKER_ID\\\"}) { success data error message } }\"}" "Delete bunker"
    fi
fi

# Test 6: Error Handling
echo -e "${YELLOW}=== ERROR HANDLING TESTS ===${NC}"

make_request "{\"query\":\"mutation { executeTool(name: \\\"clients_get\\\", params: {id: \\\"invalid-id\\\"}) { success data error message } }\"}" "Get client with invalid ID" "false"
make_request '{"query":"mutation { executeTool(name: \"clients_create\", params: {}) { success data error message } }"}' "Create client without required fields" "false"
make_request '{"query":"mutation { executeTool(name: \"nonexistent_tool\", params: {}) { success data error message } }"}' "Call non-existent tool" "false"

# Test 7: Other Entity Types (Quick tests)
echo -e "${YELLOW}=== OTHER ENTITY TYPES ===${NC}"

# Waste Code (no dependencies)
make_request '{"query":"mutation { executeTool(name: \"waste_codes_create\", params: {code: \"TEST-001\", name: \"Test Waste Code\"}) { success data error message } }"}' "Create waste code"

# Contract (requires facility and client)
if [ -n "$FACILITY_ID" ] && [ -n "$CLIENT_ID" ]; then
    make_request "{\"query\":\"mutation { executeTool(name: \\\"contracts_create\\\", params: {facility_id: \\\"$FACILITY_ID\\\", client_id: \\\"$CLIENT_ID\\\"}) { success data error message } }\"}" "Create contract"
fi

# Clean up
echo -e "${YELLOW}=== CLEANUP ===${NC}"
if [ -n "$CLIENT_ID" ] && [ "$CLIENT_ID" != "null" ]; then
    make_request "{\"query\":\"mutation { executeTool(name: \\\"clients_delete\\\", params: {id: \\\"$CLIENT_ID\\\"}) { success data error message } }\"}" "Cleanup: Delete test client"
fi

# Test Summary
echo -e "${YELLOW}=== TEST SUMMARY ===${NC}"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
