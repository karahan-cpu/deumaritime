import { CostSummaryCard } from '../CostSummaryCard'

export default function CostSummaryCardExample() {
  const mockCosts = [
    { label: "EU ETS Allowances", amount: 2125000, description: "70% coverage at €85/tonne" },
    { label: "FuelEU Maritime Penalty", amount: 0, description: "Compliant - no penalty" },
    { label: "GFI Compliance", amount: 185000, description: "Estimated mid-term measure costs" },
  ]

  return (
    <div className="max-w-2xl">
      <CostSummaryCard costs={mockCosts} />
    </div>
  )
}
