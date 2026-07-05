"use client";

// tenants slice — track selector: preset toggle buttons + free-text fallback.
// (No shadcn Select vendored; composed from Button + Input primitives.)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TENANT_TRACK_PRESETS } from "../config/labels";

export function TrackPicker({
  value,
  onChange,
  presets = [...TENANT_TRACK_PRESETS],
  customPlaceholder,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  presets?: string[];
  customPlaceholder?: string;
  disabled?: boolean;
}) {
  const isPreset = presets.includes(value);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Button
            key={preset}
            type="button"
            size="sm"
            disabled={disabled}
            variant={value === preset ? "default" : "outline"}
            onClick={() => onChange(value === preset ? "" : preset)}
          >
            {preset}
          </Button>
        ))}
      </div>
      <Input
        value={isPreset ? "" : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={customPlaceholder}
        disabled={disabled}
      />
    </div>
  );
}
