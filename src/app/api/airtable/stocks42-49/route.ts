//src\app\api\airtable\stocks42-49\route.ts
 
import { NextRequest, NextResponse } from "next/server";
import { airtableGetQuantity49, airtableUpsertQuantity49 } from "../../../lib/airtable";

export const dynamic = "force-dynamic"; // pas de cache côté Next

// GET ?inventoryItemNumericId=123
export async function GET(req: NextRequest) {
  try {
    const id = Number((new URL(req.url)).searchParams.get("inventoryItemNumericId") || "");
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 });
    }
    const value = await airtableGetQuantity49(id);
    return NextResponse.json({ quantité_49: value });
  } catch (err: any) {
    console.error("[API][stocks42-49][GET] error", err?.message || err);
    return NextResponse.json({ error: String(err?.message || "Airtable error") }, { status: 500 });
  }
}

// PUT body: { inventoryItemNumericId: number, quantité_49: number, fields? }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const numericId = Number(body?.inventoryItemNumericId);
    const qty = Number(body?.quantité_49 ?? 0);
    if (!Number.isFinite(numericId) || Number.isNaN(qty)) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    const fields = body?.fields && typeof body.fields === "object" ? body.fields : {};
    const res = await airtableUpsertQuantity49({ inventory_item_id: numericId, quantité_49: qty, fields });
    return NextResponse.json({ ok: true, airtable: res });
  } catch (err: any) {
    console.error("[API][stocks42-49][PUT] error", err?.message || err);
    return NextResponse.json({ error: String(err?.message || "Airtable error") }, { status: 500 });
  }
}

