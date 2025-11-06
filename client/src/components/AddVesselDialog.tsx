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
import { shipTypes, type FleetVessel } from "@shared/schema";

const addVesselSchema = z.object({
  vesselName: z.string().min(1, "Vessel name is required"),
  type: z.string().optional(),
  dwt: z.string().optional(),
  buildYear: z.string().optional(),
  eexi: z.string().optional(),
  ciiRating: z.enum(["A", "B", "C", "D", "E", ""]).optional(),
  ciiValue: z.string().optional(),
  fuelEUStatus: z.string().optional(),
  euETSCost: z.string().optional(),
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
      dwt: "",
      buildYear: "",
      eexi: "",
      ciiRating: "",
      ciiValue: "",
      fuelEUStatus: "",
      euETSCost: "",
    },
  });

  const onSubmit = (data: AddVesselFormData) => {
    const vessel: Omit<FleetVessel, "id"> = {
      vesselName: data.vesselName,
      type: data.type && data.type !== "" ? (data.type as any) : undefined,
      dwt: data.dwt ? parseFloat(data.dwt) : undefined,
      buildYear: data.buildYear ? parseInt(data.buildYear) : undefined,
      eexi: data.eexi ? parseFloat(data.eexi) : undefined,
      ciiRating: data.ciiRating && data.ciiRating !== "" ? (data.ciiRating as any) : undefined,
      ciiValue: data.ciiValue ? parseFloat(data.ciiValue) : undefined,
      fuelEUStatus: data.fuelEUStatus || undefined,
      euETSCost: data.euETSCost ? parseFloat(data.euETSCost) : undefined,
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
            Add a new vessel to your fleet. Fill in the available information.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <FormLabel>Type</FormLabel>
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
                    <FormLabel>DWT</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Deadweight tonnage" data-testid="input-dwt" {...field} />
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
                    <FormLabel>Build Year</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Year built" data-testid="input-build-year" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eexi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EEXI</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="EEXI value" data-testid="input-eexi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ciiRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CII Rating</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-cii-rating">
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                        <SelectItem value="E">E</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ciiValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CII Value</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="CII value" data-testid="input-cii-value" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fuelEUStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FuelEU Status</FormLabel>
                    <FormControl>
                      <Input placeholder="FuelEU status" data-testid="input-fueleu-status" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="euETSCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EU ETS Cost</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="EU ETS cost" data-testid="input-eu-ets-cost" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
