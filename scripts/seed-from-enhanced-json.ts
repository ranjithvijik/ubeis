// ============================================
// Seed DynamoDB from UBalt_EIS_DynamoDB_Data_Enhanced.json
// ============================================
//
// Usage (dev):
//   AWS_REGION=us-east-1 \
//   DYNAMODB_TABLE=UniversityOfBaltimore-EIS-Data-dev \
//   npx ts-node scripts/seed-from-enhanced-json.ts
//
// This script reads the enhanced UBalt EIS JSON export and
// maps KPI records into the current single-table schema used
// by the backend and dashboard:
// - One METADATA row per KPI (PK: KPI#<kpiId>, SK: METADATA)
// - Optional HISTORY rows per KPI (PK: KPI#<kpiId>, SK: HISTORY#<isoDate>)
//

import fs from 'fs';
import path from 'path';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { BatchWriteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.AWS_REGION || 'us-east-1';
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'UniversityOfBaltimore-EIS-Data-dev';

const client = new DynamoDBClient({ region: REGION });
const doc = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

type EnhancedKPIHistoryPoint = {
  date: string;
  value: number;
};

type EnhancedKPIItem = {
  PK: string;
  SK: string;
  kind: 'KPI';
  kpiId: string;
  kpiName: string;
  name?: string;
  description?: string | null;
  category: string;
  subcategory?: string;
  currentValue: number;
  previousValue: number;
  targetValue: number;
  unit: string;
  threshold?: { warning: number; critical: number };
  thresholdType?: string;
  status: string;
  trend: string;
  changePercent: number;
  history?: EnhancedKPIHistoryPoint[] | null;
  dataSource?: string | null;
  lastUpdated?: string;
  updatedBy?: string;
};

type EnhancedRoot = {
  Items: Array<Record<string, unknown>>;
};

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const mapCategory = (raw: string): string => {
  const c = raw.toLowerCase();
  if (c.includes('enrollment')) return 'enrollment';
  if (c.includes('financial') || c.includes('finance') || c === 'budget') return 'financial';
  if (c.includes('academic') || c.includes('student_success')) return 'academic';
  if (c.includes('research')) return 'research';
  return 'operations';
};

const mapThresholdType = (raw?: string): 'min' | 'max' => {
  if (!raw) return 'min';
  const v = raw.toLowerCase();
  if (v.startsWith('max')) return 'max';
  return 'min';
};

const mapStatus = (raw: string): 'on_target' | 'at_risk' | 'below_target' => {
  const v = raw.toLowerCase();
  if (v.includes('below')) return 'below_target';
  if (v.includes('risk')) return 'at_risk';
  return 'on_target';
};

const mapTrend = (raw: string): 'up' | 'down' | 'stable' => {
  const v = raw.toLowerCase();
  if (v.includes('increase') || v === 'up') return 'up';
  if (v.includes('decrease') || v === 'down') return 'down';
  return 'stable';
};

const toIso = (value: string | undefined): string => {
  if (!value) return new Date().toISOString();
  // If already ISO-like, let Date parse it
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  return new Date().toISOString();
};

async function batchWrite(requests: Record<string, unknown>[]) {
  for (const part of chunk(requests, 25)) {
    await doc.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: part as any,
        },
      })
    );
  }
}

async function main() {
  const jsonPath = path.join(process.cwd(), 'UBalt_EIS_DynamoDB_Data_Enhanced.json');
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const parsed = JSON.parse(raw) as EnhancedRoot;

  const kpiItems = (parsed.Items || []).filter(
    (it) => (it as any).kind === 'KPI'
  ) as EnhancedKPIItem[];

  if (kpiItems.length === 0) {
    console.log('No KPI items found in enhanced JSON; nothing to seed.');
    return;
  }

  console.log(
    `Seeding ${kpiItems.length} KPI records into table ${TABLE_NAME} (${REGION}) from enhanced JSON.`
  );

  const puts: Record<string, unknown>[] = [];

  for (const item of kpiItems) {
    const kpiId = item.kpiId;
    const category = mapCategory(item.category);
    const status = mapStatus(item.status || 'ON_TARGET');
    const trend = mapTrend(item.trend || 'STABLE');
    const thresholdType = mapThresholdType(item.thresholdType);

    const metaPK = `KPI#${kpiId}`;
    const metaSK = 'METADATA';

    // KPI metadata row
    puts.push({
      PutRequest: {
        Item: {
          PK: metaPK,
          SK: metaSK,
          GSI1PK: `CATEGORY#${category}`,
          GSI1SK: `KPI#${kpiId}`,
          kpiId,
          name: item.kpiName || item.name || kpiId,
          description: item.description ?? null,
          category,
          currentValue: item.currentValue,
          previousValue: item.previousValue,
          targetValue: item.targetValue,
          unit: item.unit,
          threshold: item.threshold ?? { warning: item.targetValue, critical: item.targetValue },
          thresholdType,
          status,
          trend,
          changePercent: item.changePercent,
          history: Array.isArray(item.history)
            ? item.history.map((h) => ({
                date: toIso(h.date),
                value: h.value,
              }))
            : [],
          dataSource: item.dataSource || 'UBalt Enhanced Dataset',
          lastUpdated: toIso(item.lastUpdated),
          updatedBy: item.updatedBy || 'system',
        },
      },
    });

    // History rows (for dashboard trends)
    if (Array.isArray(item.history)) {
      for (const h of item.history) {
        const dateIso = toIso(h.date);
        puts.push({
          PutRequest: {
            Item: {
              PK: metaPK,
              SK: `HISTORY#${dateIso}`,
              GSI2PK: `HISTORY#${dateIso}`,
              GSI2SK: `KPI#${kpiId}`,
              kpiId,
              date: dateIso,
              value: h.value,
              recordedAt: toIso(item.lastUpdated),
            },
          },
        });
      }
    }
  }

  await batchWrite(puts);

  console.log(`Done. Wrote ${puts.length} PutRequest entries for ${kpiItems.length} KPIs.`);
}

main().catch((err) => {
  console.error('Seeding from enhanced JSON failed:', err);
  process.exit(1);
});

