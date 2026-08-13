"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { COMPARE_MAX_SELECTIONS, encodeCompareIds } from "@/lib/compare-ids";

interface CompareCard {
  id: string;
  name: string;
  index: number;
  children: React.ReactNode;
}

export function CompareSelector({ cards }: { cards: CompareCard[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const router = useRouter();

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else if (next.size < COMPARE_MAX_SELECTIONS) next.add(id);
    setSelected(next);
  }

  return (
    <>
      {cards.map((card) => (
        <div key={card.id} className="relative">
          <label className="absolute top-3 start-3 z-10 flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.has(card.id)}
              onChange={() => toggle(card.id)}
              className="h-4 w-4 rounded border-border text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-[10px] text-muted-foreground font-medium">Compare</span>
          </label>
          <div className={selected.has(card.id) ? "ring-2 ring-indigo-400 rounded-xl" : ""}>
            {card.children}
          </div>
        </div>
      ))}

      {selected.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Button
            onClick={() => router.push(`/dashboard/compare?ids=${encodeCompareIds(Array.from(selected))}`)}
            className="shadow-lg"
          >
            Compare Selected ({selected.size})
          </Button>
        </div>
      )}
    </>
  );
}
