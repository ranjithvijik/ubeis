// ============================================
// Seed Sample Data Script
// ============================================

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'EIS-Data-dev';

const now = () => new Date().toISOString();
const ttlSeconds = (hours: number) => Math.floor(Date.now() / 1000) + hours * 3600;

type KPISeed = {
  name: string;
  category: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  threshold: { critical: number; warning: number };
  thresholdType: 'min' | 'max';
  history?: Array<{ date: string; value: number }>;
};

// ------------------------------------------------------------
// Data extracted from provided UBalt documents (XLSX + PDF):
// - USM 10-year projections (Fall 2024-2034 headcount)
// - UBalt Strategic Recruitment & Enrollment Plan (Feb 2025) KPI series
// - UBalt CDS 2024-2025 Submission (Fall 2024 snapshot)
// ------------------------------------------------------------

const usmHeadcountTotal = [
  { year: 2024, value: 3232 },
  { year: 2025, value: 3266 },
  { year: 2026, value: 3268 },
  { year: 2027, value: 3290 },
  { year: 2028, value: 3334 },
  { year: 2029, value: 3386 },
  { year: 2030, value: 3447 },
  { year: 2031, value: 3510 },
  { year: 2032, value: 3575 },
  { year: 2033, value: 3636 },
  { year: 2034, value: 3695 },
] as const;

const usmUndergradTotal = [
  { year: 2024, value: 1477 },
  { year: 2025, value: 1456 },
  { year: 2026, value: 1457 },
  { year: 2027, value: 1466 },
  { year: 2028, value: 1484 },
  { year: 2029, value: 1504 },
  { year: 2030, value: 1529 },
  { year: 2031, value: 1554 },
  { year: 2032, value: 1580 },
  { year: 2033, value: 1604 },
  { year: 2034, value: 1628 },
] as const;

const usmGradTotal = [
  { year: 2024, value: 1755 },
  { year: 2025, value: 1810 },
  { year: 2026, value: 1811 },
  { year: 2027, value: 1824 },
  { year: 2028, value: 1850 },
  { year: 2029, value: 1882 },
  { year: 2030, value: 1918 },
  { year: 2031, value: 1956 },
  { year: 2032, value: 1995 },
  { year: 2033, value: 2032 },
  { year: 2034, value: 2067 },
] as const;

const toFallDate = (year: number) => `${year}-10-15T00:00:00.000Z`;

const kpiSeeds: KPISeed[] = [
  // Enrollment (document-based)
  {
    name: 'Total Headcount (USM Projection)',
    category: 'enrollment',
    currentValue: usmHeadcountTotal[0].value,
    targetValue: usmHeadcountTotal[1].value,
    unit: 'students',
    threshold: { critical: 3000, warning: 3150 },
    thresholdType: 'min',
    history: usmHeadcountTotal.map((p) => ({ date: toFallDate(p.year), value: p.value })),
  },
  {
    name: 'Undergraduate Headcount (USM Projection)',
    category: 'enrollment',
    currentValue: usmUndergradTotal[0].value,
    targetValue: usmUndergradTotal[1].value,
    unit: 'students',
    threshold: { critical: 1350, warning: 1425 },
    thresholdType: 'min',
    history: usmUndergradTotal.map((p) => ({ date: toFallDate(p.year), value: p.value })),
  },
  {
    name: 'Graduate/First-Professional Headcount (USM Projection)',
    category: 'enrollment',
    currentValue: usmGradTotal[0].value,
    targetValue: usmGradTotal[1].value,
    unit: 'students',
    threshold: { critical: 1650, warning: 1725 },
    thresholdType: 'min',
    history: usmGradTotal.map((p) => ({ date: toFallDate(p.year), value: p.value })),
  },
  // CDS Fall 2024 undergrad FT/PT snapshot
  {
    name: 'Undergraduate Full-time Headcount (CDS Fall 2024)',
    category: 'enrollment',
    currentValue: 663,
    targetValue: 675,
    unit: 'students',
    threshold: { critical: 600, warning: 640 },
    thresholdType: 'min',
  },
  {
    name: 'Undergraduate Part-time Headcount (CDS Fall 2024)',
    category: 'enrollment',
    currentValue: 814,
    targetValue: 829,
    unit: 'students',
    threshold: { critical: 740, warning: 790 },
    thresholdType: 'min',
  },
  // Strategic Enrollment Plan KPI series
  {
    name: 'Prospective Inquiry Pool (Fall)',
    category: 'enrollment',
    currentValue: 16510,
    targetValue: 17336,
    unit: 'inquiries',
    threshold: { critical: 12000, warning: 15000 },
    thresholdType: 'min',
    history: [
      { date: toFallDate(2021), value: 8584 },
      { date: toFallDate(2022), value: 7148 },
      { date: toFallDate(2023), value: 8574 },
      { date: toFallDate(2024), value: 16510 },
      { date: toFallDate(2025), value: 17336 },
      { date: toFallDate(2026), value: 18203 },
      { date: toFallDate(2027), value: 19113 },
      { date: toFallDate(2028), value: 20069 },
      { date: toFallDate(2029), value: 21072 },
    ],
  },
  {
    name: 'New Student Applications (Total)',
    category: 'enrollment',
    currentValue: 3017,
    targetValue: 3108,
    unit: 'applications',
    threshold: { critical: 2600, warning: 2900 },
    thresholdType: 'min',
    history: [
      { date: toFallDate(2021), value: 2432 },
      { date: toFallDate(2022), value: 2373 },
      { date: toFallDate(2023), value: 2796 },
      { date: toFallDate(2024), value: 3017 },
      { date: toFallDate(2025), value: 3108 },
      { date: toFallDate(2026), value: 3202 },
      { date: toFallDate(2027), value: 3298 },
      { date: toFallDate(2028), value: 3397 },
      { date: toFallDate(2029), value: 3499 },
    ],
  },
  {
    name: 'New Student Applications (UG First-Year)',
    category: 'enrollment',
    currentValue: 1796,
    targetValue: 1850,
    unit: 'applications',
    threshold: { critical: 1500, warning: 1700 },
    thresholdType: 'min',
  },
  {
    name: 'New Student Applications (UG Transfer)',
    category: 'enrollment',
    currentValue: 684,
    targetValue: 705,
    unit: 'applications',
    threshold: { critical: 575, warning: 650 },
    thresholdType: 'min',
  },
  {
    name: 'New Student Applications (Graduate)',
    category: 'enrollment',
    currentValue: 537,
    targetValue: 553,
    unit: 'applications',
    threshold: { critical: 430, warning: 500 },
    thresholdType: 'min',
  },
  {
    name: 'Admit-to-Enroll Yield Rate (New Students)',
    category: 'enrollment',
    currentValue: 0.47,
    targetValue: 0.49,
    unit: 'percent',
    threshold: { critical: 0.44, warning: 0.46 },
    thresholdType: 'min',
    history: [
      { date: toFallDate(2021), value: 0.52 },
      { date: toFallDate(2022), value: 0.54 },
      { date: toFallDate(2023), value: 0.48 },
      { date: toFallDate(2024), value: 0.47 },
      { date: toFallDate(2025), value: 0.49 },
      { date: toFallDate(2026), value: 0.50 },
      { date: toFallDate(2027), value: 0.51 },
      { date: toFallDate(2028), value: 0.52 },
      { date: toFallDate(2029), value: 0.53 },
    ],
  },
  {
    name: 'Continuing Student Persistence Rate (Fall-to-Fall)',
    category: 'academic',
    currentValue: 0.70,
    targetValue: 0.80,
    unit: 'percent',
    threshold: { critical: 0.62, warning: 0.68 },
    thresholdType: 'min',
  },
  // CDS first-time first-year funnel (Fall 2024)
  {
    name: 'First-Year Applicants (CDS Fall 2024)',
    category: 'enrollment',
    currentValue: 127,
    targetValue: 135,
    unit: 'applications',
    threshold: { critical: 95, warning: 115 },
    thresholdType: 'min',
  },
  {
    name: 'First-Year Admits (CDS Fall 2024)',
    category: 'enrollment',
    currentValue: 100,
    targetValue: 105,
    unit: 'admitted',
    threshold: { critical: 80, warning: 92 },
    thresholdType: 'min',
  },
  {
    name: 'First-Year Enrolled (CDS Fall 2024)',
    category: 'enrollment',
    currentValue: 37,
    targetValue: 40,
    unit: 'enrolled',
    threshold: { critical: 28, warning: 34 },
    thresholdType: 'min',
  },
  {
    name: 'First-Year Yield Rate (CDS Fall 2024)',
    category: 'enrollment',
    currentValue: 0.37,
    targetValue: 0.40,
    unit: 'percent',
    threshold: { critical: 0.30, warning: 0.34 },
    thresholdType: 'min',
  },
  // A few additional KPIs (still synthetic, but plausible)
  { name: 'Tuition Revenue', category: 'financial', currentValue: 36500000, targetValue: 37500000, unit: 'dollars', threshold: { critical: 33000000, warning: 35000000 }, thresholdType: 'min' },
  { name: 'Financial Aid Spend', category: 'financial', currentValue: 17800000, targetValue: 18200000, unit: 'dollars', threshold: { critical: 15500000, warning: 16800000 }, thresholdType: 'min' },
  { name: 'Graduation Rate', category: 'academic', currentValue: 0.45, targetValue: 0.47, unit: 'percent', threshold: { critical: 0.38, warning: 0.42 }, thresholdType: 'min' },
  { name: 'IT Service Uptime', category: 'operations', currentValue: 0.995, targetValue: 0.995, unit: 'percent', threshold: { critical: 0.985, warning: 0.99 }, thresholdType: 'min' },
];

const computeStatus = (
  currentValue: number,
  threshold: { critical: number; warning: number },
  thresholdType: 'min' | 'max'
): { status: 'on_target' | 'at_risk' | 'below_target' } => {
  if (thresholdType === 'min') {
    if (currentValue < threshold.critical) return { status: 'below_target' };
    if (currentValue < threshold.warning) return { status: 'at_risk' };
    return { status: 'on_target' };
  }
  // max (lower is better)
  if (currentValue > threshold.critical) return { status: 'below_target' };
  if (currentValue > threshold.warning) return { status: 'at_risk' };
  return { status: 'on_target' };
};

const computeTrend = (
  currentValue: number,
  previousValue: number
): { trend: 'up' | 'down' | 'stable'; changePercent: number } => {
  if (!previousValue || previousValue === 0) return { trend: 'stable', changePercent: 0 };
  const change = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  const trend = change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'stable';
  return { trend, changePercent: Number(change.toFixed(2)) };
};

const seedKPIs = async (): Promise<Map<string, { name: string; category: string }>> => {
  console.log('Seeding KPIs...');
  const kpiIds = new Map<string, { name: string; category: string }>();

  for (const kpi of kpiSeeds) {
    const kpiId = uuidv4();
    const ts = now();
    const hist = kpi.history || [];
    const previousFromHistory = hist.length >= 2 ? hist[hist.length - 2].value : kpi.currentValue * 0.98;
    const { status } = computeStatus(kpi.currentValue, kpi.threshold, kpi.thresholdType);
    const { trend, changePercent } = computeTrend(kpi.currentValue, previousFromHistory);

    const item = {
      PK: `KPI#${kpiId}`,
      SK: 'METADATA',
      GSI1PK: `CATEGORY#${kpi.category}`,
      GSI1SK: `KPI#${kpiId}`,
      kpiId,
      ...kpi,
      previousValue: previousFromHistory,
      status,
      trend,
      changePercent,
      history: [],
      dataSource: 'seed_script_documents',
      lastUpdated: ts,
      updatedBy: 'system',
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    // Seed separate history rows (KPIRepository expects HISTORY#... items)
    if (hist.length > 0) {
      for (const h of hist) {
        const historyItem = {
          PK: `KPI#${kpiId}`,
          SK: `HISTORY#${h.date}`,
          kpiId,
          date: h.date,
          value: h.value,
        };
        await docClient.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: historyItem,
          })
        );
      }
    }

    kpiIds.set(kpiId, { name: kpi.name, category: kpi.category });
    console.log(`  Created KPI: ${kpi.name} (${kpiId})`);
  }

  console.log(`KPI seeding complete! (${kpiIds.size} KPIs)`);
  return kpiIds;
};

const seedAlerts = async (kpiIds: Map<string, { name: string; category: string }>): Promise<void> => {
  if (kpiIds.size === 0) return;
  console.log('Seeding active alerts...');

  const entries = Array.from(kpiIds.entries());
  const severities: Array<'critical' | 'warning' | 'info'> = ['critical', 'warning', 'warning', 'info', 'info'];

  for (let i = 0; i < Math.min(12, entries.length); i++) {
    const [kpiId, { name }] = entries[i];
    const alertId = uuidv4();
    const ts = now();
    const severity = severities[i % severities.length];
    const threshold = 100;
    const currentValue = severity === 'critical' ? 85 : severity === 'warning' ? 92 : 97;
    const message =
      severity === 'critical'
        ? `${name} has fallen below critical threshold.`
        : severity === 'warning'
          ? `${name} is approaching critical threshold.`
          : `${name} is below target; monitor for trends.`;

    const item = {
      PK: `ALERT#${alertId}`,
      SK: 'METADATA',
      GSI1PK: 'ALERT#ACTIVE',
      GSI1SK: `${severity}#${ts}`,
      GSI2PK: `KPI#${kpiId}`,
      GSI2SK: `ALERT#${alertId}`,
      alertId,
      kpiId,
      kpiName: name,
      severity,
      message,
      currentValue,
      threshold,
      status: 'active',
      createdAt: ts,
      expiresAt: new Date(Date.now() + (severity === 'critical' ? 168 : severity === 'warning' ? 72 : 24) * 3600 * 1000).toISOString(),
      TTL: ttlSeconds(severity === 'critical' ? 168 : severity === 'warning' ? 72 : 24),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    console.log(`  Created alert: ${severity} - ${name} (${alertId})`);
  }

  console.log('Alert seeding complete!');
};

const seedTransactions = async (kpiIds: Map<string, { name: string; category: string }>): Promise<void> => {
  if (kpiIds.size === 0) return;
  console.log('Seeding KPI transactions (drill-down)...');

  const entries = Array.from(kpiIds.entries());
  const sources = ['Banner', 'Slate', 'Workday', 'PowerBI', 'ManualUpload'];

  for (const [kpiId, { name, category }] of entries) {
    // Create 25 transactions spread over the last 60 days
    for (let i = 0; i < 25; i++) {
      const txId = uuidv4();
      const occurredAt = new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 3600 * 1000 - i * 3600 * 1000).toISOString();
      const sourceSystem = sources[i % sources.length];

      const kind =
        category === 'financial'
          ? 'financial_posting'
          : category === 'enrollment'
            ? 'enrollment_event'
            : category === 'academic'
              ? 'system_event'
              : 'other';

      const value =
        category === 'financial'
          ? undefined
          : Math.round((Math.random() * 100 + 1) * 100) / 100;

      const amount =
        category === 'financial'
          ? Math.round((Math.random() * 25000 + 250) * 100) / 100
          : undefined;

      const description =
        category === 'financial'
          ? `${name}: posting recorded (${sourceSystem})`
          : category === 'enrollment'
            ? `${name}: event recorded (${sourceSystem})`
            : `${name}: source update (${sourceSystem})`;

      const item = {
        PK: `KPI#${kpiId}`,
        SK: `TX#${occurredAt}#${txId}`,
        transactionId: txId,
        kpiId,
        occurredAt,
        kind,
        amount,
        value,
        unit: category === 'financial' ? 'dollars' : undefined,
        sourceSystem,
        description,
        attributes: {
          docSeed: true,
          category,
        },
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: item,
        })
      );
    }
  }

  console.log('Transaction seeding complete!');
};

const main = async (): Promise<void> => {
  try {
    const kpiIds = await seedKPIs();
    await seedAlerts(kpiIds);
    await seedTransactions(kpiIds);
    console.log('\nAll seed data created successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

main();
