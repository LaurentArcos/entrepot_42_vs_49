import { NextRequest, NextResponse } from "next/server";
import { airtableGetQuantity49, airtableUpsertQuantity49 } from "../../../lib/airtable";

// GET ?inventoryItemNumericId=123456789
export async function GET(req: NextRequest) {
  const id = Number((new URL(req.url)).searchParams.get("inventoryItemNumericId") || "");
  if (!id) return NextResponse.json({ quantité_49: null });
  const value = await airtableGetQuantity49(id);
  return NextResponse.json({ quantité_49: value });
}

// PUT body: { inventoryItemNumericId: number, quantité_49: number, fields? }
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const numericId = Number(body?.inventoryItemNumericId);
  const qty = Number(body?.quantité_49 ?? 0);
  if (!numericId || Number.isNaN(qty)) return NextResponse.json({ error: "invalid payload" }, { status: 400 });

  const fields = body?.fields && typeof body.fields === "object" ? body.fields : {};
  const res = await airtableUpsertQuantity49({ inventory_item_id: numericId, quantité_49: qty, fields });
  return NextResponse.json({ ok: true, airtable: res });
}
