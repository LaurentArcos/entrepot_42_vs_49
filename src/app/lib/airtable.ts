// src\app\lib\airtable.ts

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY!;
const BASE_ID = process.env.AIRTABLE_STOCK_BASE_ID!;
const TABLE = process.env.AIRTABLE_STOCKS_42_49_TABLE || "stocks_42_49";
const LOGS_TABLE = process.env.AIRTABLE_STOCKS_LOGS_TABLE || "logs_stocks_42_49";

const baseUrl = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`;
const logsUrl = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(LOGS_TABLE)}`;

function h() {
  return { Authorization: `Bearer ${AIRTABLE_API_KEY}` };
}

export async function airtableFindByInventoryItemId(inventoryItemNumericId: number) {
  const filter = encodeURIComponent(`{inventory_item_id} = ${inventoryItemNumericId}`);
  const url = `${baseUrl}?filterByFormula=${filter}&maxRecords=1`;
  const r = await fetch(url, { headers: h(), cache: "no-store" });
  if (!r.ok) {
    const txt = await r.text();
    console.error("[Airtable][GET] fail", r.status, txt);
    throw new Error(`Airtable GET failed ${r.status}: ${txt}`);
  }
  const data = await r.json();
  return (data.records?.[0]) || null;
}

export async function airtableUpsertQuantity49(payload: {
  inventory_item_id: number;
  fields?: Record<string, any>;
  quantité_49: number;
}) {
  const existing = await airtableFindByInventoryItemId(payload.inventory_item_id);
  const fields = { ...(payload.fields || {}), inventory_item_id: payload.inventory_item_id, "quantité_49": payload.quantité_49 };

  if (existing) {
    const r = await fetch(`${baseUrl}`, {
      method: "PATCH",
      headers: { ...h(), "Content-Type": "application/json" },
      body: JSON.stringify({ records: [{ id: existing.id, fields }] })
    });
    if (!r.ok) {
      const txt = await r.text();
      console.error("[Airtable][PATCH] fail", r.status, txt);
      throw new Error(`Airtable PATCH failed ${r.status}: ${txt}`);
    }
    return await r.json();
  } else {
    const r = await fetch(`${baseUrl}`, {
      method: "POST",
      headers: { ...h(), "Content-Type": "application/json" },
      body: JSON.stringify({ records: [{ fields }] })
    });
    if (!r.ok) {
      const txt = await r.text();
      console.error("[Airtable][POST] fail", r.status, txt);
      throw new Error(`Airtable POST failed ${r.status}: ${txt}`);
    }
    return await r.json();
  }
}

export async function airtableGetQuantity49(inventoryItemNumericId: number): Promise<number | null> {
  const rec = await airtableFindByInventoryItemId(inventoryItemNumericId);
  const v = rec?.fields?.["quantité_49"];
  return typeof v === "number" ? v : null;
}

/** Logs */
export async function airtableCreateStockLog(fieldsList: Record<string, any>[]) {
  const r = await fetch(logsUrl, {
    method: "POST",
    headers: { ...h(), "Content-Type": "application/json" },
    body: JSON.stringify({ records: fieldsList.map((f) => ({ fields: f })) })
  });
  if (!r.ok) {
    const txt = await r.text();
    console.error("[Airtable][LOGS POST] fail", r.status, txt);
    throw new Error(`Airtable LOGS POST failed ${r.status}: ${txt}`);
  }
  return await r.json();
}