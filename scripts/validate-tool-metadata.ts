#!/usr/bin/env ts-node

/**
 * Test script to validate all tool schemas for consistency and correctness
 */

import { ToolRegistry } from '../src/server/tools/ToolRegistry';
import { ToolMetadataValidator } from '../src/server/tools/ToolMetadataValidator';

async function validateToolMetadata() {
  console.log('🧪 Validating Tool Metadata...\n');

  try {
    // Get all tools
    const allTools = ToolRegistry.getAllTools();
    console.log(`📊 Found ${allTools.length} tools to validate\n`);

    // Validate all tools
    const validationResult = ToolMetadataValidator.validateToolSchemas(allTools);

    // Display results
    console.log('📋 Validation Results:');
    console.log(`✅ Valid: ${validationResult.isValid ? 'Yes' : 'No'}`);
    console.log(`❌ Errors: ${validationResult.errors.length}`);
    console.log(`⚠️ Warnings: ${validationResult.warnings.length}\n`);

    // Show errors
    if (validationResult.errors.length > 0) {
      console.log('❌ ERRORS:');
      validationResult.errors.forEach((error: string, index: number) => {
        console.log(`  ${index + 1}. ${error}`);
      });
      console.log('');
    }

    // Show warnings
    if (validationResult.warnings.length > 0) {
      console.log('⚠️ WARNINGS:');
      validationResult.warnings.forEach((warning: string, index: number) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
      console.log('');
    }

    // Get summary
    const summary = ToolMetadataValidator.getValidationSummary(allTools);
    console.log('📊 Summary:');
    console.log(`  Total Tools: ${summary.totalTools}`);
    console.log(`  Valid Tools: ${summary.validTools}`);
    console.log(`  Invalid Tools: ${summary.invalidTools}`);
    console.log(`  Total Errors: ${summary.totalErrors}`);
    console.log(`  Total Warnings: ${summary.totalWarnings}\n`);

    // Test individual tool validation
    console.log('🔍 Testing individual tool validation...');
    const testTool = allTools[0];
    if (testTool) {
      const individualResult = ToolMetadataValidator.validateSingleTool(testTool);
      console.log(`✅ Individual validation for ${testTool.name}: ${individualResult.isValid ? 'Valid' : 'Invalid'}`);
    }

    // Test auto-fix functionality
    console.log('\n🔧 Testing auto-fix functionality...');
    const toolsWithIssues = allTools.filter(tool => {
      const result = ToolMetadataValidator.validateSingleTool(tool);
      return !result.isValid;
    });

    if (toolsWithIssues.length > 0) {
      console.log(`Found ${toolsWithIssues.length} tools with issues, testing auto-fix...`);
      
      toolsWithIssues.slice(0, 3).forEach(tool => {
        console.log(`\nFixing tool: ${tool.name}`);
        const fixedTool = ToolMetadataValidator.fixCommonIssues(tool);
        const fixedResult = ToolMetadataValidator.validateSingleTool(fixedTool);
        console.log(`  Before: ${ToolMetadataValidator.validateSingleTool(tool).isValid ? 'Valid' : 'Invalid'}`);
        console.log(`  After: ${fixedResult.isValid ? 'Valid' : 'Invalid'}`);
      });
    } else {
      console.log('✅ No tools with issues found for auto-fix testing');
    }

    // Test specific tool categories
    console.log('\n📂 Testing tool categories...');
    const categories = new Map<string, number>();
    allTools.forEach(tool => {
      const category = tool.name.split('_')[0];
      categories.set(category, (categories.get(category) || 0) + 1);
    });

    console.log('Tool Categories:');
    Array.from(categories.entries()).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} tools`);
    });

    // Check for naming consistency
    console.log('\n🏷️ Checking naming consistency...');
    const namingIssues = allTools.filter(tool => {
      const parts = tool.name.split('_');
      return parts.length < 2 || !['create', 'get', 'update', 'delete', 'list'].includes(parts[1]);
    });

    if (namingIssues.length > 0) {
      console.log(`⚠️ Found ${namingIssues.length} tools with naming issues:`);
      namingIssues.forEach(tool => {
        console.log(`  - ${tool.name}`);
      });
    } else {
      console.log('✅ All tools follow naming convention');
    }

    // Final result
    if (validationResult.isValid) {
      console.log('\n🎉 All tool metadata is valid!');
    } else {
      console.log('\n❌ Tool metadata validation failed. Please fix the errors above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Tool Metadata Validation Failed:', error);
    process.exit(1);
  }
}

// Run the validation
if (require.main === module) {
  validateToolMetadata();
}

export default validateToolMetadata;
