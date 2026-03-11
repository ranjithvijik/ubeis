// ============================================
// De-duplicate KPIs in DynamoDB
// ============================================
//
// Goal:
// - Find KPI METADATA rows with the same (name, category) pair.
// - Prefer to keep the record coming from the enhanced UBalt dataset
//   (dataSource includes "Enhanced"), otherwise keep the most recently
//   updated KPI by lastUpdated.
// - Delete all other KPI rows for the losing kpiIds, including:
//   - METADATA
//   - HISTORY#...
//   - TX#... (if present)
//
// Usage:
//   AWS_REGION=us-east-1 \
//   DYNAMODB_TABLE=UniversityOfBaltimore-EIS-Data-dev \
//   npx ts-node scripts/dedupe-kpis.ts
//

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

const REGION = process.env.AWS_REGION || 'us-east-1';
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'UniversityOfBaltimore-EIS-Data-dev';

const client = new DynamoDBClient({ region: REGION });
const doc = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

type KPIMetadataRow = {
  PK: string;
  SK: string;
  kpiId: string;
  name: string;
  category: string;
  dataSource?: string;
  lastUpdated?: string;
};

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

async function listAllKpiMetadata(): Promise<KPIMetadataRow[]> {
  const items: KPIMetadataRow[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined = undefined;

  do {
    const res = await doc.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        ExclusiveStartKey,
        ProjectionExpression: 'PK, SK, kpiId, #name, category, dataSource, lastUpdated',
        ExpressionAttributeNames: {
          '#name': 'name',
        },
        FilterExpression: 'begins_with(PK, :pk) AND SK = :sk',
        ExpressionAttributeValues: {
          ':pk': 'KPI#',
          ':sk': 'METADATA',
        },
      })
    );

    items.push(...((res.Items || []) as KPIMetadataRow[]));
    ExclusiveStartKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);

  return items;
}

function chooseWinner(group: KPIMetadataRow[]): KPIMetadataRow {
  // 1) Prefer enhanced dataset KPIs
  const enhanced = group.filter((g) =>
    (g.dataSource || '').toLowerCase().includes('enhanced')
  );
  if (enhanced.length > 0) {
    // If multiple, choose the most recently updated
    return enhanced.sort(
      (a, b) =>
        new Date(b.lastUpdated || 0).getTime() -
        new Date(a.lastUpdated || 0).getTime()
    )[0];
  }

  // 2) Otherwise, choose the most recently updated KPI
  return group.sort(
    (a, b) =>
      new Date(b.lastUpdated || 0).getTime() -
      new Date(a.lastUpdated || 0).getTime()
  )[0];
}

async function listAllItemsForKpi(kpiId: string) {
  const pk = `KPI#${kpiId}`;
  const res = await doc.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': pk,
      },
    })
  );
  return res.Items || [];
}

async function batchDeleteItems(items: Record<string, unknown>[]) {
  const deletes = items.map((it) => ({
    DeleteRequest: {
      Key: {
        PK: it.PK,
        SK: it.SK,
      },
    },
  }));

  for (const part of chunk(deletes, 25)) {
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
  console.log(
    `Scanning ${TABLE_NAME} in ${REGION} for duplicate KPIs (by name + category)...`
  );

  const meta = await listAllKpiMetadata();
  console.log(`Found ${meta.length} KPI METADATA rows.`);

  // Group by (normalizedName, normalizedCategory)
  const groups = new Map<string, KPIMetadataRow[]>();
  for (const row of meta) {
    const nameKey = (row.name || '').trim().toLowerCase();
    const catKey = (row.category || '').trim().toLowerCase();
    if (!nameKey || !catKey) continue;
    const key = `${nameKey}||${catKey}`;
    const arr = groups.get(key) || [];
    arr.push(row);
    groups.set(key, arr);
  }

  const duplicateGroups = Array.from(groups.values()).filter(
    (g) => g.length > 1
  );

  if (duplicateGroups.length === 0) {
    console.log('No duplicate KPI groups found. Nothing to delete.');
    return;
  }

  console.log(
    `Found ${duplicateGroups.length} duplicate KPI groups (same name + category).`
  );

  let totalDeleted = 0;

  for (const group of duplicateGroups) {
    const winner = chooseWinner(group);
    const losers = group.filter((g) => g.kpiId !== winner.kpiId);

    console.log(
      `Group "${winner.name}" [${winner.category}] -> keeping KPI ${winner.kpiId}, deleting ${losers.length} duplicate(s).`
    );

    for (const loser of losers) {
      const items = await listAllItemsForKpi(loser.kpiId);
      if (items.length === 0) continue;
      await batchDeleteItems(items as any[]);
      totalDeleted += items.length;
      console.log(
        `  Deleted KPI ${loser.kpiId} (${items.length} item(s): metadata/history/transactions).`
      );
    }
  }

  console.log(
    `Done. Deleted ${totalDeleted} DynamoDB item(s) across ${duplicateGroups.length} KPI groups.`
  );
}

main().catch((err) => {
  console.error('KPI de-duplication failed:', err);
  process.exit(1);
});

