import { EEDICalculator } from '../EEDICalculator'

export default function EEDICalculatorExample() {
  return (
    <div className="max-w-4xl">
      <EEDICalculator
        shipType="Bulk Carrier"
        isNewBuild={true}
        yearBuilt={2025}
      />
    </div>
  )
}
