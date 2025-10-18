# MCP Server Troubleshooting Guide

## Issue: "No tools, prompts, resources" in Cursor

If Cursor shows "no tools, prompts, resources" after configuring your MCP server, follow these steps:

### 1. Verify Configuration Location
Make sure the MCP configuration is in the correct location:

**Project-specific (Recommended):**
```bash
# Create .cursor directory in your project
mkdir -p .cursor
cp mcp.json .cursor/mcp.json
```

**Global configuration:**
```bash
cp mcp.json ~/.cursor/mcp.json
```

### 2. Check Configuration Format
Ensure your `.cursor/mcp.json` contains:

```json
{
  "mcpServers": {
    "waste-management": {
      "command": "ts-node",
      "args": ["src/server/index.ts"],
      "cwd": "/Users/yab/Projects/clear-ai-v3",
      "env": {
        "MONGODB_URI": "mongodb://localhost:27017/waste-management",
        "NODE_ENV": "development"
      }
    }
  }
}
```

### 3. Verify Prerequisites
- ✅ Node.js and npm installed
- ✅ TypeScript and ts-node available
- ✅ MongoDB running on localhost:27017
- ✅ All project dependencies installed (`npm install`)

### 4. Test MCP Server Manually
Run the test script to verify the server works:

```bash
node test-mcp.js
```

Expected output:
```
✅ Response 1: Unknown - Success
✅ Response 2: Unknown - Success
   📋 Found 45 tools
✅ Response 3: Unknown - Success
✅ MongoDB connection: Success
```

### 5. Check Cursor Logs
1. Open Cursor
2. Go to View → Output
3. Select "MCP" from the dropdown
4. Look for error messages

### 6. Restart Cursor
After making configuration changes:
1. Close Cursor completely
2. Reopen Cursor
3. Wait a few seconds for MCP servers to initialize

### 7. Alternative Configuration
If the above doesn't work, try using the built version:

```json
{
  "mcpServers": {
    "waste-management": {
      "command": "node",
      "args": ["dist/server/index.js"],
      "cwd": "/Users/yab/Projects/clear-ai-v3",
      "env": {
        "MONGODB_URI": "mongodb://localhost:27017/waste-management",
        "NODE_ENV": "production"
      }
    }
  }
}
```

First build the project:
```bash
npm run build
```

### 8. Debug Mode
To see detailed MCP server logs, run:

```bash
ts-node src/server/index.ts
```

Then in another terminal, test with:
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | ts-node src/server/index.ts
```

### 9. Common Issues

**Issue: "Command not found: ts-node"**
- Solution: Install ts-node globally: `npm install -g ts-node`
- Or use the built version with `node dist/server/index.js`

**Issue: "MongoDB connection failed"**
- Solution: Start MongoDB: `mongod`
- Or update MONGODB_URI in the configuration

**Issue: "Permission denied"**
- Solution: Make sure the working directory is correct and accessible

**Issue: "Tools not appearing"**
- Solution: Check that the MCP server responds to `tools/list` requests
- Verify the server implements the `initialize` method
- Ensure tool names don't contain hyphens

### 10. Verify Tools Are Working
Once configured, test in Cursor by asking:
- "List all available tools"
- "Create a new shipment"
- "Show me the waste management tools"

If tools appear in the response, the MCP server is working correctly!
