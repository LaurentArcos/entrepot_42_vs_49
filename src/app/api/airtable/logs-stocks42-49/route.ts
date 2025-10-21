import { NextRequest, NextResponse } from "next/server";
import { airtableCreateStockLog } from "../../../lib/airtable";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Accepte soit { fields: {...} } soit { records: [{ fields }, ...] }
  if (Array.isArray(body?.records)) {
    const res = await airtableCreateStockLog(body.records.map((r: any) => r.fields || {}));
    return NextResponse.json({ ok: true, airtable: res });
  }

  if (body?.fields && typeof body.fields === "object") {
    const res = await airtableCreateStockLog([body.fields]);
    return NextResponse.json({ ok: true, airtable: res });
  }

  return NextResponse.json({ error: "invalid payload" }, { status: 400 });
}
