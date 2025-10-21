import { shopifyGraphQL } from "../../../lib/shopify";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = (new URL(req.url)).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ items: [] });
  const query = `
    query SearchProducts($q: String!) {
      products(first: 10, query: $q) {
        nodes {
          id
          title
          featuredImage { url }
        }
      }
    }
  `;
  const data = await shopifyGraphQL<{ products: { nodes: { id: string; title: string; featuredImage?: { url: string } | null }[] } }>(query, { q });
  const items = data.products.nodes.map(n => ({ id: n.id, title: n.title, image: n.featuredImage?.url ?? null }));
  return NextResponse.json({ items });
}
