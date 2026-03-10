// ============================================
// Seed Sample Data Script
// ============================================
 
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
 
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'EIS-Data-dev';
 
const sampleKPIs = [
  {
    name: 'Total Enrollment',
    category: 'enrollment',
    currentValue: 5234,
    targetValue: 5500,
    unit: 'students',
    threshold: { critical: 4500, warning: 5000 },
    thresholdType: 'min',
  },
  {
    name: 'Retention Rate',
    category: 'enrollment',
    currentValue: 0.82,
    targetValue: 0.85,
    unit: 'percent',
    threshold: { critical: 0.7, warning: 0.75 },
    thresholdType: 'min',
  },
  {
    name: 'Tuition Revenue',
    category: 'financial',
    currentValue: 42500000,
    targetValue: 45000000,
    unit: 'dollars',
    threshold: { critical: 38000000, warning: 40000000 },
    thresholdType: 'min',
  },
  {
    name: 'Budget Utilization',
    category: 'financial',
    currentValue: 0.67,
    targetValue: 0.95,
    unit: 'percent',
    threshold: { critical: 1.05, warning: 0.98 },
    thresholdType: 'max',
  },
  {
    name: 'Graduation Rate',
    category: 'academic',
    currentValue: 0.45,
    targetValue: 0.5,
    unit: 'percent',
    threshold: { critical: 0.35, warning: 0.4 },
    thresholdType: 'min',
  },
];
 
const seedKPIs = async (): Promise<void> => {
  console.log('Seeding KPIs...');
 
  for (const kpi of sampleKPIs) {
    const kpiId = uuidv4();
    const now = new Date().toISOString();
 
    const item = {
      PK: `KPI#${kpiId}`,
      SK: 'METADATA',
      GSI1PK: `CATEGORY#${kpi.category}`,
      GSI1SK: `KPI#${kpiId}`,
      kpiId,
      ...kpi,
      previousValue: kpi.currentValue * 0.98,
      status: 'on_target',
      trend: 'up',
      changePercent: 2.0,
      history: [],
      dataSource: 'seed_script',
      lastUpdated: now,
      updatedBy: 'system',
    };
 
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );
 
    console.log(`  Created KPI: ${kpi.name} (${kpiId})`);
  }
 
  console.log('KPI seeding complete!');
};
 
const main = async (): Promise<void> => {
  try {
    await seedKPIs();
    console.log('\nAll seed data created successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};
 
main();
