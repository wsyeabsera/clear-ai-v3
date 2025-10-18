# Planner Agent Testing Documentation

## Overview

This directory contains comprehensive tests for the Planner Agent, including integration tests, GraphQL API tests, and manual testing tools.

## Test Structure

```
tests/agents/planner/
├── README.md                    # This documentation
├── test-utils.ts               # Test utilities and helpers
├── planner-integration.test.ts # Integration tests
└── graphql-requests.test.ts    # GraphQL API tests
```

## Test Types

### 1. Integration Tests (`planner-integration.test.ts`)

Tests the core functionality of the Planner Agent:

- **Plan Creation**: Tests plan creation with various query types
- **Plan Retrieval**: Tests retrieving plans by request ID
- **Plan Statistics**: Tests statistics calculation
- **Recent Plans**: Tests recent plans retrieval
- **Plan Deletion**: Tests plan deletion
- **Error Handling**: Tests error scenarios
- **MongoDB Persistence**: Tests database operations
- **Performance**: Tests execution time and concurrency

### 2. GraphQL API Tests (`graphql-requests.test.ts`)

Tests the GraphQL API endpoints:

- **createPlan Mutation**: Tests plan creation via GraphQL
- **getPlan Query**: Tests plan retrieval via GraphQL
- **getPlanStatistics Query**: Tests statistics via GraphQL
- **getRecentPlans Query**: Tests recent plans via GraphQL
- **deletePlan Mutation**: Tests plan deletion via GraphQL
- **Data Validation**: Tests response structure validation

### 3. Manual Testing (`scripts/test-planner-manual.ts`)

Interactive testing tool for manual verification:

- Interactive menu-driven interface
- Real LLM testing with API keys
- Database status monitoring
- Sample query execution
- Plan creation and retrieval testing

## Running Tests

### Prerequisites

1. **Environment Variables**: Set up your API keys
   ```bash
   export OPENAI_API_KEY="your-openai-key"
   export GROQ_API_KEY="your-groq-key"
   export MONGODB_URI="mongodb://localhost:27017/waste-management-test"
   ```

2. **Dependencies**: Install test dependencies
   ```bash
   npm install --save-dev mongodb-memory-server
   ```

### Running Integration Tests

```bash
# Run all planner tests
npm test -- tests/agents/planner/

# Run specific test file
npm test -- tests/agents/planner/planner-integration.test.ts

# Run with coverage
npm test -- --coverage tests/agents/planner/
```

### Running GraphQL Tests

```bash
# Run GraphQL API tests
npm test -- tests/agents/planner/graphql-requests.test.ts
```

### Running Manual Tests

```bash
# Start interactive manual testing
npx ts-node scripts/test-planner-manual.ts
```

## Test Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for LLM calls | Required |
| `GROQ_API_KEY` | Groq API key for LLM calls | Optional |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/waste-management-test` |
| `DEFAULT_LLM_PROVIDER` | Default LLM provider | `openai` |
| `ENABLE_LLM_FALLBACK` | Enable LLM fallback | `true` |
| `MAX_PLAN_REFINEMENTS` | Maximum plan refinement attempts | `3` |
| `PLANNER_TIMEOUT_MS` | Planner timeout in milliseconds | `30000` |

### Test Database

Tests use MongoDB Memory Server for isolated testing:

- **In-memory database**: No external MongoDB required
- **Automatic cleanup**: Database is cleaned between tests
- **Isolated tests**: Each test runs in a clean environment

## Test Coverage

### Integration Tests Coverage

- ✅ Plan creation with various query types
- ✅ Plan retrieval by request ID
- ✅ Plan statistics calculation
- ✅ Recent plans retrieval
- ✅ Plan deletion
- ✅ Error handling
- ✅ MongoDB persistence
- ✅ Performance testing
- ✅ Concurrent plan creation
- ✅ Plan structure validation

### GraphQL Tests Coverage

- ✅ createPlan mutation
- ✅ getPlan query
- ✅ getPlanStatistics query
- ✅ getRecentPlans query
- ✅ deletePlan mutation
- ✅ Error handling
- ✅ Data validation
- ✅ Response structure validation

## Sample Test Queries

The tests use these sample queries to verify functionality:

1. "List all shipments from last week"
2. "Get contaminated shipments from Berlin facilities"
3. "Create a new shipment record"
4. "Find shipments with lead contamination"
5. "Show me facilities with high rejection rates"
6. "Get all facilities in Germany"
7. "List waste codes for hazardous materials"
8. "Find contracts expiring this month"

## Expected Test Results

### Successful Test Run

```
✅ All integration tests pass
✅ GraphQL mutations work correctly
✅ Plans are stored in MongoDB
✅ Plans can be retrieved by request ID
✅ Tool selection is accurate
✅ Validation catches errors
✅ Statistics are calculated correctly
✅ Error handling works properly
```

### Test Output Example

```
🧪 Testing Planner Agent...

✅ Plan created successfully!
📊 Results:
   Request ID: 123e4567-e89b-12d3-a456-426614174000
   Query: List all shipments from last week
   Status: COMPLETED
   Execution Time: 1500ms
   Validation Errors: 0

📋 Plan Structure:
   Total Steps: 1
   Parallel Steps: 0
   Steps:
     1. shipments_list
        Description: Execute shipments_list command for query: List all shipments from last week
        Parameters: {
          "page": 1,
          "limit": 10,
          "date_from": "2025-01-01T00:00:00.000Z"
        }
        Depends On: None
        Parallel: false
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB Memory Server is installed
   - Check if port 27017 is available
   - Verify MongoDB URI configuration

2. **LLM API Key Error**
   - Verify API keys are set correctly
   - Check API key validity
   - Ensure sufficient API credits

3. **Test Timeout**
   - Increase timeout values in test configuration
   - Check network connectivity
   - Verify LLM provider availability

4. **Memory Issues**
   - Increase Node.js memory limit: `node --max-old-space-size=4096`
   - Clean up test database between tests
   - Monitor memory usage during tests

### Debug Mode

Run tests with debug output:

```bash
# Enable debug logging
DEBUG=planner:* npm test -- tests/agents/planner/

# Run with verbose output
npm test -- --verbose tests/agents/planner/
```

### Performance Testing

For performance testing:

```bash
# Run performance tests only
npm test -- --grep "Performance" tests/agents/planner/

# Run with performance profiling
node --prof npm test -- tests/agents/planner/
```

## Contributing

When adding new tests:

1. **Follow naming conventions**: Use descriptive test names
2. **Add proper setup/teardown**: Clean up resources
3. **Include error cases**: Test both success and failure scenarios
4. **Document test purpose**: Add comments explaining test goals
5. **Update this README**: Document new test coverage

## Test Data

### Test Plan Structure

```typescript
{
  steps: [
    {
      tool: "shipments_list",
      params: {
        page: 1,
        limit: 10,
        date_from: "2025-01-01T00:00:00.000Z"
      },
      dependsOn: [],
      parallel: false,
      description: "Execute shipments_list command"
    }
  ],
  metadata: {
    query: "List all shipments from last week",
    requestId: "uuid-here",
    totalSteps: 1,
    parallelSteps: 0
  }
}
```

### Test Response Structure

```typescript
{
  requestId: "uuid-here",
  query: "List all shipments from last week",
  plan: { /* plan object */ },
  status: "COMPLETED",
  createdAt: "2025-01-01T00:00:00.000Z",
  executionTimeMs: 1500,
  validationErrors: []
}
```

## Support

For issues with tests:

1. Check this documentation
2. Review test logs for error details
3. Verify environment configuration
4. Check API key validity
5. Ensure all dependencies are installed

For questions or contributions, please refer to the main project documentation.
