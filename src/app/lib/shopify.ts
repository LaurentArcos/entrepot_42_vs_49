const SHOPIFY_ADMIN_API = process.env.SHOPIFY_ADMIN_API!;
const SHOPIFY_API_TOKEN = process.env.SHOPIFY_API_TOKEN!;

export async function shopifyGraphQL<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const r = await fetch(SHOPIFY_ADMIN_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_API_TOKEN
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store"
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`Shopify error ${r.status}: ${txt}`);
  }
  const json = await r.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}
