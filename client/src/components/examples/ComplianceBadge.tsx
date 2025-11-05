import { ComplianceBadge } from '../ComplianceBadge'

export default function ComplianceBadgeExample() {
  return (
    <div className="flex gap-3">
      <ComplianceBadge status="compliant" />
      <ComplianceBadge status="warning" />
      <ComplianceBadge status="non-compliant" />
    </div>
  )
}
