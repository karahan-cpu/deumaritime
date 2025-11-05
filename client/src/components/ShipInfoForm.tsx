import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { shipInfoSchema, shipTypes, type ShipInfo } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Ship } from "lucide-react";

interface ShipInfoFormProps {
  onSubmit: (data: ShipInfo) => void;
  defaultValues?: Partial<ShipInfo>;
}

export function ShipInfoForm({ onSubmit, defaultValues }: ShipInfoFormProps) {
  const form = useForm<ShipInfo>({
    resolver: zodResolver(shipInfoSchema),
    defaultValues: defaultValues || {
      shipName: "",
      shipType: "Bulk Carrier",
      deadweight: 0,
      grossTonnage: 0,
      yearBuilt: new Date().getFullYear(),
      isNewBuild: false,
    },
  });

  const handleSubmit = (data: ShipInfo) => {
    console.log("Ship info submitted:", data);
    onSubmit(data);
  };

  return (
    <Card data-testid="card-ship-info-form">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Ship className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Ship Information</CardTitle>
            <CardDescription>Enter basic vessel details for compliance calculations</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="shipName">Ship Name</Label>
              <Input
                id="shipName"
                {...form.register("shipName")}
                placeholder="e.g., MV Ocean Pioneer"
                data-testid="input-ship-name"
              />
              {form.formState.errors.shipName && (
                <p className="text-sm text-destructive">{form.formState.errors.shipName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipType">Ship Type</Label>
              <Select
                value={form.watch("shipType")}
                onValueChange={(value) => form.setValue("shipType", value as any)}
              >
                <SelectTrigger data-testid="select-ship-type">
                  <SelectValue placeholder="Select ship type" />
                </SelectTrigger>
                <SelectContent>
                  {shipTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadweight">Deadweight Tonnage (DWT)</Label>
              <Input
                id="deadweight"
                type="number"
                {...form.register("deadweight", { valueAsNumber: true })}
                placeholder="e.g., 85000"
                data-testid="input-deadweight"
              />
              {form.formState.errors.deadweight && (
                <p className="text-sm text-destructive">{form.formState.errors.deadweight.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="grossTonnage">Gross Tonnage (GT)</Label>
              <Input
                id="grossTonnage"
                type="number"
                {...form.register("grossTonnage", { valueAsNumber: true })}
                placeholder="e.g., 52000"
                data-testid="input-gross-tonnage"
              />
              {form.formState.errors.grossTonnage && (
                <p className="text-sm text-destructive">{form.formState.errors.grossTonnage.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearBuilt">Year Built</Label>
              <Input
                id="yearBuilt"
                type="number"
                {...form.register("yearBuilt", { valueAsNumber: true })}
                placeholder="e.g., 2020"
                data-testid="input-year-built"
              />
              {form.formState.errors.yearBuilt && (
                <p className="text-sm text-destructive">{form.formState.errors.yearBuilt.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-3 pt-8">
              <Switch
                id="isNewBuild"
                checked={form.watch("isNewBuild")}
                onCheckedChange={(checked) => form.setValue("isNewBuild", checked)}
                data-testid="switch-new-build"
              />
              <Label htmlFor="isNewBuild" className="font-normal">
                New Build Ship (for EEDI calculation)
              </Label>
            </div>
          </div>

          <Button type="submit" className="w-full" data-testid="button-submit-ship-info">
            Continue to Calculations
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
