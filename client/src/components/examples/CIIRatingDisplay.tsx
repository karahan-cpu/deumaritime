import { CIIRatingDisplay } from '../CIIRatingDisplay'

export default function CIIRatingDisplayExample() {
  return (
    <div className="space-y-4 max-w-md">
      <CIIRatingDisplay rating="A" attainedCII={4.2} requiredCII={5.8} />
      <CIIRatingDisplay rating="C" attainedCII={5.5} requiredCII={5.8} />
      <CIIRatingDisplay rating="E" attainedCII={7.2} requiredCII={5.8} />
    </div>
  )
}
