// ============================================
// Backfill KPI Drill-down Data (History + Transactions)
// ============================================
//
// Purpose:
// - Many KPIs were created before we added drill-down transactions and separate history rows.
// - This script backfills missing HISTORY#... and TX#... items so KPI detail pages have data.
//
// Usage:
//   AWS_REGION=us-east-1 DYNAMODB_TABLE=UniversityOfBaltimore-EIS-Data-dev ts-node scripts/backfill-kpi-drilldown.ts
//

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  QueryCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const REGION = process.env.AWS_REGION || 'us-east-1';
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'UniversityOfBaltimore-EIS-Data-dev';

const client = new DynamoDBClient({ region: REGION });
const doc = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

type KPIItem = {
  PK: string;
  SK: string;
  kpiId: string;
  name?: string;
  category?: string;
  currentValue?: number;
  unit?: string;
};

const isoDaysAgo = (daysAgo: number) => {
  const d = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);
  return d.toISOString();
};

const clampNumber = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const chunk = <T>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

async function listAllKPIs(): Promise<KPIItem[]> {
  const items: KPIItem[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined = undefined;

  do {
    const res = await doc.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        ExclusiveStartKey,
        ProjectionExpression: 'PK, SK, kpiId, #name, category, currentValue, #unit',
        ExpressionAttributeNames: {
          '#name': 'name',
          '#unit': 'unit',
        },
        FilterExpression: 'SK = :sk AND begins_with(PK, :pk)',
        ExpressionAttributeValues: {
          ':sk': 'METADATA',
          ':pk': 'KPI#',
        },
      })
    );

    items.push(...((res.Items || []) as KPIItem[]));
    ExclusiveStartKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);

  return items;
}

async function hasAnyRows(kpiId: string, skPrefix: 'TX#' | 'HISTORY#'): Promise<boolean> {
  const res = await doc.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `KPI#${kpiId}`,
        ':sk': skPrefix,
      },
      Limit: 1,
    })
  );
  return (res.Items?.length || 0) > 0;
}

function buildHistoryItems(kpi: KPIItem, points = 18): Record<string, unknown>[] {
  const base = typeof kpi.currentValue === 'number' ? kpi.currentValue : 100;
  const isRate = (kpi.unit || '').toLowerCase().includes('percent');
  const min = isRate ? 0 : 0;
  const max = isRate ? 1 : base * 1.5 + 1;

  const out: Record<string, unknown>[] = [];
  let value = base;
  for (let i = points - 1; i >= 0; i--) {
    // small random walk around base
    const jitterPct = isRate ? 0.02 : 0.05;
    const delta = (Math.random() - 0.5) * 2 * jitterPct * (base || 1);
    value = clampNumber(value + delta, min, max);

    const date = isoDaysAgo(i * 30);
    out.push({
      PutRequest: {
        Item: {
          PK: `KPI#${kpi.kpiId}`,
          SK: `HISTORY#${date}`,
          kpiId: kpi.kpiId,
          date,
          value: Number(value.toFixed(isRate ? 4 : 2)),
          recordedAt: new Date().toISOString(),
        },
      },
    });
  }
  return out;
}

function buildTransactionItems(kpi: KPIItem, count = 25): Record<string, unknown>[] {
  const category = kpi.category || 'other';
  const sources = ['Banner', 'Slate', 'Workday', 'PowerBI', 'ManualUpload'];
  const out: Record<string, unknown>[] = [];

  for (let i = 0; i < count; i++) {
    const txId = uuidv4();
    const occurredAt = new Date(
      Date.now() - Math.floor(Math.random() * 60) * 24 * 3600 * 1000 - i * 3600 * 1000
    ).toISOString();
    const sourceSystem = sources[i % sources.length];

    const kind =
      category === 'financial'
        ? 'financial_posting'
        : category === 'enrollment'
          ? 'enrollment_event'
          : category === 'academic'
            ? 'system_event'
            : 'other';

    const value = category === 'financial' ? undefined : Math.round((Math.random() * 100 + 1) * 100) / 100;
    const amount =
      category === 'financial' ? Math.round((Math.random() * 25000 + 250) * 100) / 100 : undefined;

    const name = kpi.name || 'KPI';
    const description =
      category === 'financial'
        ? `${name}: posting recorded (${sourceSystem})`
        : category === 'enrollment'
          ? `${name}: event recorded (${sourceSystem})`
          : `${name}: source update (${sourceSystem})`;

    out.push({
      PutRequest: {
        Item: {
          PK: `KPI#${kpi.kpiId}`,
          SK: `TX#${occurredAt}#${txId}`,
          transactionId: txId,
          kpiId: kpi.kpiId,
          occurredAt,
          kind,
          amount,
          value,
          unit: category === 'financial' ? 'dollars' : undefined,
          sourceSystem,
          description,
          attributes: {
            backfilled: true,
            category,
          },
        },
      },
    });
  }

  return out;
}

async function batchWrite(requests: Record<string, unknown>[]) {
  // DynamoDB batchWrite supports 25 requests max
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
  console.log(`Backfilling KPI drill-down data in table: ${TABLE_NAME} (${REGION})`);

  const kpis = await listAllKPIs();
  console.log(`Found ${kpis.length} KPI metadata items.`);

  let historyBackfilled = 0;
  let txBackfilled = 0;

  for (const kpi of kpis) {
    const [hasHistory, hasTx] = await Promise.all([
      hasAnyRows(kpi.kpiId, 'HISTORY#'),
      hasAnyRows(kpi.kpiId, 'TX#'),
    ]);

    const writes: Record<string, unknown>[] = [];
    if (!hasHistory) {
      writes.push(...buildHistoryItems(kpi, 18));
      historyBackfilled++;
    }
    if (!hasTx) {
      writes.push(...buildTransactionItems(kpi, 25));
      txBackfilled++;
    }

    if (writes.length > 0) {
      await batchWrite(writes);
      console.log(`Backfilled ${writes.length} rows for KPI ${kpi.kpiId} (${kpi.name || 'Unnamed'})`);
    }
  }

  console.log(
    `Done. KPIs backfilled - history: ${historyBackfilled}, transactions: ${txBackfilled}.`
  );
}

main().catch((e) => {
  console.error('Backfill failed:', e);
  process.exit(1);
});

