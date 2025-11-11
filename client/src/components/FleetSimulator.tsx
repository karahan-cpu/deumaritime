import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Plus } from "lucide-react";
import type { ShipInfo } from "@shared/schema";

interface FleetMetrics {
  ciiScore2022?: number;
  ciiRating2022?: string;
  bestSister?: string;
  eexiOrEedi?: number;
  eeoi?: number;
  sumReduction2026?: number;
  ciiValue2026?: number;
  ciiRating2026?: string;
  sumReductionEOL?: number;
  ciiRatingEOL?: string;
  endOfLifetime?: number;
  capex?: number;
  opex?: number;
  balanceEOL?: number;
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

function formatPercentage(value?: number) {
  if (value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(1)}%`;
}

function formatRating(value?: string) {
  if (!value) return "—";
  return value.toUpperCase();
}

export function FleetSimulator({ vessels, onDeleteVessel, onEditVessel, onAddVessel }: FleetSimulatorProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Fleet Simulator</CardTitle>
            <CardDescription>Manage your fleet of vessels</CardDescription>
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
            <p className="text-lg font-medium mb-2">No vessels in fleet</p>
            <p className="text-sm mb-4">Add your first vessel to get started</p>
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
                  <TableHead>Vessel name</TableHead>
                  <TableHead className="text-right">CII score 2022</TableHead>
                  <TableHead className="text-center">CII rating 2022</TableHead>
                  <TableHead>Best Sister</TableHead>
                  <TableHead className="text-right">EEXI / EEDI</TableHead>
                  <TableHead className="text-right">EEOI</TableHead>
                  <TableHead className="text-right">Sum reduction 2026 (%)</TableHead>
                  <TableHead className="text-right">CII value 2026</TableHead>
                  <TableHead className="text-center">CII rating 2026</TableHead>
                  <TableHead className="text-right">Sum reduction EOL (%)</TableHead>
                  <TableHead className="text-center">CII rating EOL</TableHead>
                  <TableHead className="text-right">End of lifetime</TableHead>
                  <TableHead className="text-right">CAPEX</TableHead>
                  <TableHead className="text-right">OPEX</TableHead>
                  <TableHead className="text-right">CAPEX + OPEX</TableHead>
                  <TableHead className="text-right">Balance EOL</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vessels.map((vessel) => (
                  <TableRow key={vessel.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{vessel.shipName}</span>
                        <span className="text-xs text-muted-foreground">{vessel.shipType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(vessel.ciiScore2022, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatRating(vessel.ciiRating2022)}
                    </TableCell>
                    <TableCell>{vessel.bestSister || "—"}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(vessel.eexiOrEedi, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(vessel.eeoi, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatPercentage(vessel.sumReduction2026)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(vessel.ciiValue2026, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatRating(vessel.ciiRating2026)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatPercentage(vessel.sumReductionEOL)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-semibold">
                          {formatRating(vessel.ciiRatingEOL)}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {vessel.endOfLifetime ?? 2040}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(vessel.endOfLifetime)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(vessel.capex, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(vessel.opex, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(
                        vessel.capex !== undefined && vessel.opex !== undefined
                          ? vessel.capex + vessel.opex
                          : undefined,
                        { style: "currency", currency: "USD", maximumFractionDigits: 0 }
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(vessel.balanceEOL, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditVessel(vessel)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteVessel(vessel.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
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

