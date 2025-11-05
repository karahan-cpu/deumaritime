import { ShipInfoForm } from '../ShipInfoForm'

export default function ShipInfoFormExample() {
  return (
    <div className="max-w-3xl">
      <ShipInfoForm
        onSubmit={(data) => console.log('Form submitted:', data)}
        defaultValues={{
          shipName: "MV Ocean Pioneer",
          shipType: "Bulk Carrier",
          deadweight: 85000,
          grossTonnage: 52000,
          yearBuilt: 2020,
          isNewBuild: false,
        }}
      />
    </div>
  )
}
