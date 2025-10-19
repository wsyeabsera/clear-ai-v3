// Test script for Groq integration
const { PlannerAgent } = require('./dist/agents/planner/PlannerAgent');

async function testGroqPlanner() {
  console.log('🧪 Testing Groq Planner Integration');
  
  // Set environment variables for testing
  process.env.DEFAULT_LLM_PROVIDER = 'groq';
  process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || 'your_groq_api_key_here';
  process.env.GROQ_MODEL = 'llama-3.1-8b-instant';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/waste-management-test';
  
  try {
    const planner = new PlannerAgent();
    
    console.log('📋 Testing simple query...');
    const result = await planner.plan('List all shipments', 'groq', true);
    
    console.log('✅ Success!');
    console.log('Request ID:', result.requestId);
    console.log('Status:', result.status);
    console.log('Steps:', result.plan.steps.length);
    console.log('Tools:', result.plan.steps.map(s => s.tool));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure to set your GROQ_API_KEY environment variable:');
    console.log('export GROQ_API_KEY=your_actual_groq_api_key');
  }
}

testGroqPlanner();
