import type { CategoryColor } from "@/lib/apps-logic/budget/model";
import { CATEGORY_COLORS } from "@/lib/apps-logic/budget/model";
import { categoryColorStyle, CATEGORY_COLOR_LABELS } from "./constants";

interface ColorPickerProps {
  value: CategoryColor;
  onChange: (color: CategoryColor) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div
      className="flex flex-wrap gap-1.5"
      role="radiogroup"
      aria-label="Color"
    >
      {CATEGORY_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={CATEGORY_COLOR_LABELS[color]}
          onClick={() => onChange(color)}
          style={categoryColorStyle(color)}
          className={`h-6 w-6 rounded-full ${value === color ? "ring-2 ring-current ring-offset-2 ring-offset-[var(--color-bg-elevated)]" : ""}`}
        />
      ))}
    </div>
  );
}
