import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Plus } from "lucide-react";
import type { ShipInfo } from "@shared/schema";

interface FleetMetrics {
  shipbuildingCosts?: number;
  fuelCosts?: number;
  eexiCosts?: number;
  imoGFITier1Costs?: number;
  imoGFITier2Costs?: number;
  imoGFIRewardCosts?: number;
  ciiCosts?: number;
  fuelEUMaritimeCosts?: number;
  euETSCosts?: number;
  totalCosts?: number;
}

export interface Vessel extends ShipInfo, Partial<FleetMetrics> {
  id: string;
}

interface FleetSimulatorProps {
  vessels: Vessel[];
  onDeleteVessel: (id: string) => void;
  onEditVessel: (vessel: Vessel) => void;
  onAddVessel: () => void;
}

function formatNumber(value?: number, options?: Intl.NumberFormatOptions) {
  if (value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString(undefined, options);
}

function formatCurrency(value?: number) {
  if (value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function FleetSimulator({ vessels, onDeleteVessel, onEditVessel, onAddVessel }: FleetSimulatorProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Fleet Cost Summary</CardTitle>
            <CardDescription>Overview of compliance costs across the fleet</CardDescription>
          </div>
          <Button onClick={onAddVessel} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Vessel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {vessels.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium mb-2">No vessels added</p>
            <p className="text-sm mb-4">Calculate results and add a vessel to see the cost summary</p>
            <Button onClick={onAddVessel} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Vessel
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vessel Name</TableHead>
                  <TableHead className="text-right">Shipbuilding</TableHead>
                  <TableHead className="text-right">Fuel</TableHead>
                  <TableHead className="text-right">EEXI Compliance</TableHead>
                  <TableHead className="text-right">IMO GFI (Tier 1)</TableHead>
                  <TableHead className="text-right">IMO GFI (Tier 2)</TableHead>
                  <TableHead className="text-right">IMO GFI (Reward)</TableHead>
                  <TableHead className="text-right">CII Costs</TableHead>
                  <TableHead className="text-right">FuelEU Penalties</TableHead>
                  <TableHead className="text-right">EU ETS</TableHead>
                  <TableHead className="text-right font-bold">Total Costs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vessels.map((vessel) => (
                  <TableRow key={vessel.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{vessel.shipName}</span>
                        <span className="text-xs text-muted-foreground">{vessel.shipType} ({vessel.yearBuilt})</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-mono">
                      €{formatCurrency(vessel.shipbuildingCosts)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      €{formatCurrency(vessel.fuelCosts)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      €{formatCurrency(vessel.eexiCosts)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-amber-600">
                      {vessel.imoGFITier1Costs && vessel.imoGFITier1Costs > 0 ? `€${formatCurrency(vessel.imoGFITier1Costs)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-destructive">
                      {vessel.imoGFITier2Costs && vessel.imoGFITier2Costs > 0 ? `€${formatCurrency(vessel.imoGFITier2Costs)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-green-600">
                      {vessel.imoGFIRewardCosts && vessel.imoGFIRewardCosts > 0 ? `€${formatCurrency(vessel.imoGFIRewardCosts)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      €{formatCurrency(vessel.ciiCosts)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-destructive">
                      {vessel.fuelEUMaritimeCosts && vessel.fuelEUMaritimeCosts > 0 ? `€${formatCurrency(vessel.fuelEUMaritimeCosts)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-destructive">
                      {vessel.euETSCosts && vessel.euETSCosts > 0 ? `€${formatCurrency(vessel.euETSCosts)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      €{formatCurrency(vessel.totalCosts)}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditVessel(vessel)}
                          className="h-8 w-8"
                          title="Load Vessel Data"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteVessel(vessel.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete Vessel"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

