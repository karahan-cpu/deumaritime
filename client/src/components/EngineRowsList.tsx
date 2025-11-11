import { fuelTypes, type EngineRow } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function EngineRowsList({ value, onChange, title }: {
  value: EngineRow[];
  onChange: (rows: EngineRow[]) => void;
  title?: string;
}) {
  const rows = value ?? [];

  const updateRow = (idx: number, patch: Partial<EngineRow>) => {
    const next = rows.map((r, i) => {
      if (i === idx) {
        const updated = { ...r, ...patch };
        // Ensure numeric fields are properly handled
        if ('power' in patch && patch.power !== undefined) {
          updated.power = Math.max(0, patch.power);
        }
        if ('sfc' in patch && patch.sfc !== undefined) {
          updated.sfc = patch.sfc > 0 ? patch.sfc : 190;
        }
        return updated;
      }
      return r;
    });
    onChange(next);
  };

  const addRow = () => {
    onChange([...(rows || []), { power: 0, sfc: 190, fuelType: fuelTypes[0].value }]);
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
          <div className="sm:col-span-4 space-y-1">
            <Label>Power (kW MCR) *</Label>
            <Input 
              type="number" 
              step="0.01" 
              placeholder="e.g., 12500" 
              value={row.power ?? 0}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                updateRow(idx, { power: isNaN(val) ? 0 : Math.max(0, val) });
              }}
              min="0"
            />
            <p className="text-xs text-muted-foreground">Maximum Continuous Rating</p>
          </div>
          <div className="sm:col-span-3 space-y-1">
            <Label>SFC (g/kWh) *</Label>
            <Input 
              type="number" 
              step="0.01" 
              placeholder="e.g., 190" 
              value={row.sfc ?? 190}
              onChange={(e) => {
                const val = e.target.value === '' ? 190 : parseFloat(e.target.value);
                updateRow(idx, { sfc: isNaN(val) || val <= 0 ? 190 : val });
              }}
              min="0.01"
            />
            <p className="text-xs text-muted-foreground">At reference load</p>
          </div>
          <div className="sm:col-span-3 space-y-1">
            <Label>Fuel Type</Label>
            <Select value={row.fuelType || fuelTypes[0].value} onValueChange={(v) => updateRow(idx, { fuelType: v })}>
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
          <div className="sm:col-span-2">
            <Button type="button" variant="destructive" className="w-full" onClick={() => removeRow(idx)}>Remove</Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="link" onClick={addRow}>+ Add engine</Button>
    </div>
  );
}

