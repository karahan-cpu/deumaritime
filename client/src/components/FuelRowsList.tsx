import { fuelTypes } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LockableInput } from "@/components/ui/lockable-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface FuelRow { fuelType: string; tons: number }

export function FuelRowsList({ value, onChange, title }: {
  value: FuelRow[];
  onChange: (rows: FuelRow[]) => void;
  title?: string;
}) {
  const rows = value ?? [];

  const updateRow = (idx: number, patch: Partial<FuelRow>) => {
    const next = rows.map((r, i) => i === idx ? { ...r, ...patch } : r);
    onChange(next);
  };

  const addRow = () => {
    onChange([...(rows || []), { fuelType: fuelTypes[0].value, tons: 0 }]);
  };

  const removeRow = (idx: number) => {
    const next = rows.filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {title && <h4 className="font-semibold">{title}</h4>}
      {rows.map((row, idx) => (
        <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5 space-y-1">
            <Label>Fuel Type</Label>
            <Select value={row.fuelType} onValueChange={(v) => updateRow(idx, { fuelType: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fuelTypes.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-5 space-y-1">
            <Label>Consumption (tons)</Label>
            <LockableInput
              type="number"
              step="0.01"
              placeholder="e.g., 20000"
              value={row.tons ?? 0}
              onChange={(e) => updateRow(idx, { tons: parseFloat(e.target.value) })}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="button" variant="destructive" className="w-full" onClick={() => removeRow(idx)}>Remove</Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="ghost" onClick={addRow}>+ Add fuel type</Button>
    </div>
  );
}
