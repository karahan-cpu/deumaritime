import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Plus, Calculator, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AddVesselDialog } from "@/components/AddVesselDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { FleetVessel } from "@shared/schema";
import { nanoid } from "nanoid";

const DEFAULT_VESSELS: FleetVessel[] = [
  {
    id: "1",
    vesselName: "Bulk carrier 1",
    type: undefined,
    dwt: undefined,
    buildYear: undefined,
    eexi: 3.6,
    ciiRating: "E",
    ciiValue: 4.6,
    fuelEUStatus: undefined,
    euETSCost: undefined,
  },
  {
    id: "2",
    vesselName: "Bulk carrier 2",
    type: undefined,
    dwt: undefined,
    buildYear: undefined,
    eexi: 3.6,
    ciiRating: "D",
    ciiValue: 4.2,
    fuelEUStatus: undefined,
    euETSCost: undefined,
  },
  {
    id: "3",
    vesselName: "Container 1",
    type: undefined,
    dwt: undefined,
    buildYear: undefined,
    eexi: 25,
    ciiRating: "C",
    ciiValue: 20.4,
    fuelEUStatus: undefined,
    euETSCost: undefined,
  },
  {
    id: "4",
    vesselName: "Container 2",
    type: undefined,
    dwt: undefined,
    buildYear: undefined,
    eexi: 25,
    ciiRating: "C",
    ciiValue: 20,
    fuelEUStatus: undefined,
    euETSCost: undefined,
  },
  {
    id: "5",
    vesselName: "Container 3",
    type: undefined,
    dwt: undefined,
    buildYear: undefined,
    eexi: 17.51,
    ciiRating: "A",
    ciiValue: 11.9,
    fuelEUStatus: undefined,
    euETSCost: undefined,
  },
];

const STORAGE_KEY = "fleet_vessels";

function loadVesselsFromStorage(): FleetVessel[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load fleet vessels from storage:", error);
  }
  return DEFAULT_VESSELS;
}

function saveVesselsToStorage(vessels: FleetVessel[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vessels));
  } catch (error) {
    console.error("Failed to save fleet vessels to storage:", error);
  }
}

export default function Fleet() {
  const [vessels, setVessels] = useState<FleetVessel[]>(loadVesselsFromStorage);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    saveVesselsToStorage(vessels);
  }, [vessels]);

  const handleAddVessel = (vessel: Omit<FleetVessel, "id">) => {
    const newVessel: FleetVessel = {
      ...vessel,
      id: nanoid(),
    };
    setVessels([...vessels, newVessel]);
    setIsAddDialogOpen(false);
  };

  const handleDeleteVessel = (id: string) => {
    if (confirm("Are you sure you want to delete this vessel?")) {
      setVessels(vessels.filter((v) => v.id !== id));
    }
  };

  const getCIIBadgeColor = (rating?: string) => {
    switch (rating) {
      case "A":
        return "bg-green-500 text-white border-transparent hover:bg-green-600";
      case "B":
        return "bg-orange-400 text-white border-transparent hover:bg-orange-500";
      case "C":
        return "bg-yellow-500 text-white border-transparent hover:bg-yellow-600";
      case "D":
        return "bg-orange-500 text-white border-transparent hover:bg-orange-600";
      case "E":
        return "bg-red-500 text-white border-transparent hover:bg-red-600";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h1 className="text-xl font-semibold">Maritime Emissions Calculator</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="outline" data-testid="button-calculator-nav">
                <Calculator className="h-4 w-4" />
                Calculator
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Fleet Details</h2>
            <p className="text-muted-foreground mt-1">Manage and monitor your fleet vessels</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-vessel">
            <Plus className="h-4 w-4" />
            Add Vessel
          </Button>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#5B7C99] hover:bg-[#5B7C99] dark:bg-[#4A6580] dark:hover:bg-[#4A6580]">
                  <TableHead className="text-white font-semibold dark:text-white">Vessel name</TableHead>
                  <TableHead className="text-white font-semibold dark:text-white">Type</TableHead>
                  <TableHead className="text-white font-semibold dark:text-white">DWT</TableHead>
                  <TableHead className="text-white font-semibold dark:text-white">Build Year</TableHead>
                  <TableHead className="text-white font-semibold dark:text-white">EEXI</TableHead>
                  <TableHead className="text-white font-semibold dark:text-white">CII Rating</TableHead>
                  <TableHead className="text-white font-semibold dark:text-white">CII Value</TableHead>
                  <TableHead className="text-white font-semibold dark:text-white">FuelEU Status</TableHead>
                  <TableHead className="text-white font-semibold dark:text-white">EU ETS Cost</TableHead>
                  <TableHead className="text-white font-semibold dark:text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vessels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No vessels added yet. Click "Add Vessel" to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  vessels.map((vessel) => (
                    <TableRow key={vessel.id} data-testid={`vessel-row-${vessel.id}`}>
                      <TableCell className="font-medium" data-testid={`vessel-name-${vessel.id}`}>
                        {vessel.vesselName}
                      </TableCell>
                      <TableCell>{vessel.type || "N/A"}</TableCell>
                      <TableCell>{vessel.dwt || "N/A"}</TableCell>
                      <TableCell>{vessel.buildYear || "N/A"}</TableCell>
                      <TableCell>{vessel.eexi || "N/A"}</TableCell>
                      <TableCell>
                        {vessel.ciiRating ? (
                          <Badge
                            className={getCIIBadgeColor(vessel.ciiRating)}
                            data-testid={`cii-badge-${vessel.id}`}
                          >
                            {vessel.ciiRating}
                          </Badge>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>{vessel.ciiValue || "N/A"}</TableCell>
                      <TableCell>{vessel.fuelEUStatus || "N/A"}</TableCell>
                      <TableCell>{vessel.euETSCost || "N/A"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteVessel(vessel.id)}
                          data-testid={`button-delete-${vessel.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>

      <AddVesselDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddVessel}
      />
    </div>
  );
}
