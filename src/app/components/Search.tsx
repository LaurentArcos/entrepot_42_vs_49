"use client";
import React, { useEffect, useState } from "react";

export default function Search({ onPick }: { onPick: (p: { id: string; title: string; image?: string | null }) => void }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) { setItems([]); return; }
      setLoading(true);
      const r = await fetch(`/api/shopify/search-products?q=${encodeURIComponent(q)}`);
      const json = await r.json();
      setItems(json.items || []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="relative">
      <input
        className="input"
        placeholder="Rechercher un produit (titre)…"
        value={q}
        onChange={e => setQ(e.target.value)}
      />
      {loading && <div className="mt-2 text-xs text-gray-500">Recherche…</div>}
      {items.length > 0 && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {items.map((it) => (
            <button
              key={it.id}
              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-gray-50"
              onClick={() => { onPick(it); setItems([]); }}
            >
              {it.image ? (
                <img src={it.image} alt="" className="h-8 w-8 rounded-md object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-md bg-gray-200" />
              )}
              <span className="text-sm">{it.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
