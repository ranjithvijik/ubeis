// ============================================
// Test Setup
// ============================================
 
process.env.ENVIRONMENT = 'test';
process.env.DYNAMODB_TABLE = 'EIS-Data-test';
process.env.AWS_REGION = 'us-east-1';
process.env.LOG_LEVEL = 'ERROR';
 
jest.setTimeout(30000);
