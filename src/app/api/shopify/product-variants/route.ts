// src\app\api\shopify\product-variants\route.ts

import { NextRequest, NextResponse } from "next/server";
import { shopifyGraphQL } from "../../../lib/shopify";

const LOCATION_42 = process.env.SHOPIFY_LOCATION_ID_ENTREPOT42!; // GID complet

export async function GET(req: NextRequest) {
  const productId = (new URL(req.url)).searchParams.get("productId");
  if (!productId) return NextResponse.json({ variants: [] });

  const query = /* GraphQL */ `
    query VariantsWithInventory($id: ID!) {
      product(id: $id) {
        id
        title
        variants(first: 100) {
          nodes {
            id
            title
            sku
            inventoryItem {
              id
              inventoryLevels(first: 100) {
                edges {
                  node {
                    location { id name }
                    quantities(names: ["available"]) {
                      name
                      quantity
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyGraphQL<any>(query, { id: productId });

  const getAvail = (n: any) => {
    const q = Array.isArray(n?.quantities)
      ? n.quantities.find((x: any) => String(x?.name).toLowerCase() === "available")
      : null;
    return Number(q?.quantity ?? 0);
  };

  const variants = (data.product?.variants?.nodes ?? []).map((v: any) => {
    const levels = (v?.inventoryItem?.inventoryLevels?.edges ?? []).map((e: any) => e.node);

    const at42Node = levels.find((l: any) => l?.location?.id === LOCATION_42);
    const availableAt42 = at42Node ? getAvail(at42Node) : 0;

    const totalAcrossAll = levels.reduce((sum: number, l: any) => sum + getAvail(l), 0);

    return {
      productId: data.product.id,
      productTitle: data.product.title,
      variantId: v.id,
      variantTitle: v.title,
      sku: v.sku ?? null,
      inventoryItemId: v.inventoryItem?.id,
      availableAt42,
      totalAcrossAll
    };
  });

  return NextResponse.json({ variants });
}
