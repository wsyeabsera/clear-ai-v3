#!/bin/bash

# Interactive MCP Server Test Script via GraphQL
# Tests complete workflows with ID tracking and formatted output

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
GRAPHQL_URL="http://localhost:4000"
TIMEOUT=10

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Storage for IDs
CLIENT_ID=""
FACILITY_ID=""
SHIPMENT_ID=""
BUNKER_ID=""
WASTE_CODE_ID=""
CONTRACT_ID=""

# Function to make GraphQL requests with better formatting
make_request() {
    local query="$1"
    local test_name="$2"
    local expected_success="${3:-true}"
    local store_id="${4:-false}"
    local id_key="${5:-_id}"
    
    echo -e "${BLUE}🔍 Testing: $test_name${NC}"
    
    local response
    local http_code
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$GRAPHQL_URL" \
        -H "Content-Type: application/json" \
        -d "{\"query\":\"$query\"}" \
        --max-time $TIMEOUT)
    
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | sed '$d')
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$http_code" = "200" ]; then
        # Check if response contains errors
        if echo "$response_body" | jq -e '.errors' > /dev/null 2>&1; then
            if [ "$expected_success" = "false" ]; then
                echo -e "${GREEN}✅ PASS${NC} - Expected error occurred"
                echo -e "${CYAN}   Error: $(echo "$response_body" | jq -r '.errors[0].message')${NC}"
                PASSED_TESTS=$((PASSED_TESTS + 1))
            else
                echo -e "${RED}❌ FAIL${NC} - Unexpected error:"
                echo "$response_body" | jq '.errors'
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
        else
            if [ "$expected_success" = "true" ]; then
                echo -e "${GREEN}✅ PASS${NC}"
                
                # Pretty print the data
                local data=$(echo "$response_body" | jq '.data.executeTool.data' 2>/dev/null)
                if [ "$data" != "null" ] && [ -n "$data" ]; then
                    echo -e "${CYAN}   Data:${NC}"
                    echo "$data" | jq . 2>/dev/null || echo "$data"
                    
                    # Store ID if requested
                    if [ "$store_id" = "true" ]; then
                        local id=$(echo "$data" | jq -r ".$id_key" 2>/dev/null)
                        if [ -n "$id" ] && [ "$id" != "null" ]; then
                            case "$test_name" in
                                *"client"*|*"Client"*)
                                    CLIENT_ID="$id"
                                    echo -e "${PURPLE}   📝 Stored Client ID: $CLIENT_ID${NC}"
                                    ;;
                                *"facility"*|*"Facility"*)
                                    FACILITY_ID="$id"
                                    echo -e "${PURPLE}   📝 Stored Facility ID: $FACILITY_ID${NC}"
                                    ;;
                                *"shipment"*|*"Shipment"*)
                                    SHIPMENT_ID="$id"
                                    echo -e "${PURPLE}   📝 Stored Shipment ID: $SHIPMENT_ID${NC}"
                                    ;;
                                *"bunker"*|*"Bunker"*)
                                    BUNKER_ID="$id"
                                    echo -e "${PURPLE}   📝 Stored Bunker ID: $BUNKER_ID${NC}"
                                    ;;
                                *"waste_code"*|*"Waste Code"*)
                                    WASTE_CODE_ID="$id"
                                    echo -e "${PURPLE}   📝 Stored Waste Code ID: $WASTE_CODE_ID${NC}"
                                    ;;
                                *"contract"*|*"Contract"*)
                                    CONTRACT_ID="$id"
                                    echo -e "${PURPLE}   📝 Stored Contract ID: $CONTRACT_ID${NC}"
                                    ;;
                            esac
                        fi
                    fi
                else
                    local result=$(echo "$response_body" | jq '.data.executeTool' 2>/dev/null)
                    if [ "$result" != "null" ] && [ -n "$result" ]; then
                        echo -e "${CYAN}   Result:${NC}"
                        echo "$result" | jq . 2>/dev/null || echo "$result"
                    fi
                fi
                PASSED_TESTS=$((PASSED_TESTS + 1))
            else
                echo -e "${RED}❌ FAIL${NC} - Expected error but got success"
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
        fi
    else
        echo -e "${RED}❌ FAIL${NC} - HTTP $http_code"
        echo "$response_body"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo ""
}

# Function to show current stored IDs
show_stored_ids() {
    echo -e "${YELLOW}📋 Currently Stored IDs:${NC}"
    [ -n "$CLIENT_ID" ] && echo -e "   Client: $CLIENT_ID"
    [ -n "$FACILITY_ID" ] && echo -e "   Facility: $FACILITY_ID"
    [ -n "$SHIPMENT_ID" ] && echo -e "   Shipment: $SHIPMENT_ID"
    [ -n "$BUNKER_ID" ] && echo -e "   Bunker: $BUNKER_ID"
    [ -n "$WASTE_CODE_ID" ] && echo -e "   Waste Code: $WASTE_CODE_ID"
    [ -n "$CONTRACT_ID" ] && echo -e "   Contract: $CONTRACT_ID"
    echo ""
}

# Check if server is running
echo -e "${YELLOW}🔌 Checking if Apollo GraphQL server is running...${NC}"
if ! curl -s "$GRAPHQL_URL" > /dev/null; then
    echo -e "${RED}❌ Error: Apollo GraphQL server is not running at $GRAPHQL_URL${NC}"
    echo "Please start it with: npm run dev:client"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}\n"

echo -e "${YELLOW}🚀 Starting Interactive MCP Server Tests via GraphQL${NC}\n"

# Test 1: List all tools
echo -e "${PURPLE}=== TOOL DISCOVERY ===${NC}"
make_request "query { listTools { name description } }" "List all MCP tools"

# Test 2: Complete Client Workflow
echo -e "${PURPLE}=== CLIENT WORKFLOW ===${NC}"
make_request "mutation { executeTool(name: \"clients_create\", params: {name: \"Interactive Test Client\"}) }" "Create client" "true" "true"
show_stored_ids

if [ -n "$CLIENT_ID" ]; then
    make_request "mutation { executeTool(name: \"clients_get\", params: {id: \"$CLIENT_ID\"}) }" "Get client by ID"
    make_request "mutation { executeTool(name: \"clients_update\", params: {id: \"$CLIENT_ID\", name: \"Updated Interactive Client\"}) }" "Update client"
    make_request "mutation { executeTool(name: \"clients_list\", params: {page: 1, limit: 5}) }" "List clients"
fi

# Test 3: Complete Facility Workflow
echo -e "${PURPLE}=== FACILITY WORKFLOW ===${NC}"
if [ -n "$CLIENT_ID" ]; then
    make_request "mutation { executeTool(name: \"facilities_create\", params: {name: \"Interactive Test Facility\", client_id: \"$CLIENT_ID\"}) }" "Create facility" "true" "true"
    show_stored_ids
    
    if [ -n "$FACILITY_ID" ]; then
        make_request "mutation { executeTool(name: \"facilities_get\", params: {id: \"$FACILITY_ID\"}) }" "Get facility by ID"
        make_request "mutation { executeTool(name: \"facilities_update\", params: {id: \"$FACILITY_ID\", name: \"Updated Interactive Facility\"}) }" "Update facility"
        make_request "mutation { executeTool(name: \"facilities_list\", params: {page: 1, limit: 5}) }" "List facilities"
    fi
else
    echo -e "${RED}⚠️  Skipping facility tests - no client ID available${NC}\n"
fi

# Test 4: Complete Bunker Workflow
echo -e "${PURPLE}=== BUNKER WORKFLOW ===${NC}"
if [ -n "$FACILITY_ID" ]; then
    make_request "mutation { executeTool(name: \"bunkers_create\", params: {name: \"Interactive Test Bunker\", facility_id: \"$FACILITY_ID\"}) }" "Create bunker" "true" "true"
    show_stored_ids
    
    if [ -n "$BUNKER_ID" ]; then
        make_request "mutation { executeTool(name: \"bunkers_get\", params: {id: \"$BUNKER_ID\"}) }" "Get bunker by ID"
        make_request "mutation { executeTool(name: \"bunkers_update\", params: {id: \"$BUNKER_ID\", name: \"Updated Interactive Bunker\"}) }" "Update bunker"
        make_request "mutation { executeTool(name: \"bunkers_list\", params: {page: 1, limit: 5}) }" "List bunkers"
    fi
else
    echo -e "${RED}⚠️  Skipping bunker tests - no facility ID available${NC}\n"
fi

# Test 5: Complete Shipment Workflow
echo -e "${PURPLE}=== SHIPMENT WORKFLOW ===${NC}"
if [ -n "$CLIENT_ID" ]; then
    make_request "mutation { executeTool(name: \"shipments_create\", params: {client_id: \"$CLIENT_ID\", license_plate: \"INTERACTIVE-001\"}) }" "Create shipment" "true" "true"
    show_stored_ids
    
    if [ -n "$SHIPMENT_ID" ]; then
        make_request "mutation { executeTool(name: \"shipments_get\", params: {id: \"$SHIPMENT_ID\"}) }" "Get shipment by ID"
        make_request "mutation { executeTool(name: \"shipments_update\", params: {id: \"$SHIPMENT_ID\", license_plate: \"INTERACTIVE-002\"}) }" "Update shipment"
        make_request "mutation { executeTool(name: \"shipments_list\", params: {page: 1, limit: 5}) }" "List shipments"
    fi
else
    echo -e "${RED}⚠️  Skipping shipment tests - no client ID available${NC}\n"
fi

# Test 6: Waste Code Workflow (no dependencies)
echo -e "${PURPLE}=== WASTE CODE WORKFLOW ===${NC}"
make_request "mutation { executeTool(name: \"waste_codes_create\", params: {code: \"INT-001\", name: \"Interactive Test Waste Code\", description: \"Test waste code for interactive testing\"}) }" "Create waste code" "true" "true"
show_stored_ids

if [ -n "$WASTE_CODE_ID" ]; then
    make_request "mutation { executeTool(name: \"waste_codes_get\", params: {id: \"$WASTE_CODE_ID\"}) }" "Get waste code by ID"
    make_request "mutation { executeTool(name: \"waste_codes_update\", params: {id: \"$WASTE_CODE_ID\", name: \"Updated Interactive Waste Code\"}) }" "Update waste code"
    make_request "mutation { executeTool(name: \"waste_codes_list\", params: {page: 1, limit: 5}) }" "List waste codes"
fi

# Test 7: Contract Workflow (requires facility and client)
echo -e "${PURPLE}=== CONTRACT WORKFLOW ===${NC}"
if [ -n "$FACILITY_ID" ] && [ -n "$CLIENT_ID" ]; then
    make_request "mutation { executeTool(name: \"contracts_create\", params: {facility_id: \"$FACILITY_ID\", client_id: \"$CLIENT_ID\", title: \"Interactive Test Contract\"}) }" "Create contract" "true" "true"
    show_stored_ids
    
    if [ -n "$CONTRACT_ID" ]; then
        make_request "mutation { executeTool(name: \"contracts_get\", params: {id: \"$CONTRACT_ID\"}) }" "Get contract by ID"
        make_request "mutation { executeTool(name: \"contracts_update\", params: {id: \"$CONTRACT_ID\", title: \"Updated Interactive Contract\"}) }" "Update contract"
        make_request "mutation { executeTool(name: \"contracts_list\", params: {page: 1, limit: 5}) }" "List contracts"
    fi
else
    echo -e "${RED}⚠️  Skipping contract tests - missing facility or client ID${NC}\n"
fi

# Test 8: Error Handling
echo -e "${PURPLE}=== ERROR HANDLING TESTS ===${NC}"
make_request "mutation { executeTool(name: \"clients_get\", params: {id: \"invalid-id-12345\"}) }" "Get client with invalid ID" "false"
make_request "mutation { executeTool(name: \"clients_create\", params: {}) }" "Create client without required fields" "false"
make_request "mutation { executeTool(name: \"nonexistent_tool\", params: {}) }" "Call non-existent tool" "false"

# Test 9: Complex Workflow - Contaminant with all relationships
echo -e "${PURPLE}=== COMPLEX WORKFLOW: CONTAMINANT ===${NC}"
if [ -n "$CLIENT_ID" ] && [ -n "$FACILITY_ID" ] && [ -n "$SHIPMENT_ID" ]; then
    make_request "mutation { executeTool(name: \"contaminants_create\", params: {client_id: \"$CLIENT_ID\", facility_id: \"$FACILITY_ID\", shipment_id: \"$SHIPMENT_ID\", material: \"Test Contaminant\"}) }" "Create contaminant with all relationships"
    make_request "mutation { executeTool(name: \"contaminants_list\", params: {page: 1, limit: 5}) }" "List contaminants"
else
    echo -e "${RED}⚠️  Skipping contaminant tests - missing required IDs${NC}\n"
fi

# Test 10: Inspection Workflow
echo -e "${PURPLE}=== INSPECTION WORKFLOW ===${NC}"
if [ -n "$CLIENT_ID" ] && [ -n "$FACILITY_ID" ] && [ -n "$SHIPMENT_ID" ]; then
    make_request "mutation { executeTool(name: \"inspections_create\", params: {client_id: \"$CLIENT_ID\", facility_id: \"$FACILITY_ID\", shipment_id: \"$SHIPMENT_ID\", delivery_accepted: true}) }" "Create inspection"
    make_request "mutation { executeTool(name: \"inspections_list\", params: {page: 1, limit: 5}) }" "List inspections"
else
    echo -e "${RED}⚠️  Skipping inspection tests - missing required IDs${NC}\n"
fi

# Cleanup
echo -e "${PURPLE}=== CLEANUP ===${NC}"
show_stored_ids

if [ -n "$BUNKER_ID" ]; then
    make_request "mutation { executeTool(name: \"bunkers_delete\", params: {id: \"$BUNKER_ID\"}) }" "Cleanup: Delete bunker"
fi

if [ -n "$FACILITY_ID" ]; then
    make_request "mutation { executeTool(name: \"facilities_delete\", params: {id: \"$FACILITY_ID\"}) }" "Cleanup: Delete facility"
fi

if [ -n "$SHIPMENT_ID" ]; then
    make_request "mutation { executeTool(name: \"shipments_delete\", params: {id: \"$SHIPMENT_ID\"}) }" "Cleanup: Delete shipment"
fi

if [ -n "$CONTRACT_ID" ]; then
    make_request "mutation { executeTool(name: \"contracts_delete\", params: {id: \"$CONTRACT_ID\"}) }" "Cleanup: Delete contract"
fi

if [ -n "$WASTE_CODE_ID" ]; then
    make_request "mutation { executeTool(name: \"waste_codes_delete\", params: {id: \"$WASTE_CODE_ID\"}) }" "Cleanup: Delete waste code"
fi

if [ -n "$CLIENT_ID" ]; then
    make_request "mutation { executeTool(name: \"clients_delete\", params: {id: \"$CLIENT_ID\"}) }" "Cleanup: Delete client"
fi

# Test Summary
echo -e "${YELLOW}=== FINAL TEST SUMMARY ===${NC}"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}✅ Passed: $PASSED_TESTS${NC}"
echo -e "${RED}❌ Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! MCP server is working perfectly!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed - check the output above for details${NC}"
    exit 1
fi
