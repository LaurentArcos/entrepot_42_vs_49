// src\app\page.tsx

"use client";
import React, { useEffect, useMemo, useState } from "react";
import Search from "./components/Search";
import VariantRow from "./components/VariantRow";
import type { VariantInventory } from "./types/index";

function gidToNumeric(gid: string): number {
  const n = gid.split("/").pop()!;
  return Number(n);
}

/* ---------- Helpers tri couleur / taille ---------- */
const SIZE_ORDER = [
  "xxs","2xs",
  "xs",
  "s",
  "m",
  "l",
  "xl",
  "xxl","2xl",
  "xxxl","3xl"
];

function norm(s: string) {
  return (s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function sizeRank(raw: string | null | undefined): number {
  if (!raw) return 1_000; // tailles inconnues à la fin
  const s = norm(raw).replace(/\s+/g, "");
  // alias fréquents (xxs=2xs, xxl=2xl, xxxl=3xl)
  const alias: Record<string,string> = { "xxs":"2xs", "xxl":"2xl", "xxxl":"3xl" };
  const key = alias[s] ?? s;
  const idx = SIZE_ORDER.indexOf(key);
  if (idx >= 0) return idx;

  // cas numériques éventuels (ex: 28, 30) → tri croissant après tailles connues
  const num = Number(s.replace(/[^\d]/g, ""));
  if (!Number.isNaN(num)) return 2_000 + num;

  return 1_500; // autre libellé inconnu mais avant numériques
}

/** Essaie d’extraire {color, size} depuis variantTitle type "Bleu Marine / M"
 * - On considère que tout token qui ressemble à une taille connue est la taille.
 * - La couleur = premier token non-taille, sinon le titre complet.
 */
function splitColorSize(variantTitle: string) {
  const tokens = variantTitle.split("/").map(t => t.trim()).filter(Boolean);
  let color: string | null = null;
  let size: string | null = null;

  for (const t of tokens) {
    const r = sizeRank(t);
    if (r !== 1000 && r !== 1500 && r < 2000) { // reconnu comme taille
      size = t;
    } else if (color == null) {
      color = t;
    }
  }
  if (!color) color = variantTitle; // fallback
  return { color, size };
}

type Qty49State = {
  value: number;     // valeur courante (éditée)
  original: number;  // valeur initiale
};

export default function Page() {
  const [picked, setPicked] = useState<{ id: string; title: string } | null>(null);
  const [variants, setVariants] = useState<VariantInventory[]>([]);
  const [qty49Map, setQty49Map] = useState<Record<number, Qty49State>>({});
  const [loading, setLoading] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  // Modal utilisateur
  const [showModal, setShowModal] = useState(false);
  const [operatorName, setOperatorName] = useState("");

async function fetchAirtableQty(inventoryItemNumericId: number): Promise<number> {
  const res = await fetch(
    `/api/airtable/stocks42-49?inventoryItemNumericId=${inventoryItemNumericId}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("[UI] GET quantité_49 fail", res.status, txt);
    return 0; // fallback visuel
  }
  const j = await res.json();
  return typeof j.quantité_49 === "number" ? j.quantité_49 : 0;
}

  function sortVariants(input: VariantInventory[]): VariantInventory[] {
    return [...input].sort((a, b) => {
      const aa = splitColorSize(a.variantTitle);
      const bb = splitColorSize(b.variantTitle);

      const ca = norm(aa.color);
      const cb = norm(bb.color);
      if (ca < cb) return -1;
      if (ca > cb) return 1;

      const ra = sizeRank(aa.size);
      const rb = sizeRank(bb.size);
      if (ra !== rb) return ra - rb;

      // fallback stable
      return a.variantTitle.localeCompare(b.variantTitle, "fr", { sensitivity: "base" });
    });
  }

  async function loadAll() {
    if (!picked) return;
    setLoading(true);
    try {
      // 1) variantes Shopify
      const r = await fetch(`/api/shopify/product-variants?productId=${encodeURIComponent(picked.id)}`, { cache: "no-store" });
      const j = await r.json();

      // ✅ appliquer le tri ici
      const vsRaw: VariantInventory[] = j.variants || [];
      const vs: VariantInventory[] = sortVariants(vsRaw);
      setVariants(vs);

      // 2) quantité_49 par variant
      const entries = await Promise.all(
        vs.map(async (v) => {
          const invNum = gidToNumeric(v.inventoryItemId);
          const q49 = await fetchAirtableQty(invNum);
          return [invNum, { value: q49, original: q49 } as Qty49State] as const;
        })
      );
      const map: Record<number, Qty49State> = {};
      for (const [k, state] of entries) map[k] = state;
      setQty49Map(map);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, [picked?.id]);

  function updateQty49(invNum: number, n: number) {
    setQty49Map((prev) => ({ ...prev, [invNum]: { value: Math.max(0, n), original: prev[invNum]?.original ?? 0 } }));
  }

  const dirty = useMemo(
    () =>
      Object.entries(qty49Map)
        .filter(([_, s]) => s.value !== s.original)
        .map(([key, s]) => ({ invNum: Number(key), ...s })),
    [qty49Map]
  );
  const dirtyCount = dirty.length;

  async function handleRefreshAll() {
    await loadAll();
  }

  function handleSaveAll() {
    if (dirtyCount === 0) return;
    setShowModal(true);
  }

  async function confirmSaveAll() {
    if (!operatorName.trim()) return;
    setSavingAll(true);
    setShowModal(false);

    // Construire jobs: upsert quantité 49 + log
    const jobs: Promise<any>[] = [];

    for (const v of variants) {
      const invNum = gidToNumeric(v.inventoryItemId);
      const st = qty49Map[invNum];
      if (!st || st.value === st.original) continue;

      // 1) update Airtable quantité_49
      jobs.push(
        fetch("/api/airtable/stocks42-49", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inventoryItemNumericId: invNum,
            quantité_49: st.value,
            fields: {
              product_title: v.productTitle,
              variant_title: v.variantTitle,
              sku: v.sku ?? null,
              product_id: Number(v.productId.split("/").pop()!),
              variant_id: Number(v.variantId.split("/").pop()!)
            }
          })
        })
      );

      // 2) créer log
      const variantNumericId = Number(v.variantId.split("/").pop()!);
      jobs.push(
        fetch("/api/airtable/logs-stocks42-49", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: {
              modifié_par: operatorName.trim(),
              product_tile: v.productTitle,           // (orthographe conforme à ta table)
              "qté_avant_modif": st.original,
              "qté_après_modif": st.value,
              variant_id: variantNumericId,
              variant_title: v.variantTitle
            }
          })
        })
      );
    }

    await Promise.all(jobs);

    // Réaligne original=value
    setQty49Map((prev) => {
      const next: Record<number, Qty49State> = {};
      for (const k of Object.keys(prev)) {
        const id = Number(k);
        next[id] = { value: prev[id].value, original: prev[id].value };
      }
      return next;
    });

    setSavingAll(false);
  }

  return (
    <main className="pb-10">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 -mx-4 border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60 sm:-mx-6 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <Search onPick={(p) => setPicked(p)} />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshAll}
              className="btn btn-ghost"
              title="Rafraîchir toutes les données (Shopify + Airtable)"
            >
              Rafraîchir
            </button>
            <button
              onClick={handleSaveAll}
              className="btn btn-primary cursor-pointer"
              disabled={savingAll || dirtyCount === 0}
              title="Enregistrer toutes les quantités 49 modifiées"
            >
              {savingAll ? "Enregistrement…" : `Enregistrer 49 (${dirtyCount})`}
            </button>
          </div>
        </div>
        {picked && (
          <div className="mx-auto mt-2 max-w-5xl text-sm text-gray-600">
            Produit : <span className="font-medium text-gray-900">{picked.title}</span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="mx-auto mt-4 max-w-5xl">
        {loading && <div className="text-sm text-gray-500">Chargement…</div>}
        {!loading && picked && variants.length === 0 && (
          <div className="text-sm text-gray-500">Aucune variante trouvée.</div>
        )}

        <div className="mt-4 space-y-4">
          {variants.map((v) => {
            const invNum = gidToNumeric(v.inventoryItemId);
            const st = qty49Map[invNum] ?? { value: 0, original: 0 };
            return (
              <VariantRow
                key={v.variantId}
                v={v}
                qty49={st.value}
                onQty49Change={(n) => updateQty49(invNum, n)}
              />
            );
          })}
        </div>
      </div>

      {/* Modal confirmation nom opérateur */}
      {showModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
            <div className="text-lg font-semibold">Qui modifie les stocks ?</div>
            <input
              className="input mt-3"
              placeholder="Nom / prénom"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
              <button
                className="btn btn-primary"
                onClick={confirmSaveAll}
                disabled={!operatorName.trim()}
              >
                Confirmer et enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
