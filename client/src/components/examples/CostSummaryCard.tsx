import { CostSummaryCard } from '../CostSummaryCard'

export default function CostSummaryCardExample() {
  const mockCosts = {
    shipbuildingCosts: 0,
    fuelCosts: 0,
    imoGFITier1Costs: 0,
    imoGFITier2Costs: 0,
    imoGFIRewardCosts: 0,
    ciiCosts: 0,
    fuelEUMaritimeCosts: 0,
    otherCosts: 2125000, // EU ETS Allowances
  }

  return (
    <div className="max-w-2xl">
      <CostSummaryCard costs={mockCosts} />
    </div>
  )
}
