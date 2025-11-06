import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { shipTypes, fuelTypes, type FleetVessel } from "@shared/schema";
import { calculateCII, calculateRequiredCII, getCIIRating } from "@/lib/calculations";

const addVesselSchema = z.object({
  vesselName: z.string().min(1, "Vessel name is required"),
  type: z.string().min(1, "Ship type is required"),
  dwt: z.coerce.number().positive("DWT must be a positive number"),
  grossTonnage: z.coerce.number().positive("Gross tonnage must be a positive number"),
  buildYear: z.coerce.number().int().min(1900, "Build year must be 1900 or later").max(2030, "Build year cannot exceed 2030"),
  annualFuelConsumption: z.coerce.number().positive("Fuel consumption must be a positive number"),
  distanceTraveled: z.coerce.number().positive("Distance must be a positive number"),
  fuelType: z.string().min(1, "Fuel type is required"),
});

type AddVesselFormData = z.infer<typeof addVesselSchema>;

interface AddVesselDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (vessel: Omit<FleetVessel, "id">) => void;
}

export function AddVesselDialog({ open, onOpenChange, onAdd }: AddVesselDialogProps) {
  const form = useForm<AddVesselFormData>({
    resolver: zodResolver(addVesselSchema),
    defaultValues: {
      vesselName: "",
      type: "",
      fuelType: "",
    },
  });

  const onSubmit = (data: AddVesselFormData) => {
    if (data.distanceTraveled === 0 || data.annualFuelConsumption === 0) {
      return;
    }

    const attainedCII = calculateCII(
      data.annualFuelConsumption,
      data.distanceTraveled,
      data.dwt,
      data.fuelType
    );
    const requiredCII = calculateRequiredCII(data.type as any, data.dwt, new Date().getFullYear());
    const ciiRating = getCIIRating(attainedCII, requiredCII) as "A" | "B" | "C" | "D" | "E";

    if (!isFinite(attainedCII) || !isFinite(requiredCII)) {
      return;
    }

    const vessel: Omit<FleetVessel, "id"> = {
      vesselName: data.vesselName,
      type: data.type as any,
      dwt: data.dwt,
      grossTonnage: data.grossTonnage,
      buildYear: data.buildYear,
      annualFuelConsumption: data.annualFuelConsumption,
      distanceTraveled: data.distanceTraveled,
      fuelType: data.fuelType,
      ciiRating,
      ciiValue: attainedCII,
      year: new Date().getFullYear(),
    };
    
    onAdd(vessel);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-add-vessel">
        <DialogHeader>
          <DialogTitle>Add Fleet Vessel</DialogTitle>
          <DialogDescription>
            Enter ship information and operational parameters. CII rating will be calculated automatically.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Ship Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vesselName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vessel Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter vessel name" data-testid="input-vessel-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ship Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-vessel-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {shipTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dwt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deadweight Tonnage (DWT) *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 50000" data-testid="input-dwt" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="grossTonnage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gross Tonnage (GT) *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 30000" data-testid="input-gross-tonnage" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="buildYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Build Year *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 2015" data-testid="input-build-year" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Operational Parameters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="annualFuelConsumption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Fuel Consumption (MT) *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 5000" data-testid="input-fuel-consumption" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="distanceTraveled"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distance Traveled (NM) *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 70000" data-testid="input-distance" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fuelType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fuel Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-fuel-type">
                            <SelectValue placeholder="Select fuel type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fuelTypes.map((fuel) => (
                            <SelectItem key={fuel.value} value={fuel.value}>
                              {fuel.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button type="submit" data-testid="button-submit-vessel">
                Add Vessel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
