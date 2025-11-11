import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Plus } from "lucide-react";
import type { ShipInfo } from "@shared/schema";

interface Vessel extends ShipInfo {
  id: string;
}

interface FleetSimulatorProps {
  vessels: Vessel[];
  onDeleteVessel: (id: string) => void;
  onEditVessel: (vessel: Vessel) => void;
  onAddVessel: () => void;
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
                  <TableHead>Ship Name</TableHead>
                  <TableHead>Ship Type</TableHead>
                  <TableHead className="text-right">Deadweight (DWT)</TableHead>
                  <TableHead className="text-right">Gross Tonnage (GT)</TableHead>
                  <TableHead className="text-right">Year Built</TableHead>
                  <TableHead>New Build</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vessels.map((vessel) => (
                  <TableRow key={vessel.id}>
                    <TableCell className="font-medium">{vessel.shipName}</TableCell>
                    <TableCell>{vessel.shipType}</TableCell>
                    <TableCell className="text-right font-mono">
                      {vessel.deadweight.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {vessel.grossTonnage.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">{vessel.yearBuilt}</TableCell>
                    <TableCell>
                      {vessel.isNewBuild ? (
                        <span className="text-green-600 dark:text-green-400">Yes</span>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
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

