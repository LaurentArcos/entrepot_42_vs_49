export type ProductHit = {
  id: string;
  title: string;
  image?: string | null;
};

export type VariantInventory = {
  productId: string;
  productTitle: string;
  variantId: string;
  variantTitle: string;
  sku?: string | null;
  inventoryItemId: string;
  availableAt42: number;
  totalAcrossAll?: number | null;
};

export type AirtableRow = {
  id?: string;
  inventory_item_id: number;
  product_id?: number | null;
  variant_id?: number | null;
  product_title?: string | null;
  variant_title?: string | null;
  sku?: string | null;
  product_status?: string | null;
  "Mouvements de Stock"?: string | null;
  "Mouvements de Stock 2"?: string | null;
  quantité_49?: number | null;
};
