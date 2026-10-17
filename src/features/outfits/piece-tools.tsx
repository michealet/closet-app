"use client";

import {
  ArrowDownToLineIcon,
  ArrowUpToLineIcon,
  MinusIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CanvasItem } from "./layout";

const SIZE_STEP = 1.15;

/**
 * Buttons for the selected piece (OC-6): layer order, size and remove. The
 * canvas isn't focusable, so the list also lets keyboard and screen-reader
 * users pick a piece (ADR 0003).
 */
export function PieceTools({
  items,
  names,
  selectedId,
  onSelect,
  onLayer,
  onScale,
  onRemove,
}: {
  items: CanvasItem[];
  names: Map<string, string>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onLayer: (step: 1 | -1) => void;
  onScale: (factor: number) => void;
  onRemove: () => void;
}) {
  if (!items.length) return null;
  const order = [...items].sort((a, b) => b.z - a.z);
  const selected = items.find((item) => item.id === selectedId);
  const top = Math.max(...items.map((item) => item.z));
  const bottom = Math.min(...items.map((item) => item.z));
  const tools = [
    {
      label: "Send backward",
      icon: ArrowDownToLineIcon,
      onClick: () => onLayer(-1),
      disabled: !selected || selected.z === bottom,
    },
    {
      label: "Bring forward",
      icon: ArrowUpToLineIcon,
      onClick: () => onLayer(1),
      disabled: !selected || selected.z === top,
    },
    {
      label: "Smaller",
      icon: MinusIcon,
      onClick: () => onScale(1 / SIZE_STEP),
      disabled: !selected,
    },
    {
      label: "Bigger",
      icon: PlusIcon,
      onClick: () => onScale(SIZE_STEP),
      disabled: !selected,
    },
    {
      label: "Remove from outfit",
      icon: Trash2Icon,
      onClick: onRemove,
      disabled: !selected,
    },
  ];

  return (
    <div className="mt-3 space-y-2">
      <select
        aria-label="Piece to arrange"
        value={selectedId ?? ""}
        onChange={(event) => onSelect(event.target.value || null)}
        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base focus-visible:outline-ring"
      >
        <option value="">Choose a piece to arrange</option>
        {order.map((item) => (
          <option key={item.id} value={item.id}>
            {names.get(item.id)}
          </option>
        ))}
      </select>
      <div role="toolbar" aria-label="Arrange piece" className="flex gap-2">
        {tools.map(({ label, icon: Icon, onClick, disabled }) => (
          <Button
            key={label}
            type="button"
            variant="secondary"
            size="icon-lg"
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={onClick}
            className="flex-1"
          >
            <Icon aria-hidden />
          </Button>
        ))}
      </div>
    </div>
  );
}
