export function ClaimDetail({ claimId }: { claimId: string }) {
  return (
    <div className="p-inset">
      <h1 className="text-heading-lg font-semibold">{claimId}</h1>
    </div>
  )
}
