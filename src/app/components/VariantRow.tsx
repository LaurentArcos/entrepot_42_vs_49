// src\app\components\VariantRow.tsx

"use client";
import React from "react";
import type { VariantInventory } from "../types/index";

export default function VariantRow({
  v,
  qty49,
  onQty49Change
}: {
  v: VariantInventory;
  qty49: number;
  onQty49Change: (n: number) => void;
}) {
  // Total de référence = disponible à l’emplacement 42 (Shopify)
  const totalAt42 = Math.max(0, v.availableAt42 ?? 0);
  const qty42 = Math.max(0, totalAt42 - (qty49 ?? 0));

  const denom = totalAt42 > 0 ? totalAt42 : 1;
  const leftRatio  = Math.min(1, Math.max(0, qty42 / denom));                  // 42 (vert)
  const rightRatio = Math.min(1, Math.max(0, Math.min(qty49 ?? 0, denom) / denom)); // 49 (rouge)

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-semibold">
          {v.variantTitle} {v.sku ? <span className="font-normal text-gray-500">({v.sku})</span> : null}
        </div>
        <div className="text-s text-gray-600">
          Stock total de l'entrepôt dans Shopify : <span className="font-medium text-gray-900">{totalAt42}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-6">
        <div className="order-2 w-full sm:order-1 sm:w-28">
          <div className="text-s text-gray-500">Entrepôt 42</div>
          <div className="text-lg font-semibold">{qty42} pcs</div>
        </div>

        <div className="order-1 sm:order-2 flex-1">
          {/* Jauge 100% vert/rouge */}
          <div className="relative h-6 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
            <div className="h-full bg-green-500" style={{ width: `${leftRatio * 100}%` }} />
            <div className="absolute right-0 top-0 h-full bg-red-600" style={{ width: `${rightRatio * 100}%` }} />
          </div>
        </div>

        <div className="order-3 w-full sm:w-28 sm:text-right">
          <div className="text-s text-gray-500">Entrepôt 49</div>
          <div className="text-lg font-semibold">{qty49 ?? 0} pcs</div>
        </div>
      </div>

      <div className="mt-3 text-right">
        <label className="mb-1 block text-xs text-gray-500">Modifier quantité 49</label>
        <input
          type="number"
          className="text-right input w-28"
          value={qty49 ?? 0}
          onChange={(e) => onQty49Change(Math.max(0, Number(e.target.value || 0)))}
          min={0}
        />
      </div>
    </div>
  );
}
